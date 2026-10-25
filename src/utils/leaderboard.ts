import { TOTAL_QUESTIONS } from '../data/questions'
import type { QuizSession } from '../types/quiz'
import { computeScoreSummary } from './scoring'
import { isSessionComplete } from './session'

export const LEADERBOARD_STORAGE_KEY = 'hwi-saiu-quiz-leaderboard'

export interface LeaderboardEntry {
  sessionId: string
  teamName: string
  correctAnswers: number
  totalQuestions: number
  percentage: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeTeamName(teamName: string): string {
  return teamName.trim().replace(/\s+/g, ' ').toLowerCase()
}

function parseEntries(value: unknown): LeaderboardEntry[] {
  if (!Array.isArray(value)) return []

  return value.filter((entry): entry is LeaderboardEntry => {
    if (!isRecord(entry)) return false
    return (
      typeof entry.sessionId === 'string' &&
      Boolean(entry.sessionId) &&
      typeof entry.teamName === 'string' &&
      Boolean(entry.teamName.trim()) &&
      typeof entry.correctAnswers === 'number' &&
      Number.isInteger(entry.correctAnswers) &&
      entry.correctAnswers >= 0 &&
      entry.correctAnswers <= TOTAL_QUESTIONS &&
      entry.totalQuestions === TOTAL_QUESTIONS &&
      entry.percentage ===
        Math.round((entry.correctAnswers / TOTAL_QUESTIONS) * 100)
    )
  })
}

function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries.sort(
    (left, right) =>
      right.correctAnswers - left.correctAnswers ||
      left.teamName.localeCompare(right.teamName, undefined, {
        sensitivity: 'base',
      }) ||
      left.sessionId.localeCompare(right.sessionId),
  )
}

export function getLeaderboardEntries(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY)
    return raw ? sortEntries(parseEntries(JSON.parse(raw) as unknown)) : []
  } catch {
    return []
  }
}

/** Records only complete attempts and treats both retries and team repeats as duplicates. */
export function submitCompletedScore(session: QuizSession): void {
  if (typeof window === 'undefined' || !isSessionComplete(session)) return

  try {
    const entries = getLeaderboardEntries()
    const normalizedName = normalizeTeamName(session.profile.teamName)
    if (
      entries.some(
        (entry) =>
          entry.sessionId === session.id ||
          normalizeTeamName(entry.teamName) === normalizedName,
      )
    ) {
      return
    }

    const score = computeScoreSummary(session)
    entries.push({
      sessionId: session.id,
      teamName: session.profile.teamName.trim(),
      correctAnswers: score.totalCorrect,
      totalQuestions: TOTAL_QUESTIONS,
      percentage: score.percentage,
    })
    window.localStorage.setItem(
      LEADERBOARD_STORAGE_KEY,
      JSON.stringify(sortEntries(entries)),
    )
  } catch {
    // The quiz remains usable if browser storage is unavailable.
  }
}