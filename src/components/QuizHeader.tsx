import { Lock, Users } from 'lucide-react'
import type { ScoreSummary } from '../types/quiz'
import { BrandLogo } from './BrandLogo'

interface QuizHeaderProps {
  teamName: string
  score: ScoreSummary
}

export function QuizHeader({ teamName, score }: QuizHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#050505]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo size="xs" className="ring-1 ring-hwi/30" />
          <div className="min-w-0">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-white sm:text-xs">
              Hack With India <span className="text-hwi">/</span> SAIU
            </p>
            <p className="mt-0.5 hidden text-[9px] font-medium uppercase tracking-[0.28em] text-muted/70 sm:block">
              Access Denied Quiz
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden max-w-[190px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 md:flex">
            <Users className="size-3.5 shrink-0 text-hwi" aria-hidden="true" />
            <span className="truncate text-[11px] font-medium tracking-wide text-muted">
              {teamName}
            </span>
          </div>
          <div
            className="flex items-center gap-2 rounded-full border border-hwi/25 bg-hwi/[0.07] px-3 py-1.5"
            data-testid="live-score"
            aria-label={`Live score: ${score.totalCorrect} of ${score.totalQuestions} points`}
          >
            <Lock className="size-3 text-hwi" aria-hidden="true" />
            <span className="font-display text-sm font-bold tabular-nums text-white">
              {score.totalCorrect}
              <span className="text-muted/70">/{score.totalQuestions}</span>
            </span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-hwi sm:inline">
              pts
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.04] px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted/60">
            Team <span className="text-white/85">{teamName}</span>
          </p>
          <p className="shrink-0 text-[10px] font-medium uppercase tracking-[0.18em] text-muted/60">
            Answered <span className="text-white/85">{score.totalAnswered}</span> /{' '}
            {score.totalQuestions}
          </p>
        </div>
      </div>
    </header>
  )
}
