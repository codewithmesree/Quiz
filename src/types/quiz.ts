/**
 * Shared quiz domain types.
 *
 * The answer key lives in `src/data/questions.ts`; UI components only receive
 * the session data needed to render a question.
 */

export type SectionId = 1 | 2 | 3

export type MCQOptionId = 'A' | 'B' | 'C' | 'D'

export interface MCQOption {
  id: MCQOptionId
  text: string
}

export interface MCQQuestion {
  id: string
  section: 1 | 2
  prompt: string
  options: readonly MCQOption[]
  correctOptionId: MCQOptionId
  /**
   * Only used for questions where the source document itself flags that the
   * answer is intended rather than definitive (e.g. storage capacity).
   */
  answerNote?: string
}

export interface RiddleAnswerKey {
  /** The answer shown on the results screen. */
  canonical: string
  /**
   * All accepted normalized variants. The normalizer ignores case, articles,
   * punctuation and repeated whitespace, so entries can be written naturally.
   */
  accepted: readonly string[]
  note?: string
}

export interface RiddleQuestion {
  id: string
  section: 3
  prompt: string
  answerKey: RiddleAnswerKey
}

export type AnyQuestion = MCQQuestion | RiddleQuestion

export interface PlayerProfile {
  teamName: string
}

/** A submitted answer is created once and never mutated. */
export interface AnswerRecord {
  /** Option text for multiple choice; raw typed text for a riddle. */
  submitted: string
  /** Present for multiple-choice answers. */
  optionId?: MCQOptionId
  correct: boolean
  /** The expected answer, safe to show because the question is now locked. */
  correctAnswer: string
}

export interface QuizSession {
  id: string
  profile: PlayerProfile
  section1: readonly MCQQuestion[]
  section2: readonly MCQQuestion[]
  section3: readonly RiddleQuestion[]
  /** Keyed by question id. A key can only ever be written once. */
  answers: Readonly<Record<string, AnswerRecord>>
}

export type QuizPhase = 'welcome' | 'quiz' | 'results'

/**
 * Complete runtime state of a quiz attempt. Persisted to localStorage so a
 * refresh resumes exactly where the team left off.
 */
export interface QuizState {
  phase: QuizPhase
  session: QuizSession | null
  currentSection: SectionId
  currentIndex: number
  /** Set after the final question of section 1 or 2 is completed. */
  sectionBreak: SectionId | null
}

export type SectionScoreMap = Record<SectionId, { score: number; total: number }>

export interface ScoreSummary {
  totalCorrect: number
  totalIncorrect: number
  totalAnswered: number
  totalQuestions: number
  percentage: number
  sections: SectionScoreMap
}

export interface SectionMeta {
  id: SectionId
  eyebrow: string
  name: string
  shortName: string
  description: string
  count: number
  type: 'mcq' | 'riddle'
}
