import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type {
  AnswerRecord,
  MCQOptionId,
  PlayerProfile,
  QuizPhase,
  QuizSession,
  QuizState,
  SectionId,
  ScoreSummary,
} from '../types/quiz'
import { computeScoreSummary } from '../utils/scoring'
import {
  createQuizSession,
  getCurrentQuestion,
  getSectionQuestions,
  isSessionComplete,
} from '../utils/session'
import { isRiddleAnswerCorrect } from '../utils/answers'
import {
  clearQuizState,
  loadQuizState,
  saveQuizState,
} from '../utils/persistence'
import {
  evaluateQuizSection,
  recordStageAttempt,
  type StageResultMap,
} from '../utils/progressionEngine'
import { sectionToStageId } from '../config/progressionConfig'
import { sample } from '../utils/shuffle'
import { SECTION_1_POOL, SECTION_2_POOL, RIDDLES } from '../data/questions'

import { syncTeamProgressToCloud } from '../services/firebaseSync'

type QuizAction =
  | { type: 'start'; session: QuizSession }
  | { type: 'restore'; state: QuizState }
  | { type: 'resume' }
  | { type: 'exit-to-home' }
  | { type: 'discard-saved' }
  | { type: 'answer-mcq'; optionId: MCQOptionId }
  | { type: 'answer-riddle'; text: string }
  | { type: 'advance' }
  /** Called after evaluating a completed section — either enters section break or stays for retry. */
  | { type: 'enter-next-section' }
  /** Retry the current section — reshuffles questions and clears answers for that section. */
  | { type: 'retry-section' }
  | { type: 'restart' }

const INITIAL_STAGE_RESULTS: StageResultMap = {}

const INITIAL_STATE: QuizState = {
  phase: 'welcome',
  session: null,
  currentSection: 1,
  currentIndex: 0,
  sectionBreak: null,
  stageResults: INITIAL_STAGE_RESULTS,
}

const EMPTY_SCORE: ScoreSummary = {
  totalCorrect: 0,
  totalIncorrect: 0,
  totalAnswered: 0,
  totalQuestions: 14,
  percentage: 0,
  sections: {
    1: { score: 0, total: 5 },
    2: { score: 0, total: 5 },
    3: { score: 0, total: 4 },
  },
}

function storeAnswer(
  state: QuizState,
  questionId: string,
  answer: AnswerRecord,
): QuizState {
  if (!state.session) return state
  return {
    ...state,
    session: {
      ...state.session,
      answers: { ...state.session.answers, [questionId]: answer },
    },
  }
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'start':
      return {
        phase: 'quiz',
        session: action.session,
        currentSection: 1,
        currentIndex: 0,
        sectionBreak: null,
        stageResults: {},
      }

    case 'restore':
      return action.state

    case 'resume': {
      if (!state.session) return state
      const targetPhase = state.savedPhase ?? (isSessionComplete(state.session) ? 'results' : 'quiz')
      return {
        ...state,
        phase: targetPhase,
      }
    }

    case 'exit-to-home':
      return {
        ...state,
        phase: 'welcome',
        savedPhase: state.phase === 'welcome' ? state.savedPhase : state.phase,
      }

    case 'discard-saved':
      return INITIAL_STATE

    case 'answer-mcq': {
      if (state.phase !== 'quiz' || state.sectionBreak || !state.session) {
        return state
      }
      const question = getCurrentQuestion(
        state.session,
        state.currentSection,
        state.currentIndex,
      )
      if (
        !question ||
        question.section === 3 ||
        state.session.answers[question.id]
      ) {
        return state
      }

      const option = question.options.find(
        (candidate) => candidate.id === action.optionId,
      )
      if (!option) return state

      const correctOption = question.options.find(
        (candidate) => candidate.id === question.correctOptionId,
      )
      if (!correctOption) return state

      return storeAnswer(state, question.id, {
        submitted: option.text,
        optionId: option.id,
        correct: option.id === question.correctOptionId,
        correctAnswer: correctOption.text,
      })
    }

    case 'answer-riddle': {
      if (state.phase !== 'quiz' || state.sectionBreak || !state.session) {
        return state
      }
      const question = getCurrentQuestion(
        state.session,
        state.currentSection,
        state.currentIndex,
      )
      if (
        !question ||
        question.section !== 3 ||
        state.session.answers[question.id]
      ) {
        return state
      }

      const submitted = action.text.trim()
      if (!submitted) return state

      return storeAnswer(state, question.id, {
        submitted,
        correct: isRiddleAnswerCorrect(submitted, question.answerKey),
        correctAnswer: question.answerKey.canonical,
      })
    }

    case 'advance': {
      if (state.phase !== 'quiz' || state.sectionBreak || !state.session) {
        return state
      }
      const question = getCurrentQuestion(
        state.session,
        state.currentSection,
        state.currentIndex,
      )
      if (!question || !state.session.answers[question.id]) return state

      const sectionQuestions = getSectionQuestions(
        state.session,
        state.currentSection,
      )
      const isLastInSection =
        state.currentIndex === sectionQuestions.length - 1

      if (!isLastInSection) {
        return { ...state, currentIndex: state.currentIndex + 1 }
      }

      // Last question in section — evaluate pass/fail and record result
      const evaluation = evaluateQuizSection(state.session, state.currentSection)
      const stageId = sectionToStageId(state.currentSection)
      const existingResult = state.stageResults[stageId]
      const newResult = recordStageAttempt(
        existingResult,
        evaluation.passed,
        evaluation.score,
        evaluation.total,
      )

      return {
        ...state,
        sectionBreak: state.currentSection,
        stageResults: {
          ...state.stageResults,
          [stageId]: newResult,
        },
      }
    }

    case 'enter-next-section': {
      if (state.phase !== 'quiz' || state.sectionBreak === null) {
        return state
      }

      const stageId = sectionToStageId(state.sectionBreak)
      const result = state.stageResults[stageId]

      // If not passed, stay on same section — retry-section must be dispatched explicitly
      if (!result?.passed) return state

      if (state.sectionBreak === 3) {
        // Riddles passed — transition to results. The coding stages are separate.
        if (!state.session || !isSessionComplete(state.session)) return state
        return { ...state, phase: 'results', sectionBreak: null }
      }

      // Advance to next quiz section
      return {
        ...state,
        currentSection: (state.sectionBreak + 1) as SectionId,
        currentIndex: 0,
        sectionBreak: null,
      }
    }

    case 'retry-section': {
      if (
        state.phase !== 'quiz' ||
        state.sectionBreak === null ||
        !state.session
      ) {
        return state
      }

      const failedSection = state.sectionBreak

      // Build a new session with fresh questions for the failed section,
      // preserving answers for all other sections.
      // We re-use the same session pool by sampling again from the static pool.
      let newSection1 = state.session.section1
      let newSection2 = state.session.section2
      let newSection3 = state.session.section3

      if (failedSection === 1) {
        newSection1 = sample(SECTION_1_POOL, 5)
      } else if (failedSection === 2) {
        newSection2 = sample(SECTION_2_POOL, 5)
      } else {
        newSection3 = [...RIDDLES]
      }

      // Remove answers for the retried section
      const idsToRemove = new Set(
        (failedSection === 1
          ? state.session.section1
          : failedSection === 2
            ? state.session.section2
            : state.session.section3
        ).map((q) => q.id),
      )

      const filteredAnswers: Record<string, AnswerRecord> = {}
      for (const [id, answer] of Object.entries(state.session.answers)) {
        if (!idsToRemove.has(id)) {
          filteredAnswers[id] = answer
        }
      }

      const newSession: QuizSession = {
        ...state.session,
        section1: newSection1,
        section2: newSection2,
        section3: newSection3,
        answers: filteredAnswers,
      }

      return {
        ...state,
        session: newSession,
        currentSection: failedSection,
        currentIndex: 0,
        sectionBreak: null,
      }
    }

    case 'restart':
      return INITIAL_STATE

    default:
      return state
  }
}

export interface UseQuizResult {
  phase: QuizPhase
  session: QuizSession | null
  currentSection: SectionId
  currentIndex: number
  currentQuestion: ReturnType<typeof getCurrentQuestion>
  currentAnswer: AnswerRecord | undefined
  sectionBreak: SectionId | null
  score: ScoreSummary
  stageResults: StageResultMap
  isAnswered: boolean
  answeredInSection: number
  nextLabel: string
  hasSavedSession: boolean
  savedTeamName: string | null
  /** Whether the current section break represents a PASSED stage. */
  currentSectionPassed: boolean
  /** Whether the current section break represents a FAILED stage. */
  currentSectionFailed: boolean
  startQuiz: (profile: PlayerProfile) => void
  resumeQuiz: () => void
  restoreSession: (restoredState: QuizState) => void
  exitToHome: () => void
  discardSavedSession: () => void
  selectOption: (optionId: MCQOptionId) => void
  submitRiddle: (text: string) => void
  advance: () => void
  enterNextSection: () => void
  retrySection: () => void
  restart: () => void
}

export function useQuiz(codingStagesCompleted = 0): UseQuizResult {
  const [state, dispatch] = useReducer(
    quizReducer,
    undefined,
    () => {
      const stored = loadQuizState()
      if (stored && stored.session) {
        return {
          ...stored,
          phase: 'welcome' as const,
          savedPhase: stored.phase,
        }
      }
      return INITIAL_STATE
    },
  )

  const currentQuestion = useMemo(
    () =>
      state.session
        ? getCurrentQuestion(
            state.session,
            state.currentSection,
            state.currentIndex,
          )
        : undefined,
    [state.session, state.currentSection, state.currentIndex],
  )

  const sectionQuestions = useMemo(
    () =>
      state.session
        ? getSectionQuestions(state.session, state.currentSection)
        : [],
    [state.session, state.currentSection],
  )

  const currentAnswer = currentQuestion
    ? state.session?.answers[currentQuestion.id]
    : undefined

  const score = useMemo(
    () => (state.session ? computeScoreSummary(state.session) : EMPTY_SCORE),
    [state.session],
  )

  // Every committed state change is written immediately to localStorage and Firebase Firestore
  useEffect(() => {
    saveQuizState(state)
    if (state.session) {
      syncTeamProgressToCloud(
        state.session,
        score,
        state.currentSection,
        state.currentIndex,
        state.sectionBreak,
        state.phase === 'welcome' ? (state.savedPhase ?? 'quiz') : state.phase,
        codingStagesCompleted,
      )
    }
  }, [state, score, codingStagesCompleted])

  const answeredInSection = useMemo(
    () =>
      sectionQuestions.filter((question) =>
        Boolean(state.session?.answers[question.id]),
      ).length,
    [sectionQuestions, state.session],
  )

  const isAnswered = Boolean(currentAnswer)
  const isLastInSection =
    sectionQuestions.length > 0 &&
    state.currentIndex === sectionQuestions.length - 1

  let nextLabel = 'Next Question'
  if (isLastInSection) {
    if (state.currentSection < 3) {
      nextLabel = `Finish Section 0${state.currentSection}`
    } else {
      nextLabel = 'Submit Answers'
    }
  }

  // Derive pass/fail for the current section break
  const currentSectionPassed = useMemo(() => {
    if (state.sectionBreak === null) return false
    const stageId = sectionToStageId(state.sectionBreak)
    return Boolean(state.stageResults[stageId]?.passed)
  }, [state.sectionBreak, state.stageResults])

  const currentSectionFailed = state.sectionBreak !== null && !currentSectionPassed

  const startQuiz = useCallback((profile: PlayerProfile) => {
    const session = createQuizSession(profile)
    dispatch({ type: 'start', session })
  }, [])

  const resumeQuiz = useCallback(() => {
    dispatch({ type: 'resume' })
  }, [])

  const restoreSession = useCallback((restoredState: QuizState) => {
    dispatch({ type: 'restore', state: restoredState })
  }, [])

  const exitToHome = useCallback(() => {
    dispatch({ type: 'exit-to-home' })
  }, [])

  const discardSavedSession = useCallback(() => {
    clearQuizState()
    dispatch({ type: 'discard-saved' })
  }, [])

  const selectOption = useCallback((optionId: MCQOptionId) => {
    dispatch({ type: 'answer-mcq', optionId })
  }, [])

  const submitRiddle = useCallback((text: string) => {
    dispatch({ type: 'answer-riddle', text })
  }, [])

  const advance = useCallback(() => {
    dispatch({ type: 'advance' })
  }, [])

  const enterNextSection = useCallback(() => {
    dispatch({ type: 'enter-next-section' })
  }, [])

  const retrySection = useCallback(() => {
    dispatch({ type: 'retry-section' })
  }, [])

  const restart = useCallback(() => {
    clearQuizState()
    dispatch({ type: 'restart' })
  }, [])

  return {
    phase: state.phase,
    session: state.session,
    currentSection: state.currentSection,
    currentIndex: state.currentIndex,
    currentQuestion,
    currentAnswer,
    sectionBreak: state.sectionBreak,
    score,
    stageResults: state.stageResults,
    isAnswered,
    answeredInSection,
    nextLabel,
    hasSavedSession: Boolean(state.session),
    savedTeamName: state.session?.profile.teamName ?? null,
    currentSectionPassed,
    currentSectionFailed,
    startQuiz,
    resumeQuiz,
    restoreSession,
    exitToHome,
    discardSavedSession,
    selectOption,
    submitRiddle,
    advance,
    enterNextSection,
    retrySection,
    restart,
  }
}
