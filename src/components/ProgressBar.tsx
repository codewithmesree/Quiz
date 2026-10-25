import { cn } from '../utils/cn'

interface ProgressBarProps {
  value: number
  max: number
  label: string
  tone?: 'red' | 'green' | 'white'
  className?: string
}

const TONES = {
  red: 'bg-hwi shadow-[0_0_14px_rgba(255,0,85,0.55)]',
  green: 'bg-emerald-500 shadow-[0_0_14px_rgba(34,197,94,0.35)]',
  white: 'bg-white/80',
}

export function ProgressBar({
  value,
  max,
  label,
  tone = 'red',
  className,
}: ProgressBarProps) {
  const boundedMax = Math.max(max, 1)
  const boundedValue = Math.min(Math.max(value, 0), boundedMax)
  const percentage = (boundedValue / boundedMax) * 100

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={boundedMax}
      aria-valuenow={boundedValue}
      aria-valuetext={`${boundedValue} of ${boundedMax}`}
      className={cn(
        'h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          TONES[tone],
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
