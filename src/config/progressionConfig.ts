/**
 * CENTRALIZED GAME PROGRESSION DEFINITION
 * =========================================
 * This is the single authoritative source for the game's stage order,
 * pass thresholds, and retry rules.
 *
 * Sequence:
 *   Quiz Section 1 → Code 1 → Quiz Section 2 → Code 2 → Riddles → Code 3 (Debugging) → Complete
 *
 * To change a threshold, update the value here. Nothing else needs to change.
 */

import type { CodingStageId } from '../types/codingChallenge'
import type { SectionId } from '../types/quiz'

// ---------------------------------------------------------------------------
// CONFIGURABLE THRESHOLDS
// Both quiz sections now show 10 questions each. Teams must answer at least
// 6 questions correctly to pass each section. Unlimited retry attempts are
// allowed if a section is failed.
// ---------------------------------------------------------------------------
export const PROGRESSION_THRESHOLDS = {
  section1: {
    questionsShown: 10,
    /** Minimum correct answers required to pass Section 1. */
    passThreshold: 6,
  },
  section2: {
    questionsShown: 10,
    /** Minimum correct answers required to pass Section 2. */
    passThreshold: 6,
  },
  riddles: {
    questionsShown: 4,
    /** User needs only 1 riddle correct to pass.
     * All answers shown after user answers all 4 riddles. */
    passThreshold: 1,
  },
} as const

// ---------------------------------------------------------------------------
// STAGE IDs — exhaustive union of all sequential game stages
// ---------------------------------------------------------------------------
export type GameStageId =
  | 'quiz-section-1'
  | 'code-1'
  | 'quiz-section-2'
  | 'code-2'
  | 'riddles'
  | 'code-3'

export const GAME_STAGE_IDS: readonly GameStageId[] = [
  'quiz-section-1',
  'code-1',
  'quiz-section-2',
  'code-2',
  'riddles',
  'code-3',
]

// ---------------------------------------------------------------------------
// STAGE DEFINITIONS — the ordered progression
// ---------------------------------------------------------------------------
export type GameStageType = 'quiz-section' | 'coding-stage' | 'riddles'

interface QuizSectionStage {
  id: GameStageId
  type: 'quiz-section'
  sectionId: SectionId
  label: string
  passThreshold: number
  questionsShown: number
}

interface CodingStageEntry {
  id: GameStageId
  type: 'coding-stage'
  codingStageId: CodingStageId
  label: string
}

interface RiddleStage {
  id: GameStageId
  type: 'riddles'
  sectionId: SectionId
  label: string
  passThreshold: number
  questionsShown: number
}

export type GameStageDefinition = QuizSectionStage | CodingStageEntry | RiddleStage

export const GAME_PROGRESSION: readonly GameStageDefinition[] = [
  {
    id: 'quiz-section-1',
    type: 'quiz-section',
    sectionId: 1,
    label: 'Quiz — Section 1',
    passThreshold: PROGRESSION_THRESHOLDS.section1.passThreshold,
    questionsShown: PROGRESSION_THRESHOLDS.section1.questionsShown,
  },
  {
    id: 'code-1',
    type: 'coding-stage',
    codingStageId: 'part-1',
    label: 'Python Code Lab — Stage 1',
  },
  {
    id: 'quiz-section-2',
    type: 'quiz-section',
    sectionId: 2,
    label: 'Quiz — Section 2',
    passThreshold: PROGRESSION_THRESHOLDS.section2.passThreshold,
    questionsShown: PROGRESSION_THRESHOLDS.section2.questionsShown,
  },
  {
    id: 'code-2',
    type: 'coding-stage',
    codingStageId: 'part-2',
    label: 'Python Code Lab — Stage 2',
  },
  {
    id: 'riddles',
    type: 'riddles',
    sectionId: 3,
    label: 'Riddle Round',
    passThreshold: PROGRESSION_THRESHOLDS.riddles.passThreshold,
    questionsShown: PROGRESSION_THRESHOLDS.riddles.questionsShown,
  },
  {
    id: 'code-3',
    type: 'coding-stage',
    codingStageId: 'debugging',
    label: 'Python Code Lab — Stage 3 (Debugging)',
  },
]

/** Returns the index of a stage in the progression (0-based). */
export function getStageIndex(id: GameStageId): number {
  return GAME_STAGE_IDS.indexOf(id)
}

/** Returns the stage definition for a given id. */
export function getStageDefinition(id: GameStageId): GameStageDefinition {
  const stage = GAME_PROGRESSION.find((s) => s.id === id)
  if (!stage) throw new Error(`Unknown game stage: ${id}`)
  return stage
}

/** Returns the next stage in the sequence, or null if this is the last. */
export function getNextGameStage(id: GameStageId): GameStageId | null {
  const idx = getStageIndex(id)
  if (idx < 0 || idx >= GAME_STAGE_IDS.length - 1) return null
  return GAME_STAGE_IDS[idx + 1]
}

/**
 * Maps a quiz SectionId to the corresponding GameStageId.
 * Section 1 → quiz-section-1, Section 2 → quiz-section-2, Section 3 (riddles) → riddles.
 */
export function sectionToStageId(sectionId: SectionId): GameStageId {
  if (sectionId === 1) return 'quiz-section-1'
  if (sectionId === 2) return 'quiz-section-2'
  return 'riddles'
}

/**
 * Maps a coding stage id to its corresponding game stage.
 */
export function codingStageToGameStage(
  codingStageId: CodingStageId,
): GameStageId {
  if (codingStageId === 'part-1') return 'code-1'
  if (codingStageId === 'part-2') return 'code-2'
  return 'code-3'
}
