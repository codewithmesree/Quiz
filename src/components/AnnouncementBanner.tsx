/**
 * AnnouncementBanner — displays ephemeral GM announcements to players.
 * Positioned as a fixed overlay at the top of the screen.
 */
import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '../utils/cn'
import type { Announcement } from '../types/gamemaster'

interface AnnouncementBannerProps {
  announcements: Announcement[]
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // Auto-dismiss expired announcements
  useEffect(() => {
    const now = Date.now()
    announcements.forEach((a) => {
      if (a.expiresAt && a.expiresAt < now && !dismissed.has(a.id)) {
        setDismissed((prev) => new Set([...prev, a.id]))
      }
    })
  }, [announcements, dismissed])

  const visible = announcements.filter(
    (a) => !dismissed.has(a.id) && (!a.expiresAt || a.expiresAt > Date.now()),
  )

  if (visible.length === 0) return null

  const latest = visible[visible.length - 1]

  const icons = {
    info: <Info className="size-4 shrink-0" />,
    warning: <AlertTriangle className="size-4 shrink-0" />,
    success: <CheckCircle2 className="size-4 shrink-0" />,
    error: <XCircle className="size-4 shrink-0" />,
  }

  const styles = {
    info: 'border-blue-500/40 bg-blue-950/80 text-blue-200',
    warning: 'border-amber-500/40 bg-amber-950/80 text-amber-200',
    success: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-200',
    error: 'border-red-500/40 bg-red-950/80 text-red-200',
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[200] flex justify-center">
      <div
        key={latest.id}
        className={cn(
          'pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur-md shadow-2xl animate-fade-up',
          styles[latest.type],
        )}
      >
        {icons[latest.type]}
        <p className="flex-1 text-sm font-semibold">{latest.message}</p>
        <button
          type="button"
          onClick={() => setDismissed((prev) => new Set([...prev, latest.id]))}
          className="ml-1 rounded-lg p-1 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
