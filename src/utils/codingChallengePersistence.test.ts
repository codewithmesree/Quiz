import { beforeEach, describe, expect, it } from 'vitest'
import {
  CODING_CHALLENGE_STORAGE_KEY,
  getDefaultCodingChallengeState,
  loadCodingChallengeState,
  resetCodingChallengeState,
  saveCodingChallengeState,
} from './codingChallengePersistence'

describe('codingChallengePersistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns default state when storage is empty', () => {
    const state = loadCodingChallengeState()
    expect(state.currentStageId).toBe('part-1')
    expect(state.unlockedStages).toEqual(['part-1'])
    expect(state.completedStages).toEqual([])
    expect(state.stageCodes['part-1']).toContain('random.randint(1, 100)')
  })

  it('persists and rehydrates state correctly', () => {
    const defaultState = getDefaultCodingChallengeState()
    const customState = {
      ...defaultState,
      currentStageId: 'part-2' as const,
      completedStages: ['part-1' as const],
      unlockedStages: ['part-1' as const, 'part-2' as const],
      stageCodes: {
        ...defaultState.stageCodes,
        'part-1': '# My solved Part 1 code',
      },
    }

    saveCodingChallengeState(customState)

    const loaded = loadCodingChallengeState()
    expect(loaded.currentStageId).toBe('part-2')
    expect(loaded.completedStages).toEqual(['part-1'])
    expect(loaded.unlockedStages).toContain('part-2')
    expect(loaded.stageCodes['part-1']).toBe('# My solved Part 1 code')
  })

  it('handles malformed JSON in localStorage gracefully without crashing', () => {
    window.localStorage.setItem(
      CODING_CHALLENGE_STORAGE_KEY,
      '{ broken json: true',
    )
    const state = loadCodingChallengeState()
    expect(state.currentStageId).toBe('part-1')
    expect(state.unlockedStages).toEqual(['part-1'])
  })

  it('resets progress cleanly via resetCodingChallengeState', () => {
    const custom = {
      ...getDefaultCodingChallengeState(),
      currentStageId: 'debugging' as const,
      completedStages: ['part-1' as const, 'part-2' as const],
      unlockedStages: [
        'part-1' as const,
        'part-2' as const,
        'debugging' as const,
      ],
    }
    saveCodingChallengeState(custom)

    const reset = resetCodingChallengeState()
    expect(reset.currentStageId).toBe('part-1')
    expect(reset.completedStages).toEqual([])

    const fromStorage = loadCodingChallengeState()
    expect(fromStorage.currentStageId).toBe('part-1')
  })
})
