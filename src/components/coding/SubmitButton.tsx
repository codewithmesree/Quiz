import type { ButtonHTMLAttributes } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isValidating: boolean
  isCompleted?: boolean
  onSubmit: () => void
}

export function SubmitButton({
  isValidating,
  isCompleted,
  onSubmit,
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={disabled || isValidating}
      title="Submit code for automated stage validation"
      aria-label="Submit solution"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-hwi/40 bg-gradient-to-r from-hwi to-hwi-bright px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(255,0,85,0.25)] transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(255,0,85,0.45)] active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hwi',
        isCompleted && 'border-emerald-500/40 bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
        className,
      )}
      {...props}
    >
      {isValidating ? (
        <>
          <Loader2 className="size-3.5 animate-spin text-white" aria-hidden="true" />
          <span>Validating...</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="size-3.5 text-white" aria-hidden="true" />
          <span>{isCompleted ? 'Re-Submit' : 'Submit'}</span>
        </>
      )}
    </button>
  )
}
