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
  loadQuizState,
  saveQuizState,
} from '../utils/persistence'

type QuizAction =
  | { type: 'start'; session: QuizSession }
  | { type: 'answer-mcq'; optionId: MCQOptionId }
  | { type: 'answer-riddle'; text: string }
  | { type: 'advance' }
  | { type: 'enter-next-section' }
  | { type: 'restart' }

const INITIAL_STATE: QuizState = {
  phase: 'welcome',
  session: null,
  currentSection: 1,
  currentIndex: 0,
  sectionBreak: null,
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
      }

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

      if (state.currentSection < 3) {
        return { ...state, sectionBreak: state.currentSection }
      }

      if (!isSessionComplete(state.session)) return state

      return { ...state, sectionBreak: 3 }
    }

    case 'enter-next-section': {
      if (
        state.phase !== 'quiz' ||
        state.sectionBreak === null
      ) {
        return state
      }
      if (state.sectionBreak === 3) {
        if (!state.session || !isSessionComplete(state.session)) return state
        return { ...state, phase: 'results', sectionBreak: null }
      }
      return {
        ...state,
        currentSection: (state.sectionBreak + 1) as SectionId,
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
  isAnswered: boolean
  answeredInSection: number
  nextLabel: string
  startQuiz: (profile: PlayerProfile) => void
  selectOption: (optionId: MCQOptionId) => void
  submitRiddle: (text: string) => void
  advance: () => void
  enterNextSection: () => void
  restart: () => void
}

export function useQuiz(): UseQuizResult {
  const [state, dispatch] = useReducer(
    quizReducer,
    undefined,
    () => loadQuizState() ?? INITIAL_STATE,
  )

  // Every committed state change is written immediately, including each
  // submitted answer. The welcome phase clears the previous attempt.
  useEffect(() => {
    saveQuizState(state)
  }, [state])

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
      nextLabel = 'Finish & View Results'
    }
  }

  const startQuiz = useCallback((profile: PlayerProfile) => {
    // Randomization happens here and only here for a session.
    const session = createQuizSession(profile)
    dispatch({ type: 'start', session })
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

  const restart = useCallback(() => {
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
    isAnswered,
    answeredInSection,
    nextLabel,
    startQuiz,
    selectOption,
    submitRiddle,
    advance,
    enterNextSection,
    restart,
  }
}
