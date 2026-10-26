import { GUESS_THE_NUMBER_STAGES, STAGE_ORDER } from '../config/codingChallengeConfig'
import type {
  CodingChallengeState,
  CodingStageId,
} from '../types/codingChallenge'

export const CODING_CHALLENGE_STORAGE_KEY = 'hwi-coding-challenge-state-v2'
const STORAGE_VERSION = 2

export function getDefaultStarterCodes(): Record<CodingStageId, string> {
  const codes: Partial<Record<CodingStageId, string>> = {}
  for (const stage of GUESS_THE_NUMBER_STAGES) {
    codes[stage.id] = stage.starterCode
  }
  return codes as Record<CodingStageId, string>
}

export function getDefaultCodingChallengeState(): CodingChallengeState {
  return {
    version: STORAGE_VERSION,
    currentStageId: 'part-1',
    stageCodes: getDefaultStarterCodes(),
    completedStages: [],
    unlockedStages: ['part-1'],
    lastUpdated: Date.now(),
  }
}

function isValidStageId(value: unknown): value is CodingStageId {
  return typeof value === 'string' && STAGE_ORDER.includes(value as CodingStageId)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Loads the persisted coding challenge state from localStorage.
 * If data is absent, malformed, or outdated, returns default state.
 */
export function loadCodingChallengeState(): CodingChallengeState {
  if (typeof window === 'undefined') {
    return getDefaultCodingChallengeState()
  }

  try {
    const raw = window.localStorage.getItem(CODING_CHALLENGE_STORAGE_KEY)
    if (!raw) return getDefaultCodingChallengeState()

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) {
      return getDefaultCodingChallengeState()
    }

    const currentStageId = isValidStageId(parsed.currentStageId)
      ? parsed.currentStageId
      : 'part-1'

    const defaults = getDefaultStarterCodes()
    const stageCodes: Record<CodingStageId, string> = { ...defaults }

    if (isRecord(parsed.stageCodes)) {
      for (const stageId of STAGE_ORDER) {
        if (typeof parsed.stageCodes[stageId] === 'string') {
          stageCodes[stageId] = parsed.stageCodes[stageId] as string
        }
      }
    }

    const completedStages: CodingStageId[] = []
    if (Array.isArray(parsed.completedStages)) {
      for (const item of parsed.completedStages) {
        if (isValidStageId(item) && !completedStages.includes(item)) {
          completedStages.push(item)
        }
      }
    }

    const unlockedStages: CodingStageId[] = ['part-1']
    if (Array.isArray(parsed.unlockedStages)) {
      for (const item of parsed.unlockedStages) {
        if (isValidStageId(item) && !unlockedStages.includes(item)) {
          unlockedStages.push(item)
        }
      }
    } else {
      // Reconstruct unlocked stages from completed stages
      for (const completed of completedStages) {
        const idx = STAGE_ORDER.indexOf(completed)
        if (idx >= 0 && idx + 1 < STAGE_ORDER.length) {
          const next = STAGE_ORDER[idx + 1]
          if (!unlockedStages.includes(next)) {
            unlockedStages.push(next)
          }
        }
      }
    }

    return {
      version: STORAGE_VERSION,
      currentStageId,
      stageCodes,
      completedStages,
      unlockedStages,
      lastUpdated:
        typeof parsed.lastUpdated === 'number'
          ? parsed.lastUpdated
          : Date.now(),
    }
  } catch {
    return getDefaultCodingChallengeState()
  }
}

/**
 * Persists the current coding challenge state to localStorage.
 */
export function saveCodingChallengeState(state: CodingChallengeState): void {
  if (typeof window === 'undefined') return

  try {
    const payload: CodingChallengeState = {
      version: STORAGE_VERSION,
      currentStageId: state.currentStageId,
      stageCodes: state.stageCodes,
      completedStages: state.completedStages,
      unlockedStages: state.unlockedStages,
      lastUpdated: Date.now(),
    }
    window.localStorage.setItem(
      CODING_CHALLENGE_STORAGE_KEY,
      JSON.stringify(payload),
    )
  } catch {
    // Storage quota or private browsing silently ignored
  }
}

/**
 * Resets the coding challenge progress back to fresh defaults.
 */
export function resetCodingChallengeState(): CodingChallengeState {
  const fresh = getDefaultCodingChallengeState()
  saveCodingChallengeState(fresh)
  return fresh
}
