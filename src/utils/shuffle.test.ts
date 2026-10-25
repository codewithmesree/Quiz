import { describe, expect, it } from 'vitest'
import { SECTION_1_POOL, SECTION_2_POOL } from '../data/questions'
import { sample, shuffle } from './shuffle'

describe('shuffle', () => {
  it('returns a permutation without mutating the source', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8]
    const snapshot = [...source]
    const result = shuffle(source)

    expect(result).toHaveLength(source.length)
    expect([...result].sort((a, b) => a - b)).toEqual(snapshot)
    expect(source).toEqual(snapshot)
  })

  it('selects the requested number of unique items from a pool', () => {
    const ids = SECTION_1_POOL.map((question) => question.id)

    for (let run = 0; run < 50; run += 1) {
      const selected = sample(SECTION_1_POOL, 5)
      expect(selected).toHaveLength(5)
      expect(new Set(selected.map((question) => question.id)).size).toBe(5)
      expect(selected.every((question) => ids.includes(question.id))).toBe(true)
    }
  })

  it('never mixes the two MCQ pools', () => {
    const sectionOneIds = new Set(SECTION_1_POOL.map((question) => question.id))
    const sectionTwoIds = new Set(SECTION_2_POOL.map((question) => question.id))

    for (let run = 0; run < 25; run += 1) {
      const one = sample(SECTION_1_POOL, 5)
      const two = sample(SECTION_2_POOL, 5)
      expect(one.every((question) => sectionOneIds.has(question.id))).toBe(true)
      expect(two.every((question) => sectionTwoIds.has(question.id))).toBe(true)
    }
  })

  it('rejects impossible selections', () => {
    expect(() => sample([1, 2], 3)).toThrow(RangeError)
    expect(() => sample([1, 2], -1)).toThrow(RangeError)
  })
})
