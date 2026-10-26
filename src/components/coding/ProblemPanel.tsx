import { useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Sparkles,
} from 'lucide-react'
import type { StageDefinition } from '../../types/codingChallenge'
import { cn } from '../../utils/cn'

interface ProblemPanelProps {
  stage: StageDefinition
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function ProblemPanel({
  stage,
  isCollapsed,
  onToggleCollapse,
}: ProblemPanelProps) {
  const [showHints, setShowHints] = useState(false)

  if (isCollapsed) {
    return (
      <aside
        aria-label="Problem description (collapsed)"
        className="flex flex-col items-center border-r border-white/[0.08] bg-[#0c0c0c] p-2"
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand instructions panel"
          aria-label="Expand instructions panel"
          className="rounded-lg p-2 text-white/50 hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
        <div className="mt-8 [writing-mode:vertical-rl] text-[10px] font-bold uppercase tracking-[0.2em] text-muted/40">
          Problem Instructions
        </div>
      </aside>
    )
  }

  return (
    <aside
      aria-label="Problem description and instructions"
      className="flex h-full flex-col border-r border-white/[0.08] bg-[#0c0c0c]/90 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md border border-hwi/30 bg-hwi/10 text-[10px] font-bold text-hwi">
            0{stage.index}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-hwi">
            {stage.tagline}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Collapse instructions panel"
          aria-label="Collapse instructions panel"
          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-white">
            {stage.title}
          </h2>
          <p className="mt-1 text-xs font-medium text-white/50 leading-relaxed">
            {stage.subtitle}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3.5 text-xs leading-relaxed text-white/80">
          <p>{stage.description}</p>
        </div>

        {/* Step-by-step Instructions */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted/60">
            <Sparkles className="size-3.5 text-hwi" aria-hidden="true" />
            <span>Instructions</span>
          </div>
          <ol className="space-y-2 rounded-xl border border-white/[0.06] bg-black/20 p-3 text-xs">
            {stage.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2.5 text-white/75 leading-relaxed">
                <span className="flex size-4 shrink-0 items-center justify-center rounded bg-white/[0.06] text-[9px] font-bold tabular-nums text-hwi">
                  {index + 1}
                </span>
                <span className="flex-1">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted/60">
            <ListChecks className="size-3.5 text-emerald-400" aria-hidden="true" />
            <span>Stage Requirements</span>
          </div>
          <ul className="space-y-2 rounded-xl border border-white/[0.06] bg-black/20 p-3 text-xs">
            {stage.requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-2.5 text-white/75 leading-relaxed">
                <span className="size-1.5 mt-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
                <span className="flex-1">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hints Drawer */}
        {stage.hints.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3.5">
            <button
              type="button"
              onClick={() => setShowHints(!showHints)}
              className="flex w-full items-center justify-between text-left text-xs font-semibold text-amber-300"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="size-3.5 text-amber-400" aria-hidden="true" />
                <span>Need a Hint? ({stage.hints.length} available)</span>
              </div>
              <ChevronDown
                className={cn('size-3.5 transition-transform', showHints && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
            {showHints && (
              <div className="mt-3 space-y-2 border-t border-amber-500/15 pt-3 text-xs text-amber-200/80 leading-relaxed">
                {stage.hints.map((hint, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <HelpCircle className="size-3.5 shrink-0 text-amber-400/80 mt-0.5" aria-hidden="true" />
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
