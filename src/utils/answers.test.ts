import { describe, expect, it } from 'vitest'
import { RIDDLES } from '../data/questions'
import { isRiddleAnswerCorrect, normalizeAnswer } from './answers'

describe('normalizeAnswer', () => {
  it('ignores case, surrounding whitespace, punctuation and articles', () => {
    expect(normalizeAnswer('  The KEYBOARD. ')).toBe('keyboard')
    expect(normalizeAnswer('A   hard-drive!')).toBe('hard drive')
    expect(normalizeAnswer('Mouse-pointer')).toBe('mouse pointer')
    expect(normalizeAnswer('')).toBe('')
  })
})

describe('riddle marking', () => {
  it('accepts the documented variants for each riddle', () => {
    const keys = Object.fromEntries(
      RIDDLES.map((riddle) => [riddle.id, riddle.answerKey]),
    )

    expect(isRiddleAnswerCorrect('Keyboard', keys.r1)).toBe(true)
    expect(isRiddleAnswerCorrect('  computer keyboard. ', keys.r1)).toBe(true)
    expect(isRiddleAnswerCorrect('Cursor', keys.r2)).toBe(true)
    expect(isRiddleAnswerCorrect('Mouse Pointer', keys.r2)).toBe(true)
    expect(isRiddleAnswerCorrect('hard disk drive', keys.r3)).toBe(true)
    expect(isRiddleAnswerCorrect('Storage Device', keys.r3)).toBe(true)
    expect(isRiddleAnswerCorrect('HDD', keys.r3)).toBe(true)
    expect(isRiddleAnswerCorrect('password', keys.r4)).toBe(true)
    expect(isRiddleAnswerCorrect('Login Authentication', keys.r4)).toBe(true)
    expect(isRiddleAnswerCorrect('Passcode', keys.r4)).toBe(true)
  })

  it('rejects blank or unrelated answers', () => {
    const keyboard = RIDDLES[0].answerKey
    expect(isRiddleAnswerCorrect('', keyboard)).toBe(false)
    expect(isRiddleAnswerCorrect('   ', keyboard)).toBe(false)
    expect(isRiddleAnswerCorrect('monitor', keyboard)).toBe(false)
    expect(isRiddleAnswerCorrect('book', keyboard)).toBe(false)
  })
})
