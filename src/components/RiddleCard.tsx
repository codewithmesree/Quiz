import { useEffect, useId, useRef, useState } from 'react'
import {
  ArrowRight,
  CircleCheck,
  CircleX,
  Lightbulb,
  Lock,
  Send,
} from 'lucide-react'
import type { AnswerRecord, RiddleQuestion, SectionMeta } from '../types/quiz'
import { cn } from '../utils/cn'
import { Button } from './Button'
import { ProgressBar } from './ProgressBar'
import { SectionIcon } from './SectionIcon'

interface RiddleCardProps {
  riddle: RiddleQuestion
  answer: AnswerRecord | undefined
  section: SectionMeta
  index: number
  total: number
  nextLabel: string
  onSubmit: (text: string) => void
  onAdvance: () => void
}

export function RiddleCard({
  riddle,
  answer,
  section,
  index,
  total,
  nextLabel,
  onSubmit,
  onAdvance,
}: RiddleCardProps) {
  const inputId = useId()
  const feedbackId = useId()
  const promptId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(answer?.submitted ?? '')
  const isLocked = Boolean(answer)
  const canSubmit = !isLocked && value.trim().length > 0

  // A newly opened riddle should be ready for keyboard input without stealing
  // focus on touch devices where auto-focus would open the keyboard abruptly.
  useEffect(() => {
    if (!isLocked && window.matchMedia?.('(pointer: fine)').matches) {
      inputRef.current?.focus({ preventScroll: true })
    }
  }, [isLocked, riddle.id])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit(value.trim())
  }

  return (
    <article
      className="surface animate-fade-up overflow-hidden"
      data-testid="question-card"
      data-question-id={riddle.id}
      data-section={riddle.section}
      aria-labelledby={promptId}
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-hwi/60 to-transparent" />

      <div className="p-5 sm:p-7 lg:p-8">
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
              {isLocked ? 'Answer locked' : 'Open riddle'}
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
          label={`${section.name}, riddle ${index + 1} of ${total}`}
          className="mt-4"
        />

        <div className="mt-7 flex items-center gap-2">
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-hwi">
            Riddle {String(index + 1).padStart(2, '0')}
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
          <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-muted/45">
            <Lightbulb className="size-3" aria-hidden="true" />
            Text answer
          </span>
        </div>

        <div className="relative mt-4 pl-4 sm:pl-5">
          <span
            className="absolute left-0 top-0 h-full w-0.5 rounded-full bg-gradient-to-b from-hwi via-hwi/40 to-transparent"
            aria-hidden="true"
          />
          <p
            id={promptId}
            className="max-w-3xl text-balance font-display text-lg font-medium italic leading-relaxed text-white/95 sm:text-xl lg:text-[1.45rem]"
          >
            “{riddle.prompt}”
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7">
          <label
            htmlFor={inputId}
            className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/70"
          >
            Your answer
          </label>
          <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
            <input
              ref={inputRef}
              id={inputId}
              data-testid="riddle-input"
              type="text"
              value={isLocked ? (answer?.submitted ?? value) : value}
              onChange={(event) => {
                if (isLocked) return
                setValue(event.target.value)
              }}
              disabled={isLocked}
              readOnly={isLocked}
              maxLength={80}
              autoComplete="off"
              spellCheck={false}
              placeholder="Type the single word or phrase…"
              aria-describedby={`${inputId}-hint${answer ? ` ${feedbackId}` : ''}`}
              className="field-input flex-1"
            />
            <Button
              type="submit"
              size="md"
              disabled={!canSubmit}
              className="shrink-0 sm:min-h-12"
            >
              <Send className="size-3.5" aria-hidden="true" />
              Submit Answer
            </Button>
          </div>
          <p
            id={`${inputId}-hint`}
            className="mt-2 text-[10px] leading-relaxed text-muted/45"
          >
            Spelling variants and common phrasing are accepted. You get one
            submission per riddle.
          </p>
        </form>

        <div aria-live="polite" className="mt-5">
          {answer && (
            <div
              id={feedbackId}
              className={cn(
                'feedback-in rounded-xl border px-4 py-3.5',
                answer.correct
                  ? 'border-emerald-500/30 bg-emerald-500/[0.07]'
                  : 'border-red-500/30 bg-red-500/[0.07]',
              )}
              data-testid="feedback"
            >
              <div className="flex items-start gap-3">
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
                      ? 'Locked in. You earned 1 point for this riddle.'
                      : 'Your answer has been locked. Review the accepted answer below.'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
                    <span className="text-muted/60">
                      Your answer:{' '}
                      <span className="font-medium text-white/80">
                        {answer.submitted}
                      </span>
                    </span>
                    <span className="text-muted/60">
                      Accepted answer:{' '}
                      <span className="font-semibold text-emerald-300">
                        {answer.correctAnswer}
                      </span>
                    </span>
                  </div>
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
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted/50">
            <Lock className="size-3 shrink-0" aria-hidden="true" />
            {answer
              ? 'Answer locked for this session'
              : 'Submit an answer to unlock the next riddle'}
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
