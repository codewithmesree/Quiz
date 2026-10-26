import { useEffect, useState } from 'react'
import { ArrowLeft, Loader, Trophy } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/Button'
import { TOTAL_QUESTIONS } from '../data/questions'
import type { CloudTeamRecord } from '../services/firebaseSync'
import { subscribeToCloudLeaderboard } from '../services/firebaseSync'

interface LeaderboardPageProps {
  onBack: () => void
  backLabel?: string
}

export function LeaderboardPage({ onBack, backLabel = 'Back to Results' }: LeaderboardPageProps) {
  const [teams, setTeams] = useState<CloudTeamRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // subscribeToCloudLeaderboard returns null when Firebase is not configured.
    // In that case loading stays true briefly then we clear it.
    const unsub = subscribeToCloudLeaderboard((incoming) => {
      setTeams(incoming)
      setLoading(false)
    })

    if (!unsub) {
      // Firebase not configured — nothing to show
      setLoading(false)
    }

    return () => { unsub?.() }
  }, [])

  // Only show completed teams on the leaderboard
  const completed = teams.filter((t) => t.isCompleted)

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
          {backLabel}
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
          {/* Header row */}
          <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_5.5rem_5.5rem_4.5rem] gap-2 border-b border-white/[0.08] bg-white/[0.025] px-4 py-3 text-[8px] font-bold uppercase tracking-[0.16em] text-muted/50 sm:grid-cols-[5rem_minmax(0,1fr)_8rem_8rem_7rem] sm:px-6">
            <span>Rank</span>
            <span>Team</span>
            <span className="text-right">Correct</span>
            <span className="text-right">Points</span>
            <span className="text-right">Score</span>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted/60">
              <Loader className="size-4 animate-spin" aria-hidden="true" />
              Loading leaderboard…
            </div>
          )}

          {!loading && completed.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-muted/60">
              No completed teams have been recorded yet.
            </p>
          )}

          {!loading && completed.length > 0 && (
            <ol>
              {completed.map((team, index) => {
                // Dense rank: same totalPoints = same rank
                const rank = index === 0
                  ? 1
                  : completed[index - 1].totalPoints === team.totalPoints
                    ? completed.findIndex((t) => t.totalPoints === team.totalPoints) + 1
                    : index + 1

                const isTopThree = rank <= 3
                return (
                  <li
                    key={team.sessionId}
                    className={`grid grid-cols-[3.5rem_minmax(0,1fr)_5.5rem_5.5rem_4.5rem] items-center gap-2 border-b border-white/[0.055] px-4 py-4 last:border-b-0 sm:grid-cols-[5rem_minmax(0,1fr)_8rem_8rem_7rem] sm:px-6 ${isTopThree ? 'bg-hwi/[0.03]' : ''}`}
                  >
                    <span className={`font-display text-sm font-bold tabular-nums ${isTopThree ? 'text-hwi' : 'text-white/50'}`}>
                      {String(rank).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 truncate text-xs font-semibold text-white sm:text-sm">
                      {team.teamName}
                    </span>
                    <span className="text-right font-display text-xs font-semibold tabular-nums text-white/80 sm:text-sm">
                      {team.totalCorrect}/{TOTAL_QUESTIONS}
                    </span>
                    <span className="text-right font-display text-xs font-bold tabular-nums text-hwi sm:text-sm">
                      {team.totalPoints} pts
                    </span>
                    <span className="text-right font-display text-xs font-bold tabular-nums text-white sm:text-sm">
                      {team.percentage}%
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <p className="mt-4 text-[10px] leading-relaxed text-muted/45">
          Live rankings · updates in real time across all devices.
        </p>
      </main>
    </div>
  )
}
