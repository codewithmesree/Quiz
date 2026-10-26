/**
 * GameMasterService — singleton that manages GM state in localStorage and
 * broadcasts changes to all open tabs via BroadcastChannel.
 *
 * Admin tab WRITES state; player tabs READ state.
 */
import type { GameMasterState, GMMessage, GamePhase, LiveScore, TeamRegistration, Announcement } from '../types/gamemaster'
import { GM_CHANNEL_NAME, GM_STORAGE_KEY, createDefaultGMState, GAME_PHASE_ORDER } from '../types/gamemaster'
import { syncGameMasterToCloud, subscribeToCloudGameMaster } from './firebaseSync'

function loadState(): GameMasterState {
  try {
    const raw = localStorage.getItem(GM_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as GameMasterState
  } catch {
    // ignore
  }
  return createDefaultGMState()
}

function saveState(state: GameMasterState): void {
  try {
    localStorage.setItem(GM_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

type StateListener = (state: GameMasterState) => void

class GameMasterService {
  private channel: BroadcastChannel | null = null
  private cloudUnsub: (() => void) | null = null
  private listeners = new Set<StateListener>()

  init(): void {
    if (this.channel) return
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(GM_CHANNEL_NAME)
      this.channel.addEventListener('message', (event: MessageEvent<GMMessage>) => {
        if (event.data?.type === 'STATE_UPDATE') {
          this.notifyListeners(event.data.state)
        }
      })
    }

    try {
      this.cloudUnsub = subscribeToCloudGameMaster((cloudUpdate) => {
        if (!cloudUpdate) return
        const current = loadState()
        if (typeof cloudUpdate.version === 'number' && cloudUpdate.version > current.version) {
          const merged = { ...current, ...cloudUpdate } as GameMasterState
          saveState(merged)
          this.notifyListeners(merged)
        }
      })
    } catch {
      // ignore
    }
  }

  destroy(): void {
    this.channel?.close()
    this.channel = null
    this.cloudUnsub?.()
    this.cloudUnsub = null
    this.listeners.clear()
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(state: GameMasterState): void {
    this.listeners.forEach((l) => l(state))
  }

  private broadcast(state: GameMasterState): void {
    const msg: GMMessage = { type: 'STATE_UPDATE', state }
    try {
      this.channel?.postMessage(msg)
    } catch {
      // ignore
    }
  }

  getState(): GameMasterState {
    return loadState()
  }

  /** Write a new state, persist it, and broadcast to all tabs. */
  setState(updater: (prev: GameMasterState) => GameMasterState): GameMasterState {
    const prev = loadState()
    const next = updater({ ...prev, version: prev.version + 1 })
    saveState(next)
    this.broadcast(next)
    this.notifyListeners(next)
    syncGameMasterToCloud(next).catch(() => {})
    return next
  }

  resetGame(): void {
    const fresh = createDefaultGMState()
    saveState(fresh)
    this.broadcast(fresh)
    this.notifyListeners(fresh)
    syncGameMasterToCloud(fresh).catch(() => {})
  }

  setLiveMode(isLive: boolean): void {
    this.setState((prev) => ({
      ...prev,
      isLive,
      startedAt: isLive ? (prev.startedAt ?? Date.now()) : prev.startedAt,
    }))
  }

  setPhase(phase: GamePhase, activateLive = true): void {
    this.setState((prev) => ({
      ...prev,
      phase,
      phaseChangedAt: Date.now(),
      isLive: activateLive ? true : prev.isLive,
      startedAt: activateLive ? (prev.startedAt ?? Date.now()) : prev.startedAt,
    }))
  }

  advancePhase(): void {
    const state = this.getState()
    const current = state.phase
    const index = GAME_PHASE_ORDER.indexOf(current)
    if (index < GAME_PHASE_ORDER.length - 1) {
      this.setPhase(GAME_PHASE_ORDER[index + 1])
    }
  }

  rewindPhase(): void {
    const state = this.getState()
    const current = state.phase
    const index = GAME_PHASE_ORDER.indexOf(current)
    if (index > 0) {
      this.setPhase(GAME_PHASE_ORDER[index - 1])
    }
  }

  registerTeam(team: TeamRegistration): void {
    this.setState((prev) => {
      const exists = prev.teams.some((t) => t.sessionId === team.sessionId)
      if (exists) return prev
      return { ...prev, teams: [...prev.teams, team] }
    })
  }

  updateLiveScore(score: LiveScore): void {
    this.setState((prev) => {
      const others = prev.liveScores.filter((s) => s.sessionId !== score.sessionId)
      return { ...prev, liveScores: [...others, score] }
    })
  }

  addAnnouncement(message: string, type: Announcement['type'] = 'info', durationMs = 8000): void {
    const announcement: Announcement = {
      id: Math.random().toString(36).slice(2),
      message,
      type,
      createdAt: Date.now(),
      expiresAt: durationMs ? Date.now() + durationMs : undefined,
    }
    this.setState((prev) => ({
      ...prev,
      announcements: [...prev.announcements.slice(-4), announcement],
    }))
  }

  setPasscode(passcode: string): void {
    this.setState((prev) => ({ ...prev, adminPasscode: passcode }))
  }
}

export const gameMasterService = new GameMasterService()
