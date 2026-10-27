import { describe, expect, it } from 'vitest'
import { SECTION_1_POOL, SECTION_2_POOL } from '../data/questions'
import { createQuizSession, getCurrentQuestion } from './session'

const PROFILE = {
  teamName: '  Byte Force  ',
}

describe('quiz session creation', () => {
  it('creates a stable session with ten unique questions per MCQ section', () => {
    const sectionOneIds = new Set(SECTION_1_POOL.map((question) => question.id))
    const sectionTwoIds = new Set(SECTION_2_POOL.map((question) => question.id))

    for (let run = 0; run < 30; run += 1) {
      const session = createQuizSession(PROFILE)
      expect(session.section1).toHaveLength(10)
      expect(session.section2).toHaveLength(10)
      expect(session.section3).toHaveLength(4)
      expect(new Set(session.section1.map((question) => question.id)).size).toBe(
        10,
      )
      expect(new Set(session.section2.map((question) => question.id)).size).toBe(
        10,
      )
      expect(
        session.section1.every((question) => sectionOneIds.has(question.id)),
      ).toBe(true)
      expect(
        session.section2.every((question) => sectionTwoIds.has(question.id)),
      ).toBe(true)
      expect(session.section3.map((riddle) => riddle.id)).toEqual([
        'r1',
        'r2',
        'r3',
        'r4',
      ])
    }
  })

  it('trims profile data and starts with no answers', () => {
    const session = createQuizSession(PROFILE)
    expect(session.profile).toEqual({ teamName: 'Byte Force' })
    expect(session.answers).toEqual({})
  })

  it('does not mutate the shared question pools', () => {
    createQuizSession(PROFILE)
    expect(SECTION_1_POOL).toHaveLength(10)
    expect(SECTION_2_POOL).toHaveLength(10)
    expect(SECTION_1_POOL[0].id).toBe('q1')
    expect(SECTION_2_POOL[0].id).toBe('q11')
  })

  it('resolves the current question for each section', () => {
    const session = createQuizSession(PROFILE)
    expect(getCurrentQuestion(session, 1, 0)?.id).toBe(session.section1[0].id)
    expect(getCurrentQuestion(session, 2, 4)?.id).toBe(session.section2[4].id)
    expect(getCurrentQuestion(session, 3, 3)?.id).toBe('r4')
    expect(getCurrentQuestion(session, 1, 99)).toBeUndefined()
  })
})
