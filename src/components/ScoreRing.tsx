import { useId } from 'react'

interface ScoreRingProps {
  percentage: number
  correct: number
  total: number
}

export function ScoreRing({ percentage, correct }: ScoreRingProps) {
  const gradientId = useId()
  const radius = 82
  const circumference = 2 * Math.PI * radius
  const boundedPercentage = Math.min(Math.max(percentage, 0), 100)
  const offset = circumference - (boundedPercentage / 100) * circumference

  return (
    <div
      className="relative mx-auto flex size-52 items-center justify-center sm:size-56"
      role="img"
      aria-label={`Final score: ${correct} points, ${boundedPercentage} percent`}
    >
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF0055" />
            <stop offset="100%" stopColor="#FF4D85" />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="9"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring-progress"
          style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,85,0.45))' }}
        />
      </svg>

      <span
        className="absolute inset-6 rounded-full border border-white/[0.05]"
        aria-hidden="true"
      />
      <div className="relative text-center">
        <p className="font-display text-5xl font-bold leading-none tracking-[-0.04em] tabular-nums text-white">
          {boundedPercentage}
          <span className="text-2xl text-muted/60">%</span>
        </p>
        <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.24em] text-hwi">
          Final score
        </p>
        <p className="mt-1 font-display text-xs font-medium tabular-nums text-muted/60">
          {correct} points
        </p>
      </div>
    </div>
  )
}
