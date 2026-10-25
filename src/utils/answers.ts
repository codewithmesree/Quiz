import type { RiddleAnswerKey } from '../types/quiz'

/**
 * Normalizes free-text riddle answers for comparison.
 *
 * Handles trimming, casing, punctuation, accents, repeated spaces, and leading
 * articles. The comparison remains exact after normalization so unrelated
 * answers are not accidentally accepted.
 */
export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^(a|an|the)\s+/, '')
    .replace(/\s+/g, ' ')
}

export function isRiddleAnswerCorrect(
  submission: string,
  answerKey: RiddleAnswerKey,
): boolean {
  const normalizedSubmission = normalizeAnswer(submission)
  if (!normalizedSubmission) return false

  return answerKey.accepted.some(
    (accepted) => normalizeAnswer(accepted) === normalizedSubmission,
  )
}
