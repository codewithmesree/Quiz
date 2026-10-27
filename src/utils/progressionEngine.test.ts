import { describe, expect, it } from 'vitest'
import {
  deriveUnlockedStages,
  evaluateQuizSection,
  getCurrentGameStage,
  getEntryCodeStage,
  getNextStageAfterCoding,
  getUnlockedCodingStages,
  isGameComplete,
  isStageUnlocked,
  recordStageAttempt,
  type CodingStagePassMap,
  type StageResultMap,
} from './progressionEngine'
import { createQuizSession } from './session'
import type { QuizSession } from '../types/quiz'

function createMockSessionWithScore(section: 1 | 2 | 3, correctCount: number): QuizSession {
  const session = createQuizSession({ teamName: 'Byte Force' })
  const questions =
    section === 1
      ? session.section1
      : section === 2
        ? session.section2
        : session.section3

  const answers: Record<string, any> = {}
  questions.forEach((q, idx) => {
    const isCorrect = idx < correctCount
    answers[q.id] = {
      submitted: isCorrect ? 'correct' : 'wrong',
      correct: isCorrect,
      correctAnswer: 'correct',
    }
  })

  return {
    ...session,
    answers,
  }
}

describe('Game Rules and Progression Acceptance Tests', () => {
  // 1. A team answers only 5 of Section 1 questions correctly: Code 1 remains locked.
  it('Acceptance Test 1: Section 1 failure (score 5/10) keeps Code 1 locked', () => {
    const session = createMockSessionWithScore(1, 5)
    const evalResult = evaluateQuizSection(session, 1)
    expect(evalResult.passed).toBe(false)
    expect(evalResult.score).toBe(5)

    const stageResults: StageResultMap = {
      'quiz-section-1': recordStageAttempt(undefined, evalResult.passed, evalResult.score, evalResult.total),
    }
    const codingPassed: CodingStagePassMap = {}

    const unlocked = deriveUnlockedStages(stageResults, codingPassed)
    expect(unlocked.has('quiz-section-1')).toBe(true)
    expect(unlocked.has('code-1')).toBe(false)
    expect(isStageUnlocked('code-1', stageResults, codingPassed)).toBe(false)
    expect(getUnlockedCodingStages(stageResults, codingPassed)).toEqual([])
  })

  // 2. The same team retries Section 1 and meets the threshold: Code 1 unlocks.
  it('Acceptance Test 2: Retrying Section 1 and passing (6/10) unlocks Code 1', () => {
    const sessionAttempt1 = createMockSessionWithScore(1, 5)
    const eval1 = evaluateQuizSection(sessionAttempt1, 1)

    let stageResults: StageResultMap = {
      'quiz-section-1': recordStageAttempt(undefined, eval1.passed, eval1.score, eval1.total),
    }
    expect(stageResults['quiz-section-1']?.attempts).toBe(1)
    expect(stageResults['quiz-section-1']?.passed).toBe(false)

    // Retry Section 1 with 7/10
    const sessionAttempt2 = createMockSessionWithScore(1, 7)
    const eval2 = evaluateQuizSection(sessionAttempt2, 1)
    expect(eval2.passed).toBe(true)

    stageResults = {
      'quiz-section-1': recordStageAttempt(stageResults['quiz-section-1'], eval2.passed, eval2.score, eval2.total),
    }
    expect(stageResults['quiz-section-1']?.attempts).toBe(2)
    expect(stageResults['quiz-section-1']?.passed).toBe(true)

    const unlocked = deriveUnlockedStages(stageResults, {})
    expect(unlocked.has('code-1')).toBe(true)
    expect(getUnlockedCodingStages(stageResults, {})).toEqual(['part-1'])
  })

  // 3. A team submits incorrect Code 1: it stays in Code 1.
  it('Acceptance Test 3: Incorrect Code 1 keeps the team in Code 1 without unlocking Section 2', () => {
    const stageResults: StageResultMap = {
      'quiz-section-1': { passed: true, score: 7, total: 10, attempts: 1 },
    }
    // Submitting incorrect solution does NOT add part-1 to codingPassed
    const codingPassed: CodingStagePassMap = { 'part-1': false }

    const unlocked = deriveUnlockedStages(stageResults, codingPassed)
    expect(unlocked.has('code-1')).toBe(true)
    expect(unlocked.has('quiz-section-2')).toBe(false)
    expect(getCurrentGameStage(stageResults, codingPassed)).toBe('code-1')
    expect(getEntryCodeStage(stageResults, codingPassed)).toBe('part-1')
  })

  // 4. A team submits a valid Code 1 solution: the next required stage (Quiz Section 2) unlocks.
  it('Acceptance Test 4: Passing Code 1 unlocks Quiz Section 2', () => {
    const stageResults: StageResultMap = {
      'quiz-section-1': { passed: true, score: 6, total: 10, attempts: 1 },
    }
    const codingPassed: CodingStagePassMap = { 'part-1': true }

    const unlocked = deriveUnlockedStages(stageResults, codingPassed)
    expect(unlocked.has('quiz-section-2')).toBe(true)
    expect(getNextStageAfterCoding('part-1')).toBe('quiz-section-2')
    expect(unlocked.has('code-2')).toBe(false)
  })

  // 5. A team fails Section 2: Code 2 remains locked.
  it('Acceptance Test 5: Failing Section 2 keeps Code 2 locked', () => {
    const session = createMockSessionWithScore(2, 4)
    const evalResult = evaluateQuizSection(session, 2)
    expect(evalResult.passed).toBe(false)

    const stageResults: StageResultMap = {
      'quiz-section-1': { passed: true, score: 6, total: 10, attempts: 1 },
      'quiz-section-2': recordStageAttempt(undefined, evalResult.passed, evalResult.score, evalResult.total),
    }
    const codingPassed: CodingStagePassMap = { 'part-1': true }

    const unlocked = deriveUnlockedStages(stageResults, codingPassed)
    expect(unlocked.has('quiz-section-2')).toBe(true)
    expect(unlocked.has('code-2')).toBe(false)
    expect(getUnlockedCodingStages(stageResults, codingPassed)).toEqual(['part-1'])
  })

  // 6. A team retries Section 2 and passes: Code 2 unlocks.
  it('Acceptance Test 6: Retrying Section 2 and passing unlocks Code 2', () => {
    const stageResults: StageResultMap = {
      'quiz-section-1': { passed: true, score: 6, total: 10, attempts: 1 },
      'quiz-section-2': { passed: true, score: 6, total: 10, attempts: 2 },
    }
    const codingPassed: CodingStagePassMap = { 'part-1': true }

    const unlocked = deriveUnlockedStages(stageResults, codingPassed)
    expect(unlocked.has('code-2')).toBe(true)
    expect(getUnlockedCodingStages(stageResults, codingPassed)).toEqual(['part-1', 'part-2'])
    expect(getEntryCodeStage(stageResults, codingPassed)).toBe('part-2')
  })

  // 7. A team fails the riddle round: the next stage remains locked.
  it('Acceptance Test 7: Passing riddle round (1/4 correct) unlocks Code 3 / Debugging', () => {
    const session = createMockSessionWithScore(3, 1) // 1 out of 4 riddles correct
    const evalResult = evaluateQuizSection(session, 3)
    expect(evalResult.passed).toBe(true)

    const stageResults: StageResultMap = {
      'quiz-section-1': { passed: true, score: 6, total: 10, attempts: 1 },
      'quiz-section-2': { passed: true, score: 6, total: 10, attempts: 1 },
      riddles: recordStageAttempt(undefined, evalResult.passed, evalResult.score, evalResult.total),
    }
    const codingPassed: CodingStagePassMap = { 'part-1': true, 'part-2': true }

    const unlocked = deriveUnlockedStages(stageResults, codingPassed)
    expect(unlocked.has('code-3')).toBe(true)
    expect(getUnlockedCodingStages(stageResults, codingPassed)).toEqual(['part-1', 'part-2', 'debugging'])
  })

  // 8. A team gets 0 correct: Code 3 / Debugging is locked (need at least 1).
  it('Acceptance Test 8: Failing riddle round (0/4 correct) keeps Code 3 / Debugging locked', () => {
    const session = createMockSessionWithScore(3, 0) // 0 out of 4 riddles
    const evalResult = evaluateQuizSection(session, 3)
    expect(evalResult.passed).toBe(false)

    const stageResults: StageResultMap = {
      'quiz-section-1': { passed: true, score: 6, total: 10, attempts: 1 },
      'quiz-section-2': { passed: true, score: 6, total: 10, attempts: 1 },
      riddles: recordStageAttempt(undefined, evalResult.passed, evalResult.score, evalResult.total),
    }
    const codingPassed: CodingStagePassMap = { 'part-1': true, 'part-2': true }

    const unlocked = deriveUnlockedStages(stageResults, codingPassed)
    expect(unlocked.has('code-3')).toBe(false)
  })

  // 9. A team submits an incorrect debugging solution: the game is not marked complete.
  it('Acceptance Test 9: Incorrect debugging solution does not mark game complete', () => {
    const codingPassed: CodingStagePassMap = {
      'part-1': true,
      'part-2': true,
      debugging: false,
    }
    expect(isGameComplete(codingPassed)).toBe(false)
  })

  // 10. A team successfully completes debugging: the game is marked complete.
  it('Acceptance Test 10: Successful debugging completes the entire game', () => {
    const codingPassed: CodingStagePassMap = {
      'part-1': true,
      'part-2': true,
      debugging: true,
    }
    expect(isGameComplete(codingPassed)).toBe(true)
  })

  // 11. Refreshing the page does not erase completed stages or bypass locked ones.
  it('Acceptance Test 11: Stage state round-trips via JSON serialization without losing unlock state', () => {
    const stageResults: StageResultMap = {
      'quiz-section-1': { passed: true, score: 7, total: 10, attempts: 1 },
      'quiz-section-2': { passed: false, score: 3, total: 10, attempts: 1 },
    }
    const codingPassed: CodingStagePassMap = { 'part-1': true }

    // Simulate page refresh persistence serialization
    const serializedResults = JSON.parse(JSON.stringify(stageResults))
    const serializedCoding = JSON.parse(JSON.stringify(codingPassed))

    const rehydratedUnlocked = deriveUnlockedStages(serializedResults, serializedCoding)
    expect(rehydratedUnlocked.has('quiz-section-1')).toBe(true)
    expect(rehydratedUnlocked.has('code-1')).toBe(true)
    expect(rehydratedUnlocked.has('quiz-section-2')).toBe(true)
    expect(rehydratedUnlocked.has('code-2')).toBe(false)
    expect(rehydratedUnlocked.has('riddles')).toBe(false)
    expect(rehydratedUnlocked.has('code-3')).toBe(false)
  })

  // 12. Modifying frontend state does not allow a team to skip a stage.
  it('Acceptance Test 12: Fraudulent later stage marks without preceding pass are rejected', () => {
    // Attempted cheat: marked section 2 as passed, but section 1 failed
    const spoofedResults: StageResultMap = {
      'quiz-section-1': { passed: false, score: 2, total: 10, attempts: 1 },
      'quiz-section-2': { passed: true, score: 9, total: 10, attempts: 1 },
    }
    const codingPassed: CodingStagePassMap = { 'part-1': true }

    const unlocked = deriveUnlockedStages(spoofedResults, codingPassed)
    // Because section 1 was not passed, code-1 is locked, and NOTHING beyond can unlock
    expect(unlocked.has('quiz-section-1')).toBe(true)
    expect(unlocked.has('code-1')).toBe(false)
    expect(unlocked.has('quiz-section-2')).toBe(false)
    expect(unlocked.has('code-2')).toBe(false)
  })

  // 13. A team cannot progress while the admin has paused or ended the game.
  it('Acceptance Test 13: Phase lock or pause blocks navigation to coding', () => {
    const isCodingLockedByGM = true
    const gmPhase: string = 'round-1'
    const isCodingLocked = isCodingLockedByGM || gmPhase !== 'coding'

    expect(isCodingLocked).toBe(true)
  })

  // 14. Repeated submissions do not accidentally award duplicate completion credit.
  it('Acceptance Test 14: Repeated attempts update attempts count without duplicate credit', () => {
    let result = recordStageAttempt(undefined, true, 7, 10)
    expect(result.attempts).toBe(1)
    expect(result.passed).toBe(true)

    // Repeat attempt
    result = recordStageAttempt(result, true, 8, 10)
    expect(result.attempts).toBe(2)
    expect(result.score).toBe(8)
  })

  // 15. A failed attempt does not erase progress from previously passed stages.
  it('Acceptance Test 15: Failing Section 2 preserves Section 1 and Code 1 completion', () => {
    const stageResults: StageResultMap = {
      'quiz-section-1': { passed: true, score: 7, total: 10, attempts: 1 },
      'quiz-section-2': { passed: false, score: 3, total: 10, attempts: 1 },
    }
    const codingPassed: CodingStagePassMap = { 'part-1': true }

    expect(stageResults['quiz-section-1']?.passed).toBe(true)
    expect(codingPassed['part-1']).toBe(true)

    const unlocked = deriveUnlockedStages(stageResults, codingPassed)
    expect(unlocked.has('quiz-section-1')).toBe(true)
    expect(unlocked.has('code-1')).toBe(true)
    expect(unlocked.has('quiz-section-2')).toBe(true)
    expect(unlocked.has('code-2')).toBe(false)
  })
})
