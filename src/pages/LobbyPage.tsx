/**
 * LobbyPage — shown to players when game phase is "lobby".
 * Players see a waiting room with a live team count from other registered teams.
 */
import { useEffect } from 'react'
import { ArrowLeft, Clock, Shield, Users, Zap } from 'lucide-react'
import { AppBackdrop } from '../components/AppBackdrop'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/Button'
import type { TeamRegistration } from '../types/gamemaster'

interface LobbyPageProps {
  teamName: string
  sessionId: string
  teams: TeamRegistration[]
  onRegister: (team: TeamRegistration) => void
  onBackToHome?: () => void
}

export function LobbyPage({ teamName, sessionId, teams, onRegister, onBackToHome }: LobbyPageProps) {
  // Register this team in the GM state on mount
  useEffect(() => {
    onRegister({ teamName, sessionId, joinedAt: Date.now() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isRegistered = teams.some((t) => t.sessionId === sessionId)

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AppBackdrop />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center animate-fade-up">
          <BrandLogo size="lg" className="ring-2 ring-hwi/40 shadow-[0_0_40px_rgba(255,0,85,0.25)]" />
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.28em] text-hwi">
              ACCESS DENIED — QUIZ
            </p>
            <p className="mt-1 text-xs font-medium tracking-[0.18em] text-white/40 uppercase">
              Hack With India · SAIU
            </p>
          </div>
        </div>

        {/* Waiting card */}
        <div
          className="animate-fade-up w-full max-w-md rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl overflow-hidden"
          style={{ animationDelay: '100ms' }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-hwi via-hwi/40 to-transparent" />
          <div className="p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              {/* Pulsing waiting indicator */}
              <div className="relative">
                <span className="absolute inset-0 animate-ping rounded-full bg-hwi/20" />
                <span className="relative flex size-14 items-center justify-center rounded-full border border-hwi/30 bg-hwi/10">
                  <Clock className="size-6 text-hwi" />
                </span>
              </div>
              <div>
                <p className="font-display text-[9px] font-bold uppercase tracking-[0.28em] text-hwi">
                  Waiting Room
                </p>
                <h1 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
                  Please Wait Until Admin Starts The Game
                </h1>
                <p className="mt-2 text-sm text-white/50">
                  Your team is registered. The quiz will begin automatically when the admin starts the game.
                </p>
              </div>
            </div>

            {/* Registered team */}
            {isRegistered && (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3">
                <Shield className="size-4 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Registered</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{teamName}</p>
                </div>
              </div>
            )}

            {onBackToHome && (
              <div className="mt-5 pt-4 border-t border-white/[0.08] flex justify-center">
                <Button variant="outline" size="sm" onClick={onBackToHome} className="gap-2">
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  <span>Return to Home</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Teams in lobby */}
        <div
          className="animate-fade-up mt-6 w-full max-w-md"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="size-3.5 text-white/40" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Teams in Lobby
              </span>
            </div>
            <span className="font-display text-sm font-bold text-hwi">{teams.length}</span>
          </div>

          <div className="space-y-2">
            {teams.map((team, i) => (
              <div
                key={team.sessionId}
                className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5"
              >
                <span className="font-display text-xs font-bold tabular-nums text-hwi/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 truncate text-sm font-semibold text-white/80">
                  {team.teamName}
                </span>
                {team.sessionId === sessionId && (
                  <span className="flex items-center gap-1 rounded-full border border-hwi/30 bg-hwi/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-hwi">
                    <Zap className="size-2.5" /> You
                  </span>
                )}
              </div>
            ))}
            {teams.length === 0 && (
              <p className="py-4 text-center text-sm text-white/30">
                No teams yet. Be the first to register!
              </p>
            )}
          </div>
        </div>

        <p
          className="animate-fade-up mt-8 text-[10px] font-medium uppercase tracking-[0.2em] text-white/20"
          style={{ animationDelay: '300ms' }}
        >
          ACCESS DENIED — SAIU · Hack With India
        </p>
      </div>
    </div>
  )
}
