import { TOTAL_QUESTIONS } from '../data/questions'
import type { QuizSession, ScoreSummary, SectionId } from '../types/quiz'
import { getSectionQuestions } from './session'

function sectionScore(
  session: QuizSession,
  section: SectionId,
): { score: number; total: number } {
  const questions = getSectionQuestions(session, section)
  return {
    score: questions.filter((question) => session.answers[question.id]?.correct).length,
    total: questions.length,
  }
}

/**
 * Derives all scores from the immutable answer records. Points are never
 * incremented by click handlers, so duplicate submissions cannot inflate the
 * total. Only answers belonging to this session's questions count.
 */
export function computeScoreSummary(session: QuizSession): ScoreSummary {
  const sections = {
    1: sectionScore(session, 1),
    2: sectionScore(session, 2),
    3: sectionScore(session, 3),
  }

  const totalCorrect = sections[1].score + sections[2].score + sections[3].score
  const totalAnswered = [
    ...session.section1,
    ...session.section2,
    ...session.section3,
  ].filter((question) => Boolean(session.answers[question.id])).length

  const boundedCorrect = Math.min(totalCorrect, TOTAL_QUESTIONS)

  return {
    totalCorrect: boundedCorrect,
    totalIncorrect: Math.max(totalAnswered - boundedCorrect, 0),
    totalAnswered,
    totalQuestions: TOTAL_QUESTIONS,
    percentage: Math.round((boundedCorrect / TOTAL_QUESTIONS) * 100),
    sections,
  }
}

export function getPerformanceLabel(percentage: number): string {
  if (percentage === 100) return 'Perfect run'
  if (percentage >= 80) return 'Elite performance'
  if (percentage >= 60) return 'Strong finish'
  if (percentage >= 40) return 'Solid effort'
  return 'Room to grow'
}
