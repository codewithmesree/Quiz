import { RIDDLES, SECTION_1_POOL, SECTION_2_POOL, TOTAL_QUESTIONS } from '../data/questions'
import type {
  AnyQuestion,
  MCQQuestion,
  PlayerProfile,
  QuizSession,
  RiddleQuestion,
  SectionId,
} from '../types/quiz'
import { sample } from './shuffle'

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * Creates a brand-new quiz session.
 *
 * Random selection happens exactly once here — never during rendering. Both
 * MCQ pools are shuffled independently, and the four riddles always appear in
 * their original document order. Sections 1 and 2 now use all 10 questions.
 */
export function createQuizSession(profile: PlayerProfile): QuizSession {
  return {
    id: createSessionId(),
    profile: {
      teamName: profile.teamName.trim(),
    },
    section1: sample(SECTION_1_POOL, 10),
    section2: sample(SECTION_2_POOL, 10),
    section3: [...RIDDLES],
    answers: {},
  }
}

export function getSectionQuestions(
  session: QuizSession,
  section: SectionId,
): readonly AnyQuestion[] {
  if (section === 1) return session.section1
  if (section === 2) return session.section2
  return session.section3
}

export function getSectionMCQQuestions(
  session: QuizSession,
  section: 1 | 2,
): readonly MCQQuestion[] {
  return section === 1 ? session.section1 : session.section2
}

export function getRiddles(session: QuizSession): readonly RiddleQuestion[] {
  return session.section3
}

export function getCurrentQuestion(
  session: QuizSession,
  section: SectionId,
  index: number,
): AnyQuestion | undefined {
  return getSectionQuestions(session, section)[index]
}

export function isSessionComplete(session: QuizSession): boolean {
  const allQuestions = [
    ...session.section1,
    ...session.section2,
    ...session.section3,
  ]
  return (
    allQuestions.length === TOTAL_QUESTIONS &&
    allQuestions.every((question) => Boolean(session.answers[question.id]))
  )
}
