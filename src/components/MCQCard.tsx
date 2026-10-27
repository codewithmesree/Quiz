import { ArrowRight, Check, CircleCheck, CircleX, Lock, X } from 'lucide-react'
import type {
  AnswerRecord,
  MCQOption,
  MCQOptionId,
  MCQQuestion,
  SectionMeta,
} from '../types/quiz'
import { cn } from '../utils/cn'
import { Button } from './Button'
import { ProgressBar } from './ProgressBar'
import { SectionIcon } from './SectionIcon'

interface MCQCardProps {
  question: MCQQuestion
  answer: AnswerRecord | undefined
  section: SectionMeta
  index: number
  total: number
  nextLabel: string
  onSelect: (optionId: MCQOptionId) => void
  onAdvance: () => void
}

type OptionState = 'idle' | 'correct' | 'wrong' | 'reveal' | 'muted'

const OPTION_CLASSES: Record<OptionState, string> = {
  idle: 'border-white/[0.09] bg-white/[0.02] hover:border-hwi/55 hover:bg-hwi/[0.07]',
  correct:
    'border-emerald-500/60 bg-emerald-500/[0.12] shadow-[0_0_34px_-14px_rgba(34,197,94,0.65)]',
  wrong:
    'border-red-500/60 bg-red-500/[0.12] shadow-[0_0_34px_-14px_rgba(239,68,68,0.65)]',
  reveal: 'border-emerald-500/40 bg-emerald-500/[0.05]',
  muted: 'border-white/[0.05] bg-black/20 opacity-55',
}

const LETTER_CLASSES: Record<OptionState, string> = {
  idle: 'border-white/10 bg-white/[0.04] text-white/80',
  correct: 'border-emerald-400/60 bg-emerald-500 text-black',
  wrong: 'border-red-400/60 bg-red-500 text-white',
  reveal: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  muted: 'border-white/[0.06] bg-white/[0.02] text-muted/50',
}

const TEXT_CLASSES: Record<OptionState, string> = {
  idle: 'text-white/90',
  correct: 'text-emerald-50',
  wrong: 'text-red-50',
  reveal: 'text-emerald-100/90',
  muted: 'text-muted/60',
}

function getOptionState(
  option: MCQOption,
  answer: AnswerRecord | undefined,
  correctOptionId: MCQOptionId,
): OptionState {
  if (!answer) return 'idle'
  if (answer.optionId === option.id) {
    return answer.correct ? 'correct' : 'wrong'
  }
  if (option.id === correctOptionId) return 'reveal'
  return 'muted'
}

export function MCQCard({
  question,
  answer,
  section,
  index,
  total,
  nextLabel,
  onSelect,
  onAdvance,
}: MCQCardProps) {
  const promptId = `question-${question.id}-prompt`
  const isLocked = Boolean(answer)

  return (
    <article
      className="surface animate-fade-up overflow-hidden"
      data-testid="question-card"
      data-question-id={question.id}
      data-section={question.section}
      aria-labelledby={promptId}
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-hwi/60 to-transparent" />

      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full border border-hwi/20 bg-hwi/[0.05] px-3 py-1.5">
            <SectionIcon section={section.id} className="text-hwi" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-hwi">
              {section.eyebrow}
            </span>
            <span className="hidden h-3 w-px bg-hwi/20 sm:block" aria-hidden="true" />
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.16em] text-white/65 sm:block">
              {section.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-md border border-white/[0.07] bg-black/25 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted/60">
              {isLocked ? 'Answer locked' : 'Unanswered'}
            </span>
            <p className="font-display text-xs font-semibold tabular-nums text-muted/70">
              <span className="text-lg text-white">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="mx-0.5">/</span>
              {String(total).padStart(2, '0')}
            </p>
          </div>
        </div>

        <ProgressBar
          value={index + 1}
          max={total}
          label={`${section.name}, question ${index + 1} of ${total}`}
          className="mt-4"
        />

        <div className="mt-7 flex items-center gap-2">
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-hwi">
            Question {String(index + 1).padStart(2, '0')}
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted/45">
            Select one
          </span>
        </div>

        <h1
          id={promptId}
          className="mt-4 max-w-3xl text-balance font-display text-xl font-semibold leading-snug tracking-[-0.01em] text-white sm:text-2xl lg:text-[1.7rem]"
        >
          {question.prompt}
        </h1>

        <div
          className="mt-6 grid gap-2.5 sm:mt-7"
          role="group"
          aria-labelledby={promptId}
        >
          {question.options.map((option) => {
            const state = getOptionState(option, answer, question.correctOptionId)
            const isSelected = answer?.optionId === option.id
            const showCorrectTag = state === 'correct' || state === 'reveal'
            const showWrongTag = state === 'wrong'

            return (
              <button
                key={option.id}
                type="button"
                data-testid={`option-${option.id}`}
                data-option-id={option.id}
                data-state={state}
                aria-pressed={isSelected}
                disabled={isLocked}
                onClick={() => {
                  if (!isLocked) onSelect(option.id)
                }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hwi disabled:cursor-default sm:gap-4 sm:px-4 sm:py-4',
                  OPTION_CLASSES[state],
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg border font-display text-xs font-bold transition-colors sm:size-9 sm:text-sm',
                    LETTER_CLASSES[state],
                  )}
                  aria-hidden="true"
                >
                  {option.id}
                </span>

                <span
                  className={cn(
                    'min-w-0 flex-1 text-sm font-medium leading-snug sm:text-[0.95rem]',
                    TEXT_CLASSES[state],
                  )}
                >
                  {option.text}
                </span>

                {showCorrectTag && (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-400">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                    <span className="hidden sm:inline">
                      {state === 'correct' ? 'Correct' : 'Correct answer'}
                    </span>
                    <span className="sr-only sm:hidden">
                      {state === 'correct' ? 'Correct' : 'Correct answer'}
                    </span>
                  </span>
                )}

                {showWrongTag && (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-red-400">
                    <X className="size-3" strokeWidth={3} aria-hidden="true" />
                    <span className="hidden sm:inline">Your answer</span>
                    <span className="sr-only sm:hidden">Your answer</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div aria-live="polite" className="mt-5">
          {answer && (
            <div
              className={cn(
                'feedback-in flex items-start gap-3 rounded-xl border px-4 py-3.5',
                answer.correct
                  ? 'border-emerald-500/30 bg-emerald-500/[0.07]'
                  : 'border-red-500/30 bg-red-500/[0.07]',
              )}
              data-testid="feedback"
            >
              {answer.correct ? (
                <CircleCheck
                  className="mt-0.5 size-5 shrink-0 text-emerald-400"
                  aria-hidden="true"
                />
              ) : (
                <CircleX
                  className="mt-0.5 size-5 shrink-0 text-red-400"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'font-display text-sm font-bold',
                    answer.correct ? 'text-emerald-300' : 'text-red-300',
                  )}
                >
                  {answer.correct ? 'Correct!' : 'Incorrect'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted/80">
                  {answer.correct
                    ? 'Locked in. You earned 1 point for this question.'
                    : `The correct answer is ${question.correctOptionId}: ${answer.correctAnswer}.`}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-md border px-2 py-1 font-display text-[10px] font-bold tabular-nums',
                  answer.correct
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/25 bg-red-500/10 text-red-300',
                )}
              >
                {answer.correct ? '+1' : '+0'}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted/50">
            <Lock className="size-3 shrink-0" aria-hidden="true" />
            {answer
              ? 'Answer locked for this session'
              : 'Submit an answer to unlock the next question'}
          </p>
          <Button
            onClick={onAdvance}
            disabled={!answer}
            size="md"
            className="w-full sm:w-auto"
          >
            {nextLabel}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  )
}
