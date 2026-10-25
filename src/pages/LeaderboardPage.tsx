import { ArrowLeft, Trophy } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/Button'
import { TOTAL_QUESTIONS } from '../data/questions'
import { getLeaderboardEntries } from '../utils/leaderboard'

interface LeaderboardPageProps {
  onBack: () => void
}

export function LeaderboardPage({ onBack }: LeaderboardPageProps) {
  const entries = getLeaderboardEntries()

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo size="sm" className="ring-1 ring-hwi/30" />
          <div className="min-w-0">
            <p className="truncate font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
              Hack With India <span className="text-hwi">/</span> SAIU
            </p>
            <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.28em] text-muted/50">
              Team leaderboard
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to results
        </Button>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-14 pt-8 sm:px-6 sm:pt-12">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-hwi/25 bg-hwi/[0.07] text-hwi">
            <Trophy className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-hwi">
              Rankings
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
              Team leaderboard
            </h1>
          </div>
        </div>

        <section
          className="mt-7 overflow-hidden rounded-xl border border-white/[0.08] bg-black/30"
          aria-label="Team rankings"
        >
          <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_5.5rem_4.5rem] gap-2 border-b border-white/[0.08] bg-white/[0.025] px-4 py-3 text-[8px] font-bold uppercase tracking-[0.16em] text-muted/50 sm:grid-cols-[5rem_minmax(0,1fr)_8rem_7rem] sm:px-6">
            <span>Rank</span>
            <span>Team</span>
            <span className="text-right">Correct</span>
            <span className="text-right">Score</span>
          </div>

          {entries.length > 0 ? (
            <ol>
              {entries.map((entry, index) => {
                const previousScore = entries[index - 1]?.correctAnswers
                const rank =
                  previousScore === entry.correctAnswers
                    ? entries.findIndex(
                        (candidate) =>
                          candidate.correctAnswers === entry.correctAnswers,
                      ) + 1
                    : index + 1

                return (
                  <li
                    key={entry.sessionId}
                    className="grid grid-cols-[3.5rem_minmax(0,1fr)_5.5rem_4.5rem] items-center gap-2 border-b border-white/[0.055] px-4 py-4 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)_8rem_7rem] sm:px-6"
                  >
                    <span className="font-display text-sm font-bold tabular-nums text-hwi">
                      {String(rank).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 truncate text-xs font-semibold text-white sm:text-sm">
                      {entry.teamName}
                    </span>
                    <span className="text-right font-display text-xs font-semibold tabular-nums text-white/80 sm:text-sm">
                      {entry.correctAnswers}/{TOTAL_QUESTIONS}
                    </span>
                    <span className="text-right font-display text-xs font-bold tabular-nums text-white sm:text-sm">
                      {entry.percentage}%
                    </span>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="px-5 py-12 text-center text-sm text-muted/60">
              No completed teams have been recorded yet.
            </p>
          )}
        </section>

        <p className="mt-4 text-[10px] leading-relaxed text-muted/45">
          Scores are saved in this browser on this device and are not shared
          across devices.
        </p>
      </main>
    </div>
  )
}