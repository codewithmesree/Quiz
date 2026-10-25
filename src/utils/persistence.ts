import { MCQ_BY_ID, RIDDLE_BY_ID } from '../data/questions'
import type {
  AnswerRecord,
  MCQOptionId,
  MCQQuestion,
  QuizSession,
  QuizState,
  RiddleQuestion,
  SectionId,
} from '../types/quiz'
import { isRiddleAnswerCorrect } from './answers'
import { isSessionComplete } from './session'

/**
 * Versioned localStorage snapshot of the active quiz attempt.
 *
 * Only the selected question ids are trusted from storage: the question,
 * options and answer keys are rehydrated from the authoritative bank so a
 * refresh can never rewrite quiz content or marking rules.
 */
export const QUIZ_STORAGE_KEY = 'hwi-saiu-quiz-state'
const STORAGE_VERSION = 1
const MCQ_OPTION_IDS: readonly MCQOptionId[] = ['A', 'B', 'C', 'D']

interface StoredQuizState {
  version: number
  state: QuizState
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOptionId(value: unknown): value is MCQOptionId {
  return (
    typeof value === 'string' &&
    (MCQ_OPTION_IDS as readonly string[]).includes(value)
  )
}

function parseMcqSection(
  value: unknown,
  section: 1 | 2,
): MCQQuestion[] | null {
  if (!Array.isArray(value) || value.length !== 5) return null

  const questions: MCQQuestion[] = []
  const seen = new Set<string>()

  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== 'string') return null
    const question = MCQ_BY_ID[item.id]
    if (!question || question.section !== section || seen.has(question.id)) {
      return null
    }
    seen.add(question.id)
    questions.push(question)
  }

  return questions
}

function parseRiddleSection(value: unknown): RiddleQuestion[] | null {
  if (!Array.isArray(value) || value.length !== 4) return null

  const riddles: RiddleQuestion[] = []
  const seen = new Set<string>()

  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== 'string') return null
    const riddle = RIDDLE_BY_ID[item.id]
    if (!riddle || seen.has(riddle.id)) return null
    seen.add(riddle.id)
    riddles.push(riddle)
  }

  return riddles
}

function parseAnswers(
  value: unknown,
  session: QuizSession,
): Record<string, AnswerRecord> | null {
  if (!isRecord(value)) return null

  const allQuestions = [
    ...session.section1,
    ...session.section2,
    ...session.section3,
  ]
  const questionById = new Map(allQuestions.map((question) => [question.id, question]))
  const answers: Record<string, AnswerRecord> = {}

  for (const [questionId, stored] of Object.entries(value)) {
    const question = questionById.get(questionId)
    if (!question || !isRecord(stored)) continue

    if (question.section === 3) {
      if (typeof stored.submitted !== 'string' || !stored.submitted.trim()) {
        continue
      }
      answers[questionId] = {
        submitted: stored.submitted,
        correct: isRiddleAnswerCorrect(
          stored.submitted,
          question.answerKey,
        ),
        correctAnswer: question.answerKey.canonical,
      }
      continue
    }

    if (!isOptionId(stored.optionId)) continue
    const option = question.options.find(
      (candidate) => candidate.id === stored.optionId,
    )
    const correctOption = question.options.find(
      (candidate) => candidate.id === question.correctOptionId,
    )
    if (!option || !correctOption) continue

    answers[questionId] = {
      submitted: option.text,
      optionId: option.id,
      correct: option.id === question.correctOptionId,
      correctAnswer: correctOption.text,
    }
  }

  return answers
}

function parseSession(value: unknown): QuizSession | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || !value.id) return null
  if (
    !isRecord(value.profile) ||
    typeof value.profile.teamName !== 'string' ||
    !value.profile.teamName.trim()
  ) {
    return null
  }

  const section1 = parseMcqSection(value.section1, 1)
  const section2 = parseMcqSection(value.section2, 2)
  const section3 = parseRiddleSection(value.section3)
  if (!section1 || !section2 || !section3) return null

  const session: QuizSession = {
    id: value.id,
    profile: { teamName: value.profile.teamName.trim() },
    section1,
    section2,
    section3,
    answers: {},
  }

  const answers = parseAnswers(value.answers, session)
  if (!answers) return null

  return { ...session, answers }
}

function parseSectionId(value: unknown): SectionId | null {
  return value === 1 || value === 2 || value === 3 ? value : null
}

function parseState(value: unknown): QuizState | null {
  if (!isRecord(value)) return null
  if (value.phase !== 'quiz' && value.phase !== 'results') return null

  const session = parseSession(value.session)
  const currentSection = parseSectionId(value.currentSection)
  if (!session || !currentSection) return null

  const currentIndex = value.currentIndex
  if (
    typeof currentIndex !== 'number' ||
    !Number.isInteger(currentIndex) ||
    currentIndex < 0
  ) {
    return null
  }

  const sectionLength = currentSection === 3 ? 4 : 5
  if (currentIndex >= sectionLength) return null

  const sectionBreak = value.sectionBreak
  if (sectionBreak !== null) {
    if (sectionBreak !== 1 && sectionBreak !== 2 && sectionBreak !== 3) {
      return null
    }
    if (sectionBreak !== currentSection) return null
    if (currentIndex !== sectionLength - 1) return null
    if (sectionBreak === 3 && !isSessionComplete(session)) return null
  }

  if (value.phase === 'results') {
    if (!isSessionComplete(session) || sectionBreak !== null) return null
  }

  return {
    phase: value.phase,
    session,
    currentSection,
    currentIndex,
    sectionBreak,
  }
}

/** Reads and validates a saved attempt. Returns null when absent or unusable. */
export function loadQuizState(): QuizState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) return null

    return parseState(parsed.state)
  } catch {
    return null
  }
}

/** Saves the attempt. The welcome screen intentionally keeps no snapshot. */
export function saveQuizState(state: QuizState): void {
  if (typeof window === 'undefined') return

  if (state.phase === 'welcome') {
    clearQuizState()
    return
  }

  try {
    const payload: StoredQuizState = {
      version: STORAGE_VERSION,
      state,
    }
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage can be unavailable (private mode/quota); the quiz still works.
  }
}

export function clearQuizState(): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(QUIZ_STORAGE_KEY)
  } catch {
    // Ignore storage access failures.
  }
}
