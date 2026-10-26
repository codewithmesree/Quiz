import { Check, Lock } from 'lucide-react'
import { GUESS_THE_NUMBER_STAGES } from '../../config/codingChallengeConfig'
import type { CodingStageId } from '../../types/codingChallenge'
import { cn } from '../../utils/cn'

interface StageNavigationProps {
  currentStageId: CodingStageId
  completedStages: readonly CodingStageId[]
  unlockedStages: readonly CodingStageId[]
  onSelectStage: (stageId: CodingStageId) => void
}

export function StageNavigation({
  currentStageId,
  completedStages,
  unlockedStages,
  onSelectStage,
}: StageNavigationProps) {
  return (
    <nav
      aria-label="Challenge stage progression"
      className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/40 p-1 backdrop-blur-md"
    >
      {GUESS_THE_NUMBER_STAGES.map((stage) => {
        const isCurrent = stage.id === currentStageId
        const isCompleted = completedStages.includes(stage.id)
        const isUnlocked = unlockedStages.includes(stage.id)
        const isLocked = !isUnlocked

        return (
          <button
            key={stage.id}
            type="button"
            disabled={isLocked}
            onClick={() => onSelectStage(stage.id)}
            title={
              isLocked
                ? `${stage.title} (Locked: complete previous stage first)`
                : isCompleted
                  ? `${stage.title} (Completed)`
                  : stage.title
            }
            aria-current={isCurrent ? 'step' : undefined}
            className={cn(
              'group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              isCurrent &&
                'border border-hwi/40 bg-hwi/15 text-white shadow-[0_0_16px_rgba(255,0,85,0.22)]',
              !isCurrent &&
                isUnlocked &&
                'border border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.05] hover:text-white',
              isLocked &&
                'cursor-not-allowed border border-transparent text-white/25 hover:text-white/25',
            )}
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                isCompleted
                  ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                  : isCurrent
                    ? 'border border-hwi/50 bg-hwi text-white'
                    : isLocked
                      ? 'border border-white/10 bg-white/[0.04] text-white/30'
                      : 'border border-white/20 bg-white/[0.06] text-white/70',
              )}
            >
              {isCompleted ? (
                <Check className="size-3 stroke-[2.5]" aria-hidden="true" />
              ) : isLocked ? (
                <Lock className="size-2.5" aria-hidden="true" />
              ) : (
                stage.index
              )}
            </span>

            <span className="truncate whitespace-nowrap font-display text-[11px] tracking-wide">
              {stage.title}
            </span>

            {isCurrent && (
              <span
                className="size-1.5 rounded-full bg-hwi animate-pulse"
                aria-hidden="true"
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
