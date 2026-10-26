import { AlertCircle, ArrowRight, CheckCircle2, X } from 'lucide-react'
import type { ValidationResult } from '../../types/codingChallenge'
import { cn } from '../../utils/cn'

interface ValidationBannerProps {
  result: ValidationResult
  hasNextStage: boolean
  onAdvance?: () => void
  onDismiss: () => void
}

export function ValidationBanner({
  result,
  hasNextStage,
  onAdvance,
  onDismiss,
}: ValidationBannerProps) {
  const isSuccess = result.success

  return (
    <div
      role="alert"
      className={cn(
        'animate-feedback-in fixed bottom-6 right-6 z-50 max-w-md rounded-2xl border p-5 shadow-2xl backdrop-blur-xl',
        isSuccess
          ? 'border-emerald-500/40 bg-[#0d1f17]/95 shadow-[0_0_40px_rgba(16,185,129,0.25)]'
          : 'border-red-500/40 bg-[#1f0d11]/95 shadow-[0_0_40px_rgba(239,68,68,0.25)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isSuccess ? (
            <span className="flex size-7 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="size-4" aria-hidden="true" />
            </span>
          ) : (
            <span className="flex size-7 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/20 text-red-400">
              <AlertCircle className="size-4" aria-hidden="true" />
            </span>
          )}
          <div>
            <p
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.2em]',
                isSuccess ? 'text-emerald-400' : 'text-red-400',
              )}
            >
              {isSuccess ? 'Verification Passed' : 'Verification Incomplete'}
            </p>
            <h3 className="mt-0.5 font-display text-sm font-bold text-white">
              {result.message}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          title="Dismiss notice"
          aria-label="Dismiss notice"
          className="rounded-lg p-1 text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {result.error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.08] p-2.5 font-mono text-[11px] text-red-300">
          {result.error}
        </div>
      )}

      {result.details && result.details.length > 0 && (
        <div className="mt-3.5 space-y-2 border-t border-white/[0.08] pt-3">
          {result.details.map((detail, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              {detail.passed ? (
                <CheckCircle2
                  className="mt-0.5 size-3.5 shrink-0 text-emerald-400"
                  aria-hidden="true"
                />
              ) : (
                <AlertCircle
                  className="mt-0.5 size-3.5 shrink-0 text-red-400"
                  aria-hidden="true"
                />
              )}
              <div className="flex-1">
                <span
                  className={cn(
                    'font-medium',
                    detail.passed ? 'text-white/90' : 'text-red-200',
                  )}
                >
                  {detail.title}
                </span>
                {detail.description && (
                  <p className="text-[10px] text-muted/50">
                    {detail.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          Close
        </button>

        {isSuccess && hasNextStage && onAdvance && (
          <button
            type="button"
            onClick={onAdvance}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-black shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
          >
            <span>Next Stage</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
