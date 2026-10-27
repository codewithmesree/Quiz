import { AlertCircle, Clock } from 'lucide-react'
import { getWarningLevel } from '../../hooks/useTimerWithPersistence'

interface TimerDisplayProps {
  displayTime: string // "MM:SS" format
  remainingMs: number
  isExpired: boolean
  isRunning: boolean
}

/**
 * Displays the 40-minute coding round countdown timer.
 * Shows warnings at 10 min, 5 min, and 1 min remaining.
 * Shows "Time's Up!" when expired.
 */
export function TimerDisplay({
  displayTime,
  remainingMs,
  isExpired,
  isRunning,
}: TimerDisplayProps) {
  const warningLevel = getWarningLevel(remainingMs)
  const isWarning = warningLevel !== 'none'

  // Determine colors based on warning level
  let containerClass = 'border-white/20 bg-white/[0.04] text-white'
  let iconClass = 'text-white/50'
  let timerClass = 'text-white/80'

  if (!isRunning) {
    containerClass = 'border-white/10 bg-white/[0.02] text-white/60'
    timerClass = 'text-white/60'
  } else if (warningLevel === 'critical') {
    containerClass = 'border-red-500/40 bg-red-500/10 text-red-300 animate-pulse'
    iconClass = 'text-red-400'
    timerClass = 'text-red-200 font-bold'
  } else if (warningLevel === 'warning') {
    containerClass = 'border-amber-500/40 bg-amber-500/10 text-amber-300'
    iconClass = 'text-amber-400'
    timerClass = 'text-amber-200 font-semibold'
  }

  if (isExpired) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${containerClass}`}
      >
        <AlertCircle className="size-3.5 shrink-0 text-red-400" aria-hidden="true" />
        <span className="text-red-300">Time's Up!</span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${containerClass}`}
      role="status"
      aria-live="polite"
      aria-label={`${displayTime} remaining${isWarning ? ` - ${warningLevel} warning` : ''}`}
    >
      <Clock
        className={`size-3.5 shrink-0 transition-colors ${iconClass}`}
        aria-hidden="true"
      />
      <span className={`transition-colors ${timerClass}`}>{displayTime}</span>
    </div>
  )
}
