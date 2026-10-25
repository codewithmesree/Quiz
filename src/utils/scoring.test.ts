import { describe, expect, it } from 'vitest'
import type { AnswerRecord, QuizSession } from '../types/quiz'
import { createQuizSession, isSessionComplete } from './session'
import { computeScoreSummary, getPerformanceLabel } from './scoring'

const PROFILE = {
  teamName: 'Byte Force',
  players: ['Aarav', 'Meera', 'Kabir'] as [string, string, string],
}

function sessionWithResults(
  correctCounts: [number, number, number],
): QuizSession {
  const session = createQuizSession(PROFILE)
  const answers: Record<string, AnswerRecord> = {}

  const mark = (
    questions: readonly { id: string }[],
    correctCount: number,
  ) => {
    questions.forEach((question, index) => {
      answers[question.id] = {
        submitted: 'test answer',
        correct: index < correctCount,
        correctAnswer: 'expected answer',
      }
    })
  }

  mark(session.section1, correctCounts[0])
  mark(session.section2, correctCounts[1])
  mark(session.section3, correctCounts[2])

  return { ...session, answers }
}

describe('scoring', () => {
  it('calculates section and overall scores from answer records', () => {
    const summary = computeScoreSummary(sessionWithResults([2, 4, 3]))

    expect(summary.sections[1]).toEqual({ score: 2, total: 5 })
    expect(summary.sections[2]).toEqual({ score: 4, total: 5 })
    expect(summary.sections[3]).toEqual({ score: 3, total: 4 })
    expect(summary.totalCorrect).toBe(9)
    expect(summary.totalIncorrect).toBe(5)
    expect(summary.totalAnswered).toBe(14)
    expect(summary.totalQuestions).toBe(14)
    expect(summary.percentage).toBe(64)
  })

  it('awards a perfect score of exactly 14 and 100%', () => {
    const summary = computeScoreSummary(sessionWithResults([5, 5, 4]))
    expect(summary.totalCorrect).toBe(14)
    expect(summary.totalIncorrect).toBe(0)
    expect(summary.percentage).toBe(100)
    expect(summary.totalCorrect).toBeLessThanOrEqual(14)
  })

  it('ignores records that do not belong to this session', () => {
    const session = sessionWithResults([5, 5, 4])
    const withExtras: QuizSession = {
      ...session,
      answers: {
        ...session.answers,
        q99: { submitted: 'x', correct: true, correctAnswer: 'x' },
        duplicate: { submitted: 'x', correct: true, correctAnswer: 'x' },
      },
    }

    const summary = computeScoreSummary(withExtras)
    expect(summary.totalCorrect).toBe(14)
    expect(summary.totalIncorrect).toBe(0)
    expect(summary.percentage).toBe(100)
  })

  it('counts unanswered questions without awarding points', () => {
    const summary = computeScoreSummary(createQuizSession(PROFILE))
    expect(summary.totalCorrect).toBe(0)
    expect(summary.totalAnswered).toBe(0)
    expect(summary.totalIncorrect).toBe(0)
    expect(summary.percentage).toBe(0)
  })

  it('reports completion only after all 14 answers exist', () => {
    const complete = sessionWithResults([5, 5, 4])
    expect(isSessionComplete(complete)).toBe(true)

    const incomplete = sessionWithResults([5, 5, 4])
    const answers = { ...incomplete.answers }
    delete answers[incomplete.section3[3].id]
    expect(isSessionComplete({ ...incomplete, answers })).toBe(false)
  })

  it('produces a performance label for every band', () => {
    expect(getPerformanceLabel(100)).toBe('Perfect run')
    expect(getPerformanceLabel(80)).toBe('Elite performance')
    expect(getPerformanceLabel(60)).toBe('Strong finish')
    expect(getPerformanceLabel(40)).toBe('Solid effort')
    expect(getPerformanceLabel(0)).toBe('Room to grow')
  })
})
