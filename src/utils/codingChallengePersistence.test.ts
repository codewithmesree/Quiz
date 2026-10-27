import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CODING_CHALLENGE_STORAGE_KEY,
  getDefaultCodingChallengeState,
  getRemainingTime,
  loadCodingChallengeState,
  resetCodingChallengeState,
  saveCodingChallengeState,
  startCodingTimer,
  updateTimerStatus,
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
    // Starter code is now blank for part-1
    expect(state.stageCodes['part-1']).toBe('')
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

  it('starts timer and persists deadline correctly', () => {
    const state = getDefaultCodingChallengeState()
    const now = Date.now()
    
    // Mock Date.now to control time
    vi.useFakeTimers()
    vi.setSystemTime(now)

    const started = startCodingTimer(state)
    expect(started.timerStatus).toBe('running')
    expect(started.timerStartTime).toBe(now)
    expect(started.timerDeadline).toBe(now + 40 * 60 * 1000)

    // Verify persisted in storage
    const loaded = loadCodingChallengeState()
    expect(loaded.timerStatus).toBe('running')
    expect(loaded.timerDeadline).toBe(now + 40 * 60 * 1000)

    vi.useRealTimers()
  })

  it('calculates remaining time correctly', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    const state = getDefaultCodingChallengeState()
    const started = startCodingTimer(state)

    // At start, 40 minutes remain
    vi.setSystemTime(now)
    let remaining = getRemainingTime(started)
    expect(remaining).toBeCloseTo(40 * 60 * 1000, -2)

    // After 10 minutes, 30 minutes remain
    vi.setSystemTime(now + 10 * 60 * 1000)
    remaining = getRemainingTime(started)
    expect(remaining).toBeCloseTo(30 * 60 * 1000, -2)

    // After 40 minutes, 0 remains (but not yet marked expired)
    vi.setSystemTime(now + 40 * 60 * 1000)
    remaining = getRemainingTime(started)
    expect(remaining).toBe(0)

    vi.useRealTimers()
  })

  it('marks timer as expired when deadline passes', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    const state = getDefaultCodingChallengeState()
    const started = startCodingTimer(state)
    expect(started.timerStatus).toBe('running')

    // Advance past deadline
    vi.setSystemTime(now + 40 * 60 * 1000 + 1000)

    const updated = updateTimerStatus(started)
    expect(updated.timerStatus).toBe('expired')

    // Verify persisted
    const loaded = loadCodingChallengeState()
    expect(loaded.timerStatus).toBe('expired')

    vi.useRealTimers()
  })

  it('restores timer state correctly after browser refresh', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    // Start timer
    const initial = getDefaultCodingChallengeState()
    const started = startCodingTimer(initial)
    saveCodingChallengeState(started)

    // Simulate page refresh - clear memory and reload
    const refreshed = loadCodingChallengeState()
    expect(refreshed.timerStatus).toBe('running')
    expect(refreshed.timerDeadline).toBe(now + 40 * 60 * 1000)

    // Simulate user returning 20 minutes later
    vi.setSystemTime(now + 20 * 60 * 1000)
    const remaining = getRemainingTime(refreshed)
    expect(remaining).toBeCloseTo(20 * 60 * 1000, -2)

    vi.useRealTimers()
  })

  it('restores expired state correctly after browser refresh', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    // Start and expire timer
    const initial = getDefaultCodingChallengeState()
    const started = startCodingTimer(initial)
    vi.setSystemTime(now + 45 * 60 * 1000) // Past deadline
    const expired = updateTimerStatus(started)
    saveCodingChallengeState(expired)

    // Simulate page refresh
    const refreshed = loadCodingChallengeState()
    expect(refreshed.timerStatus).toBe('expired')
    expect(getRemainingTime(refreshed)).toBe(0)

    vi.useRealTimers()
  })

  it('timer only starts once and cannot be restarted', () => {
    const state = getDefaultCodingChallengeState()
    expect(state.timerStatus).toBe('not_started')

    // Start timer first time
    const started1 = startCodingTimer(state)
    expect(started1.timerStatus).toBe('running')
    const deadline1 = started1.timerDeadline

    // Try to start again (should be idempotent)
    const started2 = startCodingTimer(started1)
    expect(started2.timerStatus).toBe('running')
    expect(started2.timerDeadline).toBe(deadline1) // Same deadline, not reset
  })

  it('returns full 40 minutes for not-started timer', () => {
    const state = getDefaultCodingChallengeState()
    const remaining = getRemainingTime(state)
    expect(remaining).toBe(40 * 60 * 1000)
  })

  it('enforces deadline on submission - rejects after expiry', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    const state = getDefaultCodingChallengeState()
    const started = startCodingTimer(state)

    // Before deadline: should still be running
    expect(started.timerStatus).toBe('running')
    let check = updateTimerStatus(started)
    expect(check.timerStatus).toBe('running')

    // At deadline exactly
    vi.setSystemTime(now + 40 * 60 * 1000)
    check = updateTimerStatus(started)
    expect(check.timerStatus).toBe('expired')

    // After deadline: persists as expired
    vi.setSystemTime(now + 45 * 60 * 1000)
    check = updateTimerStatus(check)
    expect(check.timerStatus).toBe('expired')

    vi.useRealTimers()
  })

  it('timer persists across multiple saves', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    let state = getDefaultCodingChallengeState()
    state = startCodingTimer(state)
    const deadline = state.timerDeadline

    // Save and reload multiple times
    for (let i = 0; i < 3; i++) {
      saveCodingChallengeState(state)
      state = loadCodingChallengeState()
      expect(state.timerDeadline).toBe(deadline)
      expect(state.timerStatus).toBe('running')
    }

    vi.useRealTimers()
  })

  it('instructionsViewed flag persists separately from timer', () => {
    const state = getDefaultCodingChallengeState()
    expect(state.instructionsViewed).toBe(false)

    // Mark instructions as viewed
    const updated = {
      ...state,
      instructionsViewed: true,
    }
    saveCodingChallengeState(updated)

    const loaded = loadCodingChallengeState()
    expect(loaded.instructionsViewed).toBe(true)
    expect(loaded.timerStatus).toBe('not_started') // Timer still not started
  })

  it('timer and progress state persist together', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    let state = getDefaultCodingChallengeState()
    state = startCodingTimer(state)
    
    // Simulate completing part-1
    state = {
      ...state,
      completedStages: ['part-1' as const],
      unlockedStages: ['part-1' as const, 'part-2' as const],
      currentStageId: 'part-2' as const,
    }
    saveCodingChallengeState(state)

    // Verify both persisted together
    const loaded = loadCodingChallengeState()
    expect(loaded.timerStatus).toBe('running')
    expect(loaded.timerDeadline).toBe(now + 40 * 60 * 1000)
    expect(loaded.completedStages).toContain('part-1')
    expect(loaded.currentStageId).toBe('part-2')

    vi.useRealTimers()
  })
})
