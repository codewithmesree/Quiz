import type { ButtonHTMLAttributes } from 'react'
import { Play, Square, Loader2 } from 'lucide-react'
import type { ExecutionStatus } from '../../types/codingChallenge'
import { cn } from '../../utils/cn'

interface RunButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  status: ExecutionStatus
  onRun: () => void
  onStop: () => void
}

export function RunButton({
  status,
  onRun,
  onStop,
  className,
  disabled,
  ...props
}: RunButtonProps) {
  const isExecuting = status === 'running' || status === 'waiting_for_input'
  const isInitializing = status === 'initializing'

  if (isExecuting) {
    return (
      <button
        type="button"
        onClick={onStop}
        title="Stop Python execution (Interrupt)"
        aria-label="Stop Python execution"
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/15 px-3.5 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-red-300 transition-all hover:bg-red-500/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-red-500',
          className,
        )}
        {...props}
      >
        <Square className="size-3.5 fill-red-400 text-red-400" aria-hidden="true" />
        Stop
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onRun}
      disabled={disabled || isInitializing}
      title="Run Python code (Ctrl+Enter)"
      aria-label="Run Python code"
      className={cn(
        'group relative inline-flex items-center gap-2 overflow-hidden rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all hover:border-emerald-400 hover:bg-emerald-500/25 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-400',
        className,
      )}
      {...props}
    >
      {isInitializing ? (
        <>
          <Loader2 className="size-3.5 animate-spin text-emerald-400" aria-hidden="true" />
          <span>Starting...</span>
        </>
      ) : (
        <>
          <Play className="size-3.5 fill-emerald-400 text-emerald-400 transition-transform group-hover:scale-110" aria-hidden="true" />
          <span>Run</span>
          <span className="hidden text-[10px] text-emerald-400/60 lg:inline">Ctrl+↵</span>
        </>
      )}
    </button>
  )
}
