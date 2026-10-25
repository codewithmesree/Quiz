import { describe, expect, it } from 'vitest'
import { TOTAL_QUESTIONS } from '../data/questions'
import type { AnswerRecord, QuizSession } from '../types/quiz'
import { createQuizSession } from './session'
import {
  getLeaderboardEntries,
  LEADERBOARD_STORAGE_KEY,
  submitCompletedScore,
} from './leaderboard'

function completedSession(teamName: string, correctCount: number): QuizSession {
  const session = createQuizSession({ teamName })
  const questions = [
    ...session.section1,
    ...session.section2,
    ...session.section3,
  ]
  const answers: Record<string, AnswerRecord> = {}

  questions.forEach((question, index) => {
    if (question.section === 3) {
      answers[question.id] = {
        submitted: question.answerKey.canonical,
        correct: index < correctCount,
        correctAnswer: question.answerKey.canonical,
      }
      return
    }

    const correctOption = question.options.find(
      (option) => option.id === question.correctOptionId,
    )!
    answers[question.id] = {
      submitted: correctOption.text,
      optionId: correctOption.id,
      correct: index < correctCount,
      correctAnswer: correctOption.text,
    }
  })

  return { ...session, answers }
}

describe('leaderboard', () => {
  it('records only completed scores and derives the percentage', () => {
    const completed = completedSession('Byte Force', 9)
    const incomplete = {
      ...completed,
      answers: Object.fromEntries(Object.entries(completed.answers).slice(0, 13)),
    }

    submitCompletedScore(incomplete)
    expect(getLeaderboardEntries()).toEqual([])

    submitCompletedScore(completed)
    expect(getLeaderboardEntries()).toEqual([
      {
        sessionId: completed.id,
        teamName: 'Byte Force',
        correctAnswers: 9,
        totalQuestions: TOTAL_QUESTIONS,
        percentage: 64,
      },
    ])
  })

  it('prevents repeat submissions by session and normalized team name', () => {
    const original = completedSession('Byte Force', 9)
    submitCompletedScore(original)
    submitCompletedScore(original)
    submitCompletedScore(completedSession('  BYTE   FORCE ', 14))

    expect(getLeaderboardEntries()).toHaveLength(1)
    expect(getLeaderboardEntries()[0].correctAnswers).toBe(9)
  })

  it('sorts descending and keeps equal scores in stable team-name order', () => {
    submitCompletedScore(completedSession('Zeta', 8))
    submitCompletedScore(completedSession('Bravo', 12))
    submitCompletedScore(completedSession('Alpha', 8))

    expect(getLeaderboardEntries().map((entry) => [entry.teamName, entry.correctAnswers])).toEqual([
      ['Bravo', 12],
      ['Alpha', 8],
      ['Zeta', 8],
    ])
  })

  it('uses its own localStorage key', () => {
    expect(LEADERBOARD_STORAGE_KEY).not.toBe('hwi-saiu-quiz-state')
  })
})