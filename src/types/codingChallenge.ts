/**
 * Types for the embedded Python Coding Challenge IDE.
 */

export type CodingStageId = 'part-1' | 'part-2' | 'debugging'

export type StageStatus = 'locked' | 'unlocked' | 'completed' | 'in_progress'

export type ExecutionStatus =
  | 'idle'
  | 'initializing'
  | 'running'
  | 'waiting_for_input'
  | 'completed'
  | 'failed'
  | 'interrupted'

export type TerminalLineType =
  | 'system'
  | 'stdout'
  | 'stderr'
  | 'stdin'
  | 'prompt'
  | 'error'
  | 'success'
  | 'info'

export interface TerminalLine {
  id: string
  type: TerminalLineType
  text: string
  timestamp: number
}

export interface ValidationDetail {
  title: string
  passed: boolean
  description?: string
}

export interface ValidationResult {
  success: boolean
  message: string
  details?: ValidationDetail[]
  error?: string
}

export interface StageDefinition {
  id: CodingStageId
  index: number
  title: string
  subtitle: string
  tagline: string
  description: string
  instructions: readonly string[]
  requirements: readonly string[]
  hints: readonly string[]
  starterCode: string
  /**
   * Configurable validator function for this stage.
   * Can inspect code and output to verify completion criteria.
   */
  validate: (
    code: string,
    executionOutputs: readonly TerminalLine[],
  ) => Promise<ValidationResult> | ValidationResult
}

export interface ChallengeDefinition {
  id: string
  title: string
  subtitle: string
  description: string
  stages: readonly StageDefinition[]
}

export type TimerStatus = 'not_started' | 'running' | 'expired'

export interface CodingChallengeState {
  version: number
  currentStageId: CodingStageId
  stageCodes: Record<CodingStageId, string>
  completedStages: readonly CodingStageId[]
  unlockedStages: readonly CodingStageId[]
  lastUpdated: number
  // Timer fields (40 minutes = 2400 seconds)
  timerStartTime?: number // Unix timestamp when timer started
  timerDeadline?: number // Unix timestamp when timer expires
  timerStatus?: TimerStatus // 'not_started', 'running', 'expired'
  instructionsViewed?: boolean // Whether coding instructions page has been shown
}
