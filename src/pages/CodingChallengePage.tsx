import { useEffect, useState } from 'react'
import {
  BookOpen,
  Code2,
  Terminal as TerminalIcon,
} from 'lucide-react'
import { AppBackdrop } from '../components/AppBackdrop'
import { CodeEditor } from '../components/coding/CodeEditor'
import { CodingHeader } from '../components/coding/CodingHeader'
import { CodingInstructions } from '../components/coding/CodingInstructions'
import { ProblemPanel } from '../components/coding/ProblemPanel'
import { TerminalPanel } from '../components/coding/TerminalPanel'
import { ValidationBanner } from '../components/coding/ValidationBanner'
import { useCodingChallenge } from '../hooks/useCodingChallenge'
import { useTimerWithPersistence } from '../hooks/useTimerWithPersistence'
import {
  loadCodingChallengeState,
  saveCodingChallengeState,
} from '../utils/codingChallengePersistence'
import { cn } from '../utils/cn'

import type { CodingStageId, CodingChallengeState } from '../types/codingChallenge'

interface CodingChallengePageProps {
  teamName?: string
  onBackToQuiz: () => void
  onStagesCompletedChange?: (count: number) => void
  /** Called when a coding stage is successfully validated and passed. */
  onStagePassed?: (stageId: CodingStageId) => void
  /** Stages unlocked by the external progression engine. Only these are accessible. */
  externalUnlockedStages?: readonly CodingStageId[]
}

type MobileTab = 'instructions' | 'editor' | 'terminal'

export function CodingChallengePage({
  teamName,
  onBackToQuiz,
  onStagesCompletedChange,
  onStagePassed,
  externalUnlockedStages,
}: CodingChallengePageProps) {
  const [challengeState, setChallengeState] = useState<CodingChallengeState>(
    () => loadCodingChallengeState(),
  )
  const [showInstructions, setShowInstructions] = useState(
    !challengeState.instructionsViewed,
  )

  const challenge = useCodingChallenge(externalUnlockedStages)
  const [isProblemCollapsed, setIsProblemCollapsed] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor')

  const { timerState, startTimer } = useTimerWithPersistence(
    challengeState,
    (updated) => {
      setChallengeState(updated)
      saveCodingChallengeState(updated)
    },
  )

  const {
    currentStage,
    currentStageId,
    code,
    completedStages,
    unlockedStages,
    executionStatus,
    terminalLines,
    validationResult,
    isValidating,
    isNextStageUnlocked,
    isTimeExpired,
    setCode,
    selectStage,
    resetCurrentStageCode,
    runCode,
    sendInput,
    stopExecution,
    clearTerminal,
    submitSolution,
    clearValidationResult,
    advanceToNextStage,
    resetAllProgress,
  } = challenge

  // Handle instructions viewed
  const handleStartCoding = () => {
    const updated: CodingChallengeState = {
      ...challengeState,
      instructionsViewed: true,
    }
    setChallengeState(updated)
    saveCodingChallengeState(updated)
    setShowInstructions(false)
  }

  // Detect first code edit and start timer
  const handleCodeFirstEdit = () => {
    startTimer()
  }

  // Notify parent when coding progress changes
  useEffect(() => {
    onStagesCompletedChange?.(completedStages.length)
  }, [completedStages.length, onStagesCompletedChange])

  // Wrap submitSolution to also fire onStagePassed on success
  const handleSubmit = async () => {
    const result = await submitSolution()
    if (result.success) {
      onStagePassed?.(currentStageId)
    }
    return result
  }

  const handleRun = async () => {
    setMobileTab('terminal')
    await runCode()
  }

  // Show instructions page if not yet viewed
  if (showInstructions) {
    return (
      <>
        <AppBackdrop />
        <CodingInstructions onStart={handleStartCoding} />
      </>
    )
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#050505] text-white">
      <AppBackdrop />

      {/* Top VS Code-style Header */}
      <CodingHeader
        teamName={teamName}
        currentStageId={currentStageId}
        completedStages={completedStages}
        unlockedStages={unlockedStages}
        executionStatus={executionStatus}
        isValidating={isValidating}
        isTimeExpired={isTimeExpired}
        timerDisplay={timerState}
        onSelectStage={selectStage}
        onRun={handleRun}
        onStop={stopExecution}
        onSubmit={handleSubmit}
        onResetAll={resetAllProgress}
        onBackToQuiz={onBackToQuiz}
      />

      {/* Mobile Tab Switcher (Visible on < lg screens) */}
      <div className="flex border-b border-white/[0.08] bg-[#0a0a0a] px-2 py-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('instructions')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors',
            mobileTab === 'instructions'
              ? 'bg-white/10 text-white'
              : 'text-muted/60 hover:text-white',
          )}
        >
          <BookOpen className="size-3.5" aria-hidden="true" />
          <span>Instructions</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors',
            mobileTab === 'editor'
              ? 'bg-hwi/20 text-hwi'
              : 'text-muted/60 hover:text-white',
          )}
        >
          <Code2 className="size-3.5" aria-hidden="true" />
          <span>Code Editor</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('terminal')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors',
            mobileTab === 'terminal'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-muted/60 hover:text-white',
          )}
        >
          <TerminalIcon className="size-3.5" aria-hidden="true" />
          <span>Terminal</span>
          {executionStatus === 'waiting_for_input' && (
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Main Workspace Layout */}
      <main className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* A. Problem Panel */}
        <div
          className={cn(
            'h-full transition-all duration-200',
            isProblemCollapsed ? 'lg:w-12 lg:shrink-0' : 'lg:w-[320px] lg:shrink-0 xl:w-[360px]',
            mobileTab === 'instructions' ? 'flex-1' : 'hidden lg:block',
          )}
        >
          <ProblemPanel
            stage={currentStage}
            isCollapsed={isProblemCollapsed}
            onToggleCollapse={() => setIsProblemCollapsed(!isProblemCollapsed)}
          />
        </div>

        {/* B. Code Editor */}
        <div
          className={cn(
            'h-full min-w-0 flex-1',
            mobileTab === 'editor' ? 'flex-1' : 'hidden lg:block',
          )}
        >
          <CodeEditor
            code={code}
            stageId={currentStageId}
            onChange={setCode}
            onRun={handleRun}
            onReset={resetCurrentStageCode}
            onFirstEdit={handleCodeFirstEdit}
            readOnly={isTimeExpired}
          />
        </div>

        {/* C. Terminal Panel */}
        <div
          className={cn(
            'h-full border-l border-white/[0.08] lg:w-[420px] lg:shrink-0 xl:w-[480px]',
            mobileTab === 'terminal' ? 'flex-1' : 'hidden lg:block',
          )}
        >
          <TerminalPanel
            lines={terminalLines}
            status={executionStatus}
            onSendInput={sendInput}
            onClear={clearTerminal}
          />
        </div>
      </main>

      {/* Submission Feedback Banner */}
      {validationResult && (
        <ValidationBanner
          result={validationResult}
          hasNextStage={isNextStageUnlocked}
          onAdvance={advanceToNextStage}
          onDismiss={clearValidationResult}
        />
      )}
    </div>
  )
}
