import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="surface relative w-full max-w-md overflow-hidden p-5 sm:p-6"
      >
        <div className="h-1 w-full bg-gradient-to-r from-hwi via-hwi/45 to-transparent" />
        <div className="mt-5 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-hwi/30 bg-hwi/[0.08]">
            <AlertTriangle className="size-4 text-hwi" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="confirm-dialog-title"
              className="font-display text-xl font-bold text-white"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-description"
              className="mt-2 text-xs leading-relaxed text-muted/65"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} autoFocus>
            Keep playing
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
