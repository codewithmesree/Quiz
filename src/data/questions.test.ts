import { describe, expect, it } from 'vitest'
import {
  ALL_MCQ_QUESTIONS,
  QUIZ_SECTIONS,
  RIDDLES,
  SECTION_1_POOL,
  SECTION_2_POOL,
  TOTAL_QUESTIONS,
} from '../data/questions'
import type { MCQOptionId } from '../types/quiz'

const EXPECTED_KEYS: Record<string, MCQOptionId> = {
  q1: 'A',
  q2: 'C',
  q3: 'B',
  q4: 'D',
  q5: 'C',
  q6: 'D',
  q7: 'A',
  q8: 'C',
  q9: 'B',
  q10: 'A',
  q11: 'B',
  q12: 'B',
  q13: 'B',
  q14: 'C',
  q15: 'B',
  q16: 'B',
  q17: 'C',
  q18: 'B',
  q19: 'B',
  q20: 'B',
}

describe('question bank', () => {
  it('contains exactly the 20 source MCQs and 4 source riddles', () => {
    expect(ALL_MCQ_QUESTIONS).toHaveLength(20)
    expect(RIDDLES).toHaveLength(4)
    expect(TOTAL_QUESTIONS).toBe(14)
    expect(QUIZ_SECTIONS.map((section) => section.count)).toEqual([5, 5, 4])
  })

  it('keeps Q1–Q10 in section 1 and Q11–Q20 in section 2', () => {
    expect(SECTION_1_POOL.map((question) => question.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => `q${index + 1}`),
    )
    expect(SECTION_2_POOL.map((question) => question.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => `q${index + 11}`),
    )
    expect(SECTION_1_POOL.every((question) => question.section === 1)).toBe(true)
    expect(SECTION_2_POOL.every((question) => question.section === 2)).toBe(true)
  })

  it('preserves IDs, four options each, and the source answer key', () => {
    for (const question of ALL_MCQ_QUESTIONS) {
      expect(question.options).toHaveLength(4)
      expect(question.options.map((option) => option.id)).toEqual([
        'A',
        'B',
        'C',
        'D',
      ])
      expect(question.options.map((option) => option.text).every(Boolean)).toBe(
        true,
      )
      expect(question.correctOptionId).toBe(EXPECTED_KEYS[question.id])
      expect(
        question.options.some(
          (option) => option.id === question.correctOptionId,
        ),
      ).toBe(true)
    }
  })

  it('uses the exact source wording for representative questions', () => {
    const q1 = SECTION_1_POOL[0]
    expect(q1.prompt).toBe('What is the full form of RAM?')
    expect(q1.options.map((option) => option.text)).toEqual([
      'Random Access Memory',
      'Read Access Memory',
      'Readily Available Memory',
      'Random Available Memory',
    ])

    const q4 = SECTION_1_POOL[3]
    expect(q4.prompt).toBe('Which of the following is NOT a programming language?')
    expect(q4.correctOptionId).toBe('D')

    const q6 = SECTION_1_POOL[5]
    expect(q6.prompt).toBe('Which storage device has the largest capacity?')
    expect(q6.correctOptionId).toBe('D')
    expect(q6.answerNote).toContain('capacities vary')

    const q13 = SECTION_2_POOL[2]
    expect(q13.prompt).toBe("What does 'HTTP' stand for?")
    expect(q13.correctOptionId).toBe('B')
  })

  it('contains all four riddles in their original order with editable keys', () => {
    expect(RIDDLES.map((riddle) => riddle.id)).toEqual(['r1', 'r2', 'r3', 'r4'])
    expect(RIDDLES[0].prompt).toBe(
      'I am full of letters but I am not a book. I have Space but no room, and you can Enter but never step inside. What am I?',
    )
    expect(RIDDLES[1].prompt).toContain('small creature with a tail')
    expect(RIDDLES[2].prompt).toContain('even after the computer sleeps')
    expect(RIDDLES[3].prompt).toContain('I guard the gate of your computer')

    expect(RIDDLES[0].answerKey.canonical).toBe('Keyboard')
    expect(RIDDLES[1].answerKey.canonical).toContain('Cursor')
    expect(RIDDLES[2].answerKey.canonical).toContain('Hard drive')
    expect(RIDDLES[3].answerKey.canonical).toContain('Password')

    for (const riddle of RIDDLES) {
      expect(riddle.answerKey.accepted.length).toBeGreaterThan(1)
      expect(riddle.answerKey.note).toContain('Provisional answer')
    }
  })
})
