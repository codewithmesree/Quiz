import { describe, expect, it } from 'vitest'
import { createQuizSession } from './session'
import {
  loadQuizState,
  QUIZ_STORAGE_KEY,
  saveQuizState,
} from './persistence'
import type { AnswerRecord, QuizState } from '../types/quiz'

function stateWithFirstAnswer(
  record: (questionId: string) => AnswerRecord,
): QuizState {
  const session = createQuizSession({ teamName: '  Byte Force  ' })
  const question = session.section1[0]
  return {
    phase: 'quiz',
    session: {
      ...session,
      answers: { [question.id]: record(question.id) },
    },
    currentSection: 1,
    currentIndex: 0,
    sectionBreak: null,
    stageResults: {},
  }
}

describe('quiz persistence', () => {
  it('round-trips the draw, position, score, and locked answer', () => {
    const session = createQuizSession({ teamName: 'Byte Force' })
    const question = session.section1[2]
    const correctOption = question.options.find(
      (option) => option.id === question.correctOptionId,
    )!

    const state: QuizState = {
      phase: 'quiz',
      session: {
        ...session,
        answers: {
          [question.id]: {
            submitted: correctOption.text,
            optionId: correctOption.id,
            correct: true,
            correctAnswer: correctOption.text,
          },
        },
      },
      currentSection: 1,
      currentIndex: 2,
      sectionBreak: null,
      stageResults: {},
    }

    saveQuizState(state)
    const restored = loadQuizState()

    expect(restored).not.toBeNull()
    expect(restored?.session?.profile).toEqual({ teamName: 'Byte Force' })
    expect(restored?.session?.section1.map((item) => item.id)).toEqual(
      session.section1.map((item) => item.id),
    )
    expect(restored?.session?.section2.map((item) => item.id)).toEqual(
      session.section2.map((item) => item.id),
    )
    expect(restored?.currentSection).toBe(1)
    expect(restored?.currentIndex).toBe(2)
    expect(restored?.session?.answers[question.id]).toMatchObject({
      optionId: question.correctOptionId,
      correct: true,
    })
  })

  it('recomputes correctness instead of trusting stored points', () => {
    const session = createQuizSession({ teamName: 'Byte Force' })
    const question = session.section1[0]
    const wrongOption = question.options.find(
      (option) => option.id !== question.correctOptionId,
    )!
    const correctOption = question.options.find(
      (option) => option.id === question.correctOptionId,
    )!

    const state: QuizState = {
      phase: 'quiz',
      session: {
        ...session,
        answers: {
          [question.id]: {
            submitted: wrongOption.text,
            optionId: wrongOption.id,
            correct: true,
            correctAnswer: 'tampered',
          },
        },
      },
      currentSection: 1,
      currentIndex: 0,
      sectionBreak: null,
      stageResults: {},
    }

    saveQuizState(state)
    const restored = loadQuizState()

    expect(restored?.session?.answers[question.id]).toMatchObject({
      submitted: wrongOption.text,
      optionId: wrongOption.id,
      correct: false,
      correctAnswer: correctOption.text,
    })
  })

  it('clears saved progress when the state returns to welcome', () => {
    saveQuizState(stateWithFirstAnswer(() => ({
      submitted: 'anything',
      optionId: 'A',
      correct: false,
      correctAnswer: 'anything',
    })))
    expect(window.localStorage.getItem(QUIZ_STORAGE_KEY)).not.toBeNull()

    saveQuizState({
      phase: 'welcome',
      session: null,
      currentSection: 1,
      currentIndex: 0,
      sectionBreak: null,
      stageResults: {},
    })

    expect(window.localStorage.getItem(QUIZ_STORAGE_KEY)).toBeNull()
  })

  it('ignores corrupt or unsupported snapshots', () => {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, '{not-json')
    expect(loadQuizState()).toBeNull()

    window.localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({ version: 99, state: {} }),
    )
    expect(loadQuizState()).toBeNull()
  })
})
