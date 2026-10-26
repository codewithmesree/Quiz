import { beforeEach, describe, expect, it } from 'vitest'
import { gameMasterService } from './gameMasterService'
import { GM_STORAGE_KEY } from '../types/gamemaster'

describe('GameMasterService', () => {
  beforeEach(() => {
    localStorage.removeItem(GM_STORAGE_KEY)
    gameMasterService.resetGame()
  })

  it('initializes with default state', () => {
    const state = gameMasterService.getState()
    expect(state.phase).toBe('lobby')
    expect(state.isLive).toBe(false)
    expect(state.teams).toEqual([])
    expect(state.liveScores).toEqual([])
  })

  it('toggles live tournament mode', () => {
    gameMasterService.setLiveMode(true)
    expect(gameMasterService.getState().isLive).toBe(true)
    expect(gameMasterService.getState().startedAt).toBeTypeOf('number')

    gameMasterService.setLiveMode(false)
    expect(gameMasterService.getState().isLive).toBe(false)
  })

  it('advances and rewinds phases sequentially', () => {
    gameMasterService.advancePhase()
    expect(gameMasterService.getState().phase).toBe('round-1')
    expect(gameMasterService.getState().isLive).toBe(true)

    gameMasterService.advancePhase()
    expect(gameMasterService.getState().phase).toBe('round-2')

    gameMasterService.advancePhase()
    expect(gameMasterService.getState().phase).toBe('round-3')

    gameMasterService.advancePhase()
    expect(gameMasterService.getState().phase).toBe('coding')

    gameMasterService.advancePhase()
    expect(gameMasterService.getState().phase).toBe('finale')

    // At finale, cannot advance further
    gameMasterService.advancePhase()
    expect(gameMasterService.getState().phase).toBe('finale')

    // Rewind back
    gameMasterService.rewindPhase()
    expect(gameMasterService.getState().phase).toBe('coding')
  })

  it('registers teams without duplicates', () => {
    gameMasterService.registerTeam({
      teamName: 'CyberKnights',
      sessionId: 'session-1',
      joinedAt: Date.now(),
    })
    expect(gameMasterService.getState().teams).toHaveLength(1)

    // Re-register same team session
    gameMasterService.registerTeam({
      teamName: 'CyberKnights',
      sessionId: 'session-1',
      joinedAt: Date.now(),
    })
    expect(gameMasterService.getState().teams).toHaveLength(1)

    // Register second team
    gameMasterService.registerTeam({
      teamName: 'ByteForce',
      sessionId: 'session-2',
      joinedAt: Date.now(),
    })
    expect(gameMasterService.getState().teams).toHaveLength(2)
  })

  it('updates live scores correctly', () => {
    gameMasterService.updateLiveScore({
      teamName: 'ByteForce',
      sessionId: 'session-2',
      correctAnswers: 5,
      totalAnswered: 5,
      codingStagesCompleted: 1,
      lastUpdated: Date.now(),
    })
    const scores = gameMasterService.getState().liveScores
    expect(scores).toHaveLength(1)
    expect(scores[0].correctAnswers).toBe(5)
    expect(scores[0].codingStagesCompleted).toBe(1)
  })

  it('broadcasts announcements and caps history', () => {
    gameMasterService.addAnnouncement('Round 1 begins now!', 'success')
    const state = gameMasterService.getState()
    expect(state.announcements).toHaveLength(1)
    expect(state.announcements[0].message).toBe('Round 1 begins now!')
    expect(state.announcements[0].type).toBe('success')
  })
})
