/**
 * Game Master types for the live multiplayer session.
 * Communication via BroadcastChannel + localStorage — no backend needed.
 */

export type GamePhase =
  | 'lobby'
  | 'round-1'
  | 'round-2'
  | 'round-3'
  | 'coding'
  | 'finale'

export interface TeamRegistration {
  teamName: string
  joinedAt: number
  sessionId: string
}

export interface LiveScore {
  teamName: string
  sessionId: string
  correctAnswers: number
  totalAnswered: number
  codingStagesCompleted: number
  lastUpdated: number
}

export interface Announcement {
  id: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  createdAt: number
  expiresAt?: number
}

export interface GameMasterState {
  version: number
  isLive: boolean
  phase: GamePhase
  teams: TeamRegistration[]
  liveScores: LiveScore[]
  adminPasscode: string
  startedAt: number | null
  phaseChangedAt: number | null
  showCountdown: boolean
  countdownSeconds: number
  announcements: Announcement[]
}

export type GMMessage =
  | { type: 'STATE_UPDATE'; state: GameMasterState }
  | { type: 'PHASE_CHANGE'; phase: GamePhase; prevPhase: GamePhase }
  | { type: 'TEAM_JOINED'; team: TeamRegistration }
  | { type: 'SCORE_UPDATE'; score: LiveScore }
  | { type: 'ANNOUNCEMENT'; announcement: Announcement }
  | { type: 'PING' }
  | { type: 'PONG'; tabId: string }

export const GM_CHANNEL_NAME = 'hwi-saiu-gm'
export const GM_STORAGE_KEY = 'hwi-saiu-gm-state'
export const GM_DEFAULT_PASSCODE = '2024'

export function createDefaultGMState(): GameMasterState {
  return {
    version: 0,
    isLive: false,
    phase: 'lobby',
    teams: [],
    liveScores: [],
    adminPasscode: GM_DEFAULT_PASSCODE,
    startedAt: null,
    phaseChangedAt: null,
    showCountdown: false,
    countdownSeconds: 5,
    announcements: [],
  }
}

export const GAME_PHASE_LABELS: Record<GamePhase, string> = {
  lobby: 'Lobby',
  'round-1': 'Round 1 — Computer Knowledge',
  'round-2': 'Round 2 — Advanced Knowledge',
  'round-3': 'Round 3 — Riddles',
  coding: 'Python Code Lab',
  finale: 'Final Results',
}

export const GAME_PHASE_ORDER: GamePhase[] = [
  'lobby',
  'round-1',
  'round-2',
  'round-3',
  'coding',
  'finale',
]

export function getNextPhase(current: GamePhase): GamePhase | null {
  const index = GAME_PHASE_ORDER.indexOf(current)
  if (index === -1 || index === GAME_PHASE_ORDER.length - 1) return null
  return GAME_PHASE_ORDER[index + 1]
}

export function getPrevPhase(current: GamePhase): GamePhase | null {
  const index = GAME_PHASE_ORDER.indexOf(current)
  if (index <= 0) return null
  return GAME_PHASE_ORDER[index - 1]
}
