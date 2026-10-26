/**
 * PROGRESSION ENGINE
 * ==================
 * The authoritative backend for all stage-unlock and pass/fail decisions.
 *
 * Rules:
 * - A stage is unlocked only when every preceding stage has been PASSED.
 * - Failing a stage keeps the team on that stage (retry, not elimination).
 * - No frontend state alone can unlock a stage; this module is the authority.
 */

import type { CodingStageId } from '../types/codingChallenge'
import type { QuizSession, SectionId } from '../types/quiz'
import {
  GAME_PROGRESSION,
  GAME_STAGE_IDS,
  type GameStageId,
  getNextGameStage,
  getStageDefinition,
} from '../config/progressionConfig'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StageResult {
  /** Whether the team passed this stage (met or exceeded the threshold). */
  passed: boolean
  /** Correct answers or coding validation success. */
  score: number
  /** Total possible score for this stage. */
  total: number
  /** How many times the team has attempted this stage. */
  attempts: number
  /** Timestamp of the last attempt. */
  lastAttemptAt?: number
}

/** Keyed by GameStageId. Only contains stages that have been attempted. */
export type StageResultMap = Partial<Record<GameStageId, StageResult>>

/** Whether a coding stage has been passed. Sourced from useCodingChallenge completedStages. */
export type CodingStagePassMap = Partial<Record<CodingStageId, boolean>>

// ---------------------------------------------------------------------------
// Quiz Section Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluates a quiz section (MCQ or riddle) against the configured threshold.
 * This is the authoritative check — called only AFTER the player submits
 * all answers for that section.
 */
export function evaluateQuizSection(
  session: QuizSession,
  sectionId: SectionId,
): { passed: boolean; score: number; total: number } {
  const stageDef = GAME_PROGRESSION.find(
    (s) =>
      (s.type === 'quiz-section' || s.type === 'riddles') &&
      s.sectionId === sectionId,
  )
  if (!stageDef || (stageDef.type !== 'quiz-section' && stageDef.type !== 'riddles')) {
    // Shouldn't happen, but default to not-passed for safety
    return { passed: false, score: 0, total: 0 }
  }

  const sectionQuestions =
    sectionId === 1
      ? session.section1
      : sectionId === 2
        ? session.section2
        : session.section3

  let correct = 0
  for (const q of sectionQuestions) {
    const answer = session.answers[q.id]
    if (answer?.correct) correct++
  }

  const threshold = stageDef.passThreshold
  return {
    passed: correct >= threshold,
    score: correct,
    total: sectionQuestions.length,
  }
}

// ---------------------------------------------------------------------------
// Unlock derivation
// ---------------------------------------------------------------------------

/**
 * Given completed stage results and coding stage pass map, derives the full
 * set of unlocked stage IDs.
 *
 * A stage is unlocked when:
 * 1. It is the first stage (always unlocked), OR
 * 2. The immediately preceding stage has been passed.
 *
 * This function is the ONLY place that decides what is unlocked.
 * It is intentionally pure (no side-effects) so it can be called anywhere.
 */
export function deriveUnlockedStages(
  stageResults: StageResultMap,
  codingPassed: CodingStagePassMap,
): Set<GameStageId> {
  const unlocked = new Set<GameStageId>()

  for (let i = 0; i < GAME_STAGE_IDS.length; i++) {
    const stageId = GAME_STAGE_IDS[i]

    if (i === 0) {
      // First stage is always unlocked
      unlocked.add(stageId)
      continue
    }

    // Check if the previous stage has been passed
    const prevStageId = GAME_STAGE_IDS[i - 1]
    if (!unlocked.has(prevStageId)) break // Nothing beyond a locked stage can be unlocked

    const prevDef = getStageDefinition(prevStageId)
    let prevPassed = false

    if (prevDef.type === 'coding-stage') {
      prevPassed = Boolean(codingPassed[prevDef.codingStageId])
    } else {
      // quiz-section or riddles
      prevPassed = Boolean(stageResults[prevStageId]?.passed)
    }

    if (prevPassed) {
      unlocked.add(stageId)
    } else {
      break // No further stages can be unlocked
    }
  }

  return unlocked
}

/**
 * Returns whether a specific stage is currently unlocked.
 */
export function isStageUnlocked(
  stageId: GameStageId,
  stageResults: StageResultMap,
  codingPassed: CodingStagePassMap,
): boolean {
  return deriveUnlockedStages(stageResults, codingPassed).has(stageId)
}

/**
 * Returns the furthest stage the team is currently allowed to be on.
 * This is the last unlocked stage in the progression.
 */
export function getCurrentGameStage(
  stageResults: StageResultMap,
  codingPassed: CodingStagePassMap,
): GameStageId {
  const unlocked = deriveUnlockedStages(stageResults, codingPassed)
  let current: GameStageId = GAME_STAGE_IDS[0]
  for (const id of GAME_STAGE_IDS) {
    if (unlocked.has(id)) current = id
    else break
  }
  return current
}

/**
 * Returns whether the game has been fully completed.
 * The final stage is 'code-3' (debugging). Game is complete when code-3 is passed.
 */
export function isGameComplete(codingPassed: CodingStagePassMap): boolean {
  return Boolean(codingPassed['debugging'])
}

// ---------------------------------------------------------------------------
// Stage result helpers
// ---------------------------------------------------------------------------

/**
 * Records a new attempt result for a quiz section, preserving attempt count.
 * Call this every time a section is completed (pass or fail).
 */
export function recordStageAttempt(
  existing: StageResult | undefined,
  passed: boolean,
  score: number,
  total: number,
): StageResult {
  return {
    passed,
    score,
    total,
    attempts: (existing?.attempts ?? 0) + 1,
    lastAttemptAt: Date.now(),
  }
}

/**
 * Returns which coding stage should be the entry point when opening the
 * Python Code Lab, based on the current progression state.
 *
 * The team lands on the first coding stage that hasn't been passed yet,
 * as long as that stage is unlocked.
 */
export function getEntryCodeStage(
  stageResults: StageResultMap,
  codingPassed: CodingStagePassMap,
): CodingStageId {
  const codingStageOrder: Array<{ gameId: GameStageId; codingId: CodingStageId }> = [
    { gameId: 'code-1', codingId: 'part-1' },
    { gameId: 'code-2', codingId: 'part-2' },
    { gameId: 'code-3', codingId: 'debugging' },
  ]

  const unlocked = deriveUnlockedStages(stageResults, codingPassed)

  for (const { gameId, codingId } of codingStageOrder) {
    if (unlocked.has(gameId) && !codingPassed[codingId]) {
      return codingId
    }
  }

  // All coding stages passed — return last
  return 'debugging'
}

/**
 * Returns only the coding stages that are currently unlocked, as CodingStageIds.
 */
export function getUnlockedCodingStages(
  stageResults: StageResultMap,
  codingPassed: CodingStagePassMap,
): CodingStageId[] {
  const unlocked = deriveUnlockedStages(stageResults, codingPassed)
  const result: CodingStageId[] = []
  if (unlocked.has('code-1')) result.push('part-1')
  if (unlocked.has('code-2')) result.push('part-2')
  if (unlocked.has('code-3')) result.push('debugging')
  return result
}

/**
 * Given a coding stage ID that was just passed, records that in the coding
 * pass map and returns the next game stage to potentially unlock.
 */
export function getNextStageAfterCoding(
  codingStageId: CodingStageId,
): GameStageId | null {
  const gameStageMap: Record<CodingStageId, GameStageId> = {
    'part-1': 'code-1',
    'part-2': 'code-2',
    debugging: 'code-3',
  }
  const gameStageId = gameStageMap[codingStageId]
  return getNextGameStage(gameStageId)
}
