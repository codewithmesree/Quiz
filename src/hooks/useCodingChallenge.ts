import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  STAGE_ORDER,
  getStageById,
} from '../config/codingChallengeConfig'
import { PythonRunner } from '../services/pythonRunner'
import type {
  CodingChallengeState,
  CodingStageId,
  ExecutionStatus,
  StageDefinition,
  TerminalLine,
  ValidationResult,
} from '../types/codingChallenge'
import {
  loadCodingChallengeState,
  resetCodingChallengeState,
  saveCodingChallengeState,
} from '../utils/codingChallengePersistence'

export interface UseCodingChallengeResult {
  currentStage: StageDefinition
  currentStageId: CodingStageId
  code: string
  stageCodes: Record<CodingStageId, string>
  completedStages: readonly CodingStageId[]
  unlockedStages: readonly CodingStageId[]
  executionStatus: ExecutionStatus
  terminalLines: readonly TerminalLine[]
  validationResult: ValidationResult | null
  isValidating: boolean
  isNextStageUnlocked: boolean
  isTimeExpired: boolean // New: whether coding timer has expired
  setCode: (code: string) => void
  selectStage: (stageId: CodingStageId) => boolean
  resetCurrentStageCode: () => void
  runCode: () => Promise<void>
  sendInput: (input: string) => void
  stopExecution: () => void
  clearTerminal: () => void
  submitSolution: () => Promise<ValidationResult>
  clearValidationResult: () => void
  advanceToNextStage: () => void
  resetAllProgress: () => void
}

export function useCodingChallenge(
  externalUnlockedStages?: readonly CodingStageId[],
): UseCodingChallengeResult {
  const [challengeState, setChallengeState] = useState<CodingChallengeState>(
    () => loadCodingChallengeState(),
  )

  const [executionStatus, setExecutionStatus] =
    useState<ExecutionStatus>('idle')
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Persist state changes to localStorage
  useEffect(() => {
    saveCodingChallengeState(challengeState)
  }, [challengeState])

  const currentStage = useMemo(
    () => getStageById(challengeState.currentStageId),
    [challengeState.currentStageId],
  )

  // The effective unlocked stages is the INTERSECTION of:
  // 1. What the internal coding challenge state has unlocked (submission-based)
  // 2. What the external progression engine has granted (game-wide gating)
  const effectiveUnlockedStages = useMemo(() => {
    if (!externalUnlockedStages) return challengeState.unlockedStages
    return challengeState.unlockedStages.filter((id) =>
      externalUnlockedStages.includes(id),
    )
  }, [challengeState.unlockedStages, externalUnlockedStages])

  // Check if time has expired
  const isTimeExpired = useMemo(() => {
    return challengeState.timerStatus === 'expired'
  }, [challengeState.timerStatus])

  // PythonRunner instance ref
  const runnerRef = useRef<PythonRunner | null>(null)

  const addTerminalLine = useCallback((line: TerminalLine) => {
    setTerminalLines((prev) => [...prev, line])
  }, [])

  // Initialize PythonRunner once
  useEffect(() => {
    const runner = new PythonRunner({
      onOutput: (line) => {
        addTerminalLine(line)
      },
      onStatusChange: (status) => {
        setExecutionStatus(status)
      },
      onWaitingForInput: () => {
        // Runner signaled input is awaited
      },
    })

    runnerRef.current = runner
    void runner.initialize()

    return () => {
      runner.reset()
    }
  }, [addTerminalLine])

  const setCode = useCallback(
    (newCode: string) => {
      setChallengeState((prev) => ({
        ...prev,
        stageCodes: {
          ...prev.stageCodes,
          [prev.currentStageId]: newCode,
        },
        lastUpdated: Date.now(),
      }))
    },
    [],
  )

  const selectStage = useCallback(
    (stageId: CodingStageId): boolean => {
      if (!effectiveUnlockedStages.includes(stageId)) {
        return false
      }
      setChallengeState((prev) => ({
        ...prev,
        currentStageId: stageId,
        lastUpdated: Date.now(),
      }))
      setValidationResult(null)
      return true
    },
    [effectiveUnlockedStages],
  )

  const resetCurrentStageCode = useCallback(() => {
    const starter = currentStage.starterCode
    setCode(starter)
  }, [currentStage, setCode])

  const clearTerminal = useCallback(() => {
    setTerminalLines([])
  }, [])

  const currentCode = challengeState.stageCodes[challengeState.currentStageId] || ''

  const runCode = useCallback(async () => {
    if (!runnerRef.current) return
    setValidationResult(null)
    await runnerRef.current.run(currentCode)
  }, [currentCode])

  const sendInput = useCallback((input: string) => {
    if (!runnerRef.current) return
    runnerRef.current.sendInput(input)
  }, [])

  const stopExecution = useCallback(() => {
    if (!runnerRef.current) return
    runnerRef.current.interrupt()
  }, [])

  const submitSolution = useCallback(async (): Promise<ValidationResult> => {
    // Check deadline before allowing submission
    if (isTimeExpired) {
      return {
        success: false,
        message: 'Time has expired. You can no longer submit code.',
        error: 'DEADLINE_EXCEEDED',
      }
    }

    setIsValidating(true)
    try {
      const validator = currentStage.validate
      const result = await validator(currentCode, terminalLines)
      setValidationResult(result)

      if (result.success) {
        // Mark current stage completed and unlock next stage
        setChallengeState((prev) => {
          const nextCompleted = prev.completedStages.includes(
            prev.currentStageId,
          )
            ? prev.completedStages
            : [...prev.completedStages, prev.currentStageId]

          const currentIndex = STAGE_ORDER.indexOf(prev.currentStageId)
          const nextUnlocked = [...prev.unlockedStages]

          if (
            currentIndex >= 0 &&
            currentIndex + 1 < STAGE_ORDER.length
          ) {
            const nextStageId = STAGE_ORDER[currentIndex + 1]
            if (!nextUnlocked.includes(nextStageId)) {
              nextUnlocked.push(nextStageId)
            }
          }

          return {
            ...prev,
            completedStages: nextCompleted,
            unlockedStages: nextUnlocked,
            lastUpdated: Date.now(),
          }
        })
      }

      return result
    } finally {
      setIsValidating(false)
    }
  }, [currentStage, currentCode, terminalLines, isTimeExpired])

  const clearValidationResult = useCallback(() => {
    setValidationResult(null)
  }, [])

  const currentIndex = STAGE_ORDER.indexOf(challengeState.currentStageId)
  const nextStageId =
    currentIndex >= 0 && currentIndex + 1 < STAGE_ORDER.length
      ? STAGE_ORDER[currentIndex + 1]
      : null

  const isNextStageUnlocked = Boolean(
    nextStageId && effectiveUnlockedStages.includes(nextStageId),
  )

  const advanceToNextStage = useCallback(() => {
    if (nextStageId && effectiveUnlockedStages.includes(nextStageId)) {
      selectStage(nextStageId)
    }
  }, [nextStageId, effectiveUnlockedStages, selectStage])

  const resetAllProgress = useCallback(() => {
    const fresh = resetCodingChallengeState()
    setChallengeState(fresh)
    setTerminalLines([])
    setValidationResult(null)
    runnerRef.current?.reset()
  }, [])

  return {
    currentStage,
    currentStageId: challengeState.currentStageId,
    code: currentCode,
    stageCodes: challengeState.stageCodes,
    completedStages: challengeState.completedStages,
    unlockedStages: effectiveUnlockedStages,
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
  }
}
