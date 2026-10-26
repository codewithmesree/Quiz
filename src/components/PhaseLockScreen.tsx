/**
 * PhaseLockScreen — shown to players when the current GM phase has not yet
 * unlocked the round they're trying to access.
 */
import { ArrowLeft, Lock } from 'lucide-react'
import { AppBackdrop } from './AppBackdrop'
import { BrandLogo } from './BrandLogo'
import { Button } from './Button'
import type { GamePhase } from '../types/gamemaster'
import { GAME_PHASE_LABELS } from '../types/gamemaster'

interface PhaseLockScreenProps {
  currentPhase: GamePhase
  requiredPhase: GamePhase
  teamName?: string
  onBackToHome?: () => void
  /** Optional override message shown instead of the default phase message. */
  message?: string
}

const PHASE_MESSAGES: Record<GamePhase, { title: string; sub: string }> = {
  lobby: { title: 'Please Wait Until Admin Starts The Game', sub: 'Your team is registered. The quiz will begin automatically when the admin starts the game.' },
  'round-1': { title: 'Round 1 Locked', sub: 'The game master has not unlocked Round 1 yet.' },
  'round-2': { title: 'Round 2 Locked', sub: 'Complete Round 1 first, then wait for the host.' },
  'round-3': { title: 'Round 3 Locked', sub: 'Complete Round 2 first, then wait for the host.' },
  coding: { title: 'Code Lab Locked', sub: 'Wait for the game master to unlock the Code Lab.' },
  finale: { title: 'Waiting for Results', sub: 'The game master will reveal the finale soon.' },
}

export function PhaseLockScreen({ currentPhase, requiredPhase: _requiredPhase, teamName, onBackToHome, message }: PhaseLockScreenProps) {
  const defaultMsg = PHASE_MESSAGES[currentPhase] ?? { title: 'Round Locked', sub: 'Please wait for the game master.' }
  const msg = message ? { title: defaultMsg.title, sub: message } : defaultMsg

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center">
      <AppBackdrop />
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center animate-fade-up">
        <div className="relative">
          <span className="absolute -inset-4 rounded-full border border-dashed border-white/10 animate-spin" style={{ animationDuration: '12s' }} />
          <span className="absolute -inset-8 rounded-full border border-white/[0.04]" />
          <span className="flex size-20 items-center justify-center rounded-full border border-hwi/20 bg-hwi/[0.07]">
            <Lock className="size-9 text-hwi/60" />
          </span>
        </div>

        <BrandLogo size="sm" />

        <div>
          {teamName && (
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.28em] text-hwi">
              {teamName}
            </p>
          )}
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{msg.title}</h1>
          <p className="mt-2 text-sm text-white/50">{msg.sub}</p>
        </div>

        <div className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-8 py-4">
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">Game Master Phase</p>
          <p className="font-display text-sm font-bold text-white">{GAME_PHASE_LABELS[currentPhase]}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">
            Auto-updating · No refresh needed
          </span>
        </div>

        {onBackToHome && (
          <div className="mt-2">
            <Button variant="outline" onClick={onBackToHome} className="gap-2">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Return to Home Page
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
