/**
 * Unbiased Fisher–Yates shuffle. Returns a new array and never mutates input.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = current
  }

  return result
}

/**
 * Selects `count` distinct items uniformly at random. Each item appears at most
 * once because selection is a shuffled slice, not repeated random picks.
 */
export function sample<T>(items: readonly T[], count: number): T[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('Sample count must be a non-negative integer.')
  }
  if (count > items.length) {
    throw new RangeError(
      `Cannot select ${count} unique items from a pool of ${items.length}.`,
    )
  }

  return shuffle(items).slice(0, count)
}
