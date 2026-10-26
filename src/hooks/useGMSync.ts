/**
 * useGMSync — side-effect hook that keeps the GM leaderboard in sync with
 * the current team's quiz progress. Runs in player tabs.
 */
import { useEffect } from 'react'
import { gameMasterService } from '../services/gameMasterService'
import type { QuizSession } from '../types/quiz'
import { computeScoreSummary } from '../utils/scoring'

interface GMSyncOptions {
  session: QuizSession | null
  codingStagesCompleted?: number
}

export function useGMSync({ session, codingStagesCompleted = 0 }: GMSyncOptions) {
  useEffect(() => {
    if (!session) return
    const score = computeScoreSummary(session)
    gameMasterService.init()
    gameMasterService.updateLiveScore({
      teamName: session.profile.teamName,
      sessionId: session.id,
      correctAnswers: score.totalCorrect,
      totalAnswered: score.totalAnswered,
      codingStagesCompleted,
      lastUpdated: Date.now(),
    })
    gameMasterService.registerTeam({
      teamName: session.profile.teamName,
      sessionId: session.id,
      joinedAt: Date.now(),
    })
  // We update when answer count or coding progress changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.answers, codingStagesCompleted, session?.id])
}
