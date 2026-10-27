import { useEffect, useRef, useState } from 'react'
import type { CodingChallengeState, TimerStatus } from '../types/codingChallenge'
import {
  getRemainingTime,
  startCodingTimer,
  updateTimerStatus,
} from '../utils/codingChallengePersistence'

export interface TimerState {
  remainingMs: number
  status: TimerStatus
  isExpired: boolean
  isRunning: boolean
  displayTime: string // "MM:SS" format
}

/**
 * Hook that manages the 40-minute coding round timer.
 * Handles:
 * - Starting timer on first code edit (must be called with onStartTimer callback)
 * - Updating countdown every second while running
 * - Persisting timer state across refreshes
 * - Detecting expiration
 */
export function useTimerWithPersistence(
  challengeState: CodingChallengeState,
  onStateChange: (state: CodingChallengeState) => void,
): {
  timerState: TimerState
  startTimer: () => void
} {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    return getTimerState(challengeState)
  })

  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasStartedRef = useRef(false)

  // Update timer state when challenge state changes (e.g., from persistence)
  useEffect(() => {
    setTimerState(getTimerState(challengeState))
  }, [challengeState.timerDeadline, challengeState.timerStatus])

  // Interval: update countdown every second when running
  useEffect(() => {
    if (timerState.status !== 'running') {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
      return
    }

    intervalIdRef.current = setInterval(() => {
      const updated = updateTimerStatus(challengeState)
      const newState = getTimerState(updated)

      setTimerState(newState)

      // Notify parent if state changed
      if (newState.status !== timerState.status) {
        onStateChange(updated)
      }
    }, 1000)

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [timerState.status, challengeState, onStateChange])

  // Start timer function - can only start once
  const startTimer = () => {
    if (hasStartedRef.current || challengeState.timerStatus !== 'not_started') {
      return
    }
    hasStartedRef.current = true

    const updated = startCodingTimer(challengeState)
    onStateChange(updated)
    setTimerState(getTimerState(updated))
  }

  return {
    timerState,
    startTimer,
  }
}

function getTimerState(state: CodingChallengeState): TimerState {
  const remainingMs = getRemainingTime(state)
  const isExpired = state.timerStatus === 'expired'
  const isRunning = state.timerStatus === 'running'
  const displayTime = formatTime(remainingMs)

  return {
    remainingMs,
    status: state.timerStatus || 'not_started',
    isExpired,
    isRunning,
    displayTime,
  }
}

/**
 * Format milliseconds to "MM:SS" display format
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
}

/**
 * Determine warning level based on remaining time
 */
export function getWarningLevel(
  remainingMs: number,
): 'critical' | 'warning' | 'none' {
  const seconds = remainingMs / 1000
  if (seconds <= 60) return 'critical' // 1 minute or less
  if (seconds <= 300) return 'warning' // 5 minutes or less
  return 'none'
}
