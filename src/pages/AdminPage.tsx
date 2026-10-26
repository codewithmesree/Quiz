import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Code2,
  Flag,
  Info,
  Layers,
  Lock,
  LockOpen,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkles,
  Terminal,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/Button'
import { cn } from '../utils/cn'
import { useGameMaster } from '../hooks/useGameMaster'
import type { GamePhase } from '../types/gamemaster'
import {
  GAME_PHASE_LABELS,
  GAME_PHASE_ORDER,
  getNextPhase,
  getPrevPhase,
} from '../types/gamemaster'

interface AdminPageProps {
  onExit: () => void
}

function PasscodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const { state } = useGameMaster()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input === state.adminPasscode) {
      onUnlock()
    } else {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#050505]">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl border border-hwi/30 bg-hwi/10">
            <Shield className="size-8 text-hwi" />
          </span>
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.28em] text-hwi">
              Admin Access
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-white">Game Master</h1>
            <p className="mt-1.5 text-sm text-white/50">Enter your admin passcode to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter passcode"
            maxLength={16}
            autoFocus
            className={cn(
              'w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-center font-display text-xl font-bold tracking-[0.3em] text-white placeholder:text-white/20 outline-none transition-all',
              error
                ? 'border-red-500 bg-red-500/10'
                : 'border-white/[0.1] focus:border-hwi/50 focus:bg-hwi/[0.04]',
            )}
          />
          {error && (
            <p className="text-center text-xs font-medium text-red-400">Incorrect passcode. Try again.</p>
          )}
          <Button type="submit" size="lg" className="w-full">
            <Lock className="size-4" />
            Unlock Admin Panel
          </Button>
        </form>
        <p className="mt-4 text-center text-[10px] text-white/30">Default passcode: 2024</p>
      </div>
    </div>
  )
}

function PhaseIndicator({ phase }: { phase: GamePhase }) {
  const icons: Record<GamePhase, React.ReactNode> = {
    lobby: <Users className="size-4" />,
    'round-1': <Layers className="size-4" />,
    'round-2': <Zap className="size-4" />,
    'round-3': <Sparkles className="size-4" />,
    coding: <Code2 className="size-4" />,
    finale: <Trophy className="size-4" />,
  }
  return (
    <div className="flex items-center gap-2 rounded-full border border-hwi/30 bg-hwi/10 px-4 py-2">
      <span className="text-hwi">{icons[phase]}</span>
      <span className="text-xs font-bold tracking-wide text-white">{GAME_PHASE_LABELS[phase]}</span>
    </div>
  )
}

function LiveTeamRow({ team, score, rank }: {
  team: { teamName: string; sessionId: string }
  score?: { correctAnswers: number; totalAnswered: number; codingStagesCompleted: number }
  rank: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-hwi/20 hover:bg-hwi/[0.03]">
      <span className="w-7 font-display text-sm font-bold tabular-nums text-hwi">
        {String(rank).padStart(2, '0')}
      </span>
      <span className="flex-1 truncate text-sm font-semibold text-white">{team.teamName}</span>
      {score ? (
        <>
          <span className="font-display text-xs tabular-nums text-white/60">
            {score.correctAnswers}/{score.totalAnswered} pts
          </span>
          {score.codingStagesCompleted > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
              <Code2 className="size-2.5" />
              {score.codingStagesCompleted}/3
            </span>
          )}
        </>
      ) : (
        <span className="text-xs text-white/30">No answers yet</span>
      )}
    </div>
  )
}

function AnnouncementComposer({ onSend }: { onSend: (msg: string, type: 'info' | 'warning' | 'success' | 'error') => void }) {
  const [msg, setMsg] = useState('')
  const [type, setType] = useState<'info' | 'warning' | 'success' | 'error'>('info')

  function send() {
    if (!msg.trim()) return
    onSend(msg.trim(), type)
    setMsg('')
  }

  const typeStyles = {
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {(['info', 'warning', 'success', 'error'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-all',
              type === t ? typeStyles[t] : 'border-white/[0.08] text-white/30 hover:text-white/60',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder="Type a message to all teams..."
          className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-hwi/40"
        />
        <Button onClick={send} variant="outline" disabled={!msg.trim()}>
          Send
        </Button>
      </div>
    </div>
  )
}

export function AdminPage({ onExit }: AdminPageProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const { state, isLive, phase, teams, liveScores, setLiveMode, advancePhase, rewindPhase, setPhase, resetGame, addAnnouncement } = useGameMaster()
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextPhase = getNextPhase(phase)
  const prevPhase = getPrevPhase(phase)

  // Sort teams by score
  const rankedTeams = [...teams].sort((a, b) => {
    const sa = liveScores.find((s) => s.sessionId === a.sessionId)
    const sb = liveScores.find((s) => s.sessionId === b.sessionId)
    return (sb?.correctAnswers ?? -1) - (sa?.correctAnswers ?? -1)
  })

  const handleReset = useCallback(() => {
    if (confirmReset) {
      resetGame()
      setConfirmReset(false)
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
    } else {
      setConfirmReset(true)
      confirmTimeoutRef.current = setTimeout(() => setConfirmReset(false), 4000)
    }
  }, [confirmReset, resetGame])

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
    }
  }, [])

  if (!unlocked) {
    return <PasscodeGate onUnlock={() => setUnlocked(true)} />
  }

  const phaseIndex = GAME_PHASE_ORDER.indexOf(phase)

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#050505] text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" className="ring-1 ring-hwi/30" />
          <div>
            <p className="font-display text-[9px] font-bold uppercase tracking-[0.26em] text-hwi">
              Admin Panel
            </p>
            <p className="font-display text-sm font-bold text-white">Game Master</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLiveMode(!isLive)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all',
              isLive
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'border-white/10 bg-white/[0.04] text-white/50 hover:border-white/20 hover:text-white',
            )}
            title={isLive ? 'Live gating active — click to set practice mode' : 'Practice mode — click to activate live tournament'}
          >
            <span className={cn('size-2 rounded-full', isLive ? 'bg-emerald-400 animate-pulse' : 'bg-white/30')} />
            {isLive ? 'LIVE SESSION ACTIVE' : 'FREE PRACTICE MODE'}
          </button>
          <PhaseIndicator phase={phase} />
          <Button variant="outline" onClick={onExit}>
            <ArrowLeft className="size-3.5" />
            Exit
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-5 pb-16 pt-8 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px]">

          {/* LEFT: Game Flow + Controls */}
          <div className="space-y-6">

            {/* Phase Control */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Flag className="size-4 text-hwi" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/80">
                  Game Phase Control
                </h2>
              </div>

              {/* Phase track */}
              <div className="mb-6 flex items-center gap-0">
                {GAME_PHASE_ORDER.map((p, i) => (
                  <div key={p} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setPhase(p)}
                      className={cn(
                        'relative flex h-8 min-w-[70px] items-center justify-center rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-all',
                        p === phase
                          ? 'border-hwi bg-hwi text-white shadow-[0_0_16px_rgba(255,0,85,0.4)]'
                          : i < phaseIndex
                          ? 'border-hwi/40 bg-hwi/10 text-hwi/60'
                          : 'border-white/[0.08] bg-transparent text-white/30 hover:border-white/20 hover:text-white/60',
                      )}
                    >
                      {i < phaseIndex && (
                        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500" />
                      )}
                      {p === 'lobby' ? 'Lobby' : p === 'finale' ? 'Finale' : `R${i}`}
                    </button>
                    {i < GAME_PHASE_ORDER.length - 1 && (
                      <ChevronRight className="mx-0.5 size-3 text-white/20 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={rewindPhase}
                  disabled={!prevPhase}
                >
                  <ArrowLeft className="size-4" />
                  {prevPhase ? GAME_PHASE_LABELS[prevPhase] : 'No previous'}
                </Button>
                <Button
                  onClick={advancePhase}
                  disabled={!nextPhase}
                  className="gap-2"
                >
                  Advance to: {nextPhase ? GAME_PHASE_LABELS[nextPhase] : 'End'}
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/25 p-3 text-xs text-white/50">
                <strong className="text-white/70">Current:</strong> {GAME_PHASE_LABELS[phase]}
                {state.phaseChangedAt && (
                  <span className="ml-2 text-white/30">
                    · changed {Math.round((Date.now() - state.phaseChangedAt) / 1000)}s ago
                  </span>
                )}
              </div>
            </section>

            {/* Quick Phase Buttons */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Zap className="size-4 text-hwi" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/80">
                  Quick Jump
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {GAME_PHASE_ORDER.map((p) => {
                  const icons: Record<GamePhase, React.ReactNode> = {
                    lobby: <Users className="size-3.5" />,
                    'round-1': <Layers className="size-3.5" />,
                    'round-2': <Zap className="size-3.5" />,
                    'round-3': <Sparkles className="size-3.5" />,
                    coding: <Terminal className="size-3.5" />,
                    finale: <Trophy className="size-3.5" />,
                  }
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPhase(p)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all',
                        p === phase
                          ? 'border-hwi/50 bg-hwi/15 text-hwi'
                          : 'border-white/[0.07] bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white',
                      )}
                    >
                      {icons[p]}
                      <span className="text-[9px] font-bold uppercase tracking-wider">
                        {p === 'round-1' ? 'R1' : p === 'round-2' ? 'R2' : p === 'round-3' ? 'R3' : p === 'coding' ? 'Code' : p === 'lobby' ? 'Lobby' : 'End'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Announcements */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Info className="size-4 text-hwi" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/80">
                  Broadcast Announcement
                </h2>
              </div>
              <AnnouncementComposer onSend={addAnnouncement} />

              {state.announcements.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">Recent</p>
                  {[...state.announcements].reverse().slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-xs text-white/70"
                    >
                      <span className={cn(
                        'mt-0.5 size-1.5 shrink-0 rounded-full',
                        a.type === 'info' && 'bg-blue-400',
                        a.type === 'warning' && 'bg-amber-400',
                        a.type === 'success' && 'bg-emerald-400',
                        a.type === 'error' && 'bg-red-400',
                      )} />
                      {a.message}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Danger Zone */}
            <section className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="size-4 text-red-400" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-red-400/80">
                  Danger Zone
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className={cn(
                    'border-red-500/40 text-red-400 hover:bg-red-500/10',
                    confirmReset && 'border-red-500 bg-red-500/20 animate-pulse',
                  )}
                >
                  <RotateCcw className="size-3.5" />
                  {confirmReset ? 'Confirm Reset? Click Again' : 'Reset All Game Data'}
                </Button>
                <p className="text-[10px] text-white/30">
                  Clears all teams, scores and phase. Cannot be undone.
                </p>
              </div>
            </section>
          </div>

          {/* RIGHT: Live Teams + Scores */}
          <div className="space-y-6">
            {/* Team Roster */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-hwi" />
                  <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/80">
                    Live Teams
                  </h2>
                </div>
                <span className="rounded-full border border-hwi/30 bg-hwi/10 px-2.5 py-1 font-display text-xs font-bold text-hwi">
                  {teams.length}
                </span>
              </div>

              {teams.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <span className="flex size-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02]">
                    <Users className="size-5 text-white/20" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white/40">No teams yet</p>
                    <p className="mt-1 text-xs text-white/25">
                      Teams will appear here when they register
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {rankedTeams.map((team, i) => {
                    const score = liveScores.find((s) => s.sessionId === team.sessionId)
                    return (
                      <LiveTeamRow
                        key={team.sessionId}
                        team={team}
                        score={score}
                        rank={i + 1}
                      />
                    )
                  })}
                </div>
              )}
            </section>

            {/* Live Activity */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="size-4 text-hwi" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/80">
                  Session Stats
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Teams', value: teams.length, icon: <Users className="size-3.5" /> },
                  { label: 'Active', value: liveScores.filter(s => s.totalAnswered > 0).length, icon: <Activity className="size-3.5" /> },
                  { label: 'Phase', value: phaseIndex + 1 + '/6', icon: <Flag className="size-3.5" /> },
                  {
                    label: 'Top Score',
                    value: liveScores.reduce((m, s) => Math.max(m, s.correctAnswers), 0),
                    icon: <Trophy className="size-3.5" />,
                  },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex items-center gap-1.5 text-white/40">
                      {icon}
                      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
                    </div>
                    <p className="mt-1 font-display text-2xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Passcode settings */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center gap-2">
                <LockOpen className="size-4 text-hwi" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/80">
                  Admin Passcode
                </h2>
              </div>
              <PasscodeEditor currentPasscode={state.adminPasscode} />
            </section>

            {/* Refresh hint */}
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-3 text-xs text-white/30">
              <RefreshCw className="size-3.5 shrink-0" />
              Scores update automatically. No page refresh needed.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function PasscodeEditor({ currentPasscode }: { currentPasscode: string }) {
  const { setPasscode } = useGameMaster()
  const [value, setValue] = useState(currentPasscode)
  const [saved, setSaved] = useState(false)

  function save() {
    if (!value.trim()) return
    setPasscode(value.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={16}
        className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-hwi/40"
      />
      <Button onClick={save} variant="outline" disabled={saved}>
        {saved ? 'Saved!' : 'Save'}
      </Button>
    </div>
  )
}
