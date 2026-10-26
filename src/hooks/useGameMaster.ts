/**
 * useGameMaster — React hook that subscribes to GM state changes.
 * Works in both player tabs (read-only) and admin tab (read-write).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { gameMasterService } from '../services/gameMasterService'
import type { GameMasterState, GamePhase, LiveScore, TeamRegistration } from '../types/gamemaster'

export function useGameMaster() {
  const [state, setState] = useState<GameMasterState>(() => gameMasterService.getState())
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      gameMasterService.init()
      initializedRef.current = true
    }
    const unsub = gameMasterService.subscribe(setState)
    // Sync from storage on mount (covers cross-tab case)
    setState(gameMasterService.getState())
    return unsub
  }, [])

  const setPhase = useCallback((phase: GamePhase) => {
    gameMasterService.setPhase(phase)
  }, [])

  const advancePhase = useCallback(() => {
    gameMasterService.advancePhase()
  }, [])

  const rewindPhase = useCallback(() => {
    gameMasterService.rewindPhase()
  }, [])

  const resetGame = useCallback(() => {
    gameMasterService.resetGame()
  }, [])

  const registerTeam = useCallback((team: TeamRegistration) => {
    gameMasterService.registerTeam(team)
  }, [])

  const updateLiveScore = useCallback((score: LiveScore) => {
    gameMasterService.updateLiveScore(score)
  }, [])

  const addAnnouncement = useCallback(
    (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
      gameMasterService.addAnnouncement(message, type)
    },
    [],
  )

  const setPasscode = useCallback((passcode: string) => {
    gameMasterService.setPasscode(passcode)
  }, [])

  const setLiveMode = useCallback((isLive: boolean) => {
    gameMasterService.setLiveMode(isLive)
  }, [])

  return {
    state,
    isLive: state.isLive,
    phase: state.phase,
    teams: state.teams,
    liveScores: state.liveScores,
    announcements: state.announcements,
    setLiveMode,
    setPhase,
    advancePhase,
    rewindPhase,
    resetGame,
    registerTeam,
    updateLiveScore,
    addAnnouncement,
    setPasscode,
  }
}

/**
 * Lightweight hook for player tabs — only tracks current phase.
 * Avoids unnecessary re-renders in quiz components.
 */
export function useGamePhase() {
  const [phase, setPhase] = useState<GamePhase>(() => gameMasterService.getState().phase)

  useEffect(() => {
    gameMasterService.init()
    const unsub = gameMasterService.subscribe((s) => setPhase(s.phase))
    setPhase(gameMasterService.getState().phase)
    return unsub
  }, [])

  return phase
}
