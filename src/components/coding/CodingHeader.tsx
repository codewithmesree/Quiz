import { useState } from 'react'
import {
  ArrowLeft,
  Code2,
  RotateCcw,
  Users,
} from 'lucide-react'
import { BrandLogo } from '../BrandLogo'
import { ConfirmDialog } from '../ConfirmDialog'
import { RunButton } from './RunButton'
import { StageNavigation } from './StageNavigation'
import { SubmitButton } from './SubmitButton'
import type {
  CodingStageId,
  ExecutionStatus,
} from '../../types/codingChallenge'

interface CodingHeaderProps {
  teamName?: string
  currentStageId: CodingStageId
  completedStages: readonly CodingStageId[]
  unlockedStages: readonly CodingStageId[]
  executionStatus: ExecutionStatus
  isValidating: boolean
  onSelectStage: (stageId: CodingStageId) => void
  onRun: () => void
  onStop: () => void
  onSubmit: () => void
  onResetAll: () => void
  onBackToQuiz: () => void
}

export function CodingHeader({
  teamName,
  currentStageId,
  completedStages,
  unlockedStages,
  executionStatus,
  isValidating,
  onSelectStage,
  onRun,
  onStop,
  onSubmit,
  onResetAll,
  onBackToQuiz,
}: CodingHeaderProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const isCurrentCompleted = completedStages.includes(currentStageId)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#080808]/95 px-4 py-2.5 backdrop-blur-xl sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Branding & Back Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToQuiz}
              title="Return to Quiz Arena"
              aria-label="Return to Quiz Arena"
              className="group flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-white/80 transition-all hover:border-hwi/40 hover:bg-hwi/10 hover:text-white"
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              <span className="hidden sm:inline">Quiz Arena</span>
            </button>

            <div className="h-5 w-px bg-white/10" aria-hidden="true" />

            <div className="flex items-center gap-2.5">
              <BrandLogo size="sm" className="hidden ring-1 ring-hwi/30 sm:block" />
              <div>
                <div className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-white">
                  <Code2 className="size-3.5 text-hwi" aria-hidden="true" />
                  <span>Python Lab</span>
                  <span className="text-hwi">/</span>
                  <span className="hidden text-white/50 sm:inline">IDE</span>
                </div>
                {teamName && (
                  <p className="flex items-center gap-1 text-[9px] font-medium text-muted/50">
                    <Users className="size-2.5" aria-hidden="true" />
                    <span className="truncate max-w-[120px]">{teamName}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Center: Stage Progression Navigation */}
          <div className="order-3 w-full lg:order-2 lg:w-auto">
            <StageNavigation
              currentStageId={currentStageId}
              completedStages={completedStages}
              unlockedStages={unlockedStages}
              onSelectStage={onSelectStage}
            />
          </div>

          {/* Right: Run, Submit & Reset Controls */}
          <div className="order-2 flex items-center gap-2 lg:order-3">
            <RunButton
              status={executionStatus}
              onRun={onRun}
              onStop={onStop}
            />

            <SubmitButton
              isValidating={isValidating}
              isCompleted={isCurrentCompleted}
              onSubmit={onSubmit}
            />

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              title="Reset all challenge progress"
              aria-label="Reset all challenge progress"
              className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-muted/40 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset All Coding Progress?"
        description="All saved Python code across Part 1, Part 2, and Debugging will be reset to their default starter templates. This cannot be undone."
        confirmLabel="Reset Everything"
        onConfirm={() => {
          setShowResetConfirm(false)
          onResetAll()
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </>
  )
}
