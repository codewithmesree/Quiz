import { CircleCheck, CircleX, Minus } from 'lucide-react'
import { QUIZ_SECTIONS } from '../data/questions'
import type { AnswerRecord, QuizSession } from '../types/quiz'
import { cn } from '../utils/cn'
import { getSectionQuestions } from '../utils/session'
import { SectionIcon } from './SectionIcon'

interface ResultsBreakdownProps {
  session: QuizSession
}

function answerLabel(record: AnswerRecord | undefined): string {
  if (!record) return 'Not answered'
  return record.optionId
    ? `${record.optionId} — ${record.submitted}`
    : record.submitted
}

export function ResultsBreakdown({ session }: ResultsBreakdownProps) {
  return (
    <section id="breakdown" aria-labelledby="breakdown-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-hwi">
            Full transcript
          </p>
          <h2
            id="breakdown-heading"
            className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            Answer breakdown
          </h2>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-semibold uppercase tracking-[0.14em]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            Correct
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <CircleX className="size-3.5" aria-hidden="true" />
            Incorrect
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-7" data-testid="results-breakdown">
        {QUIZ_SECTIONS.map((meta) => {
          const questions = getSectionQuestions(session, meta.id)
          const correct = questions.filter(
            (question) => session.answers[question.id]?.correct,
          ).length

          return (
            <div key={meta.id}>
              <div className="mb-2.5 flex items-center gap-3 px-1">
                <span className="flex size-7 items-center justify-center rounded-lg border border-hwi/20 bg-hwi/[0.06] text-hwi">
                  <SectionIcon section={meta.id} />
                </span>
                <h3 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-white/80">
                  {meta.eyebrow} · {meta.name}
                </h3>
                <span className="ml-auto font-display text-[11px] font-semibold tabular-nums text-muted/60">
                  {correct} / {questions.length}
                </span>
              </div>

              <ol className="space-y-2">
                {questions.map((question, index) => {
                  const answer = session.answers[question.id]
                  const isCorrect = Boolean(answer?.correct)
                  const correctOption =
                    question.section !== 3
                      ? question.options.find(
                          (option) => option.id === question.correctOptionId,
                        )
                      : undefined

                  return (
                    <li
                      key={question.id}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.015] px-3.5 py-3.5 sm:px-4"
                      data-testid="answer-row"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-black/25 font-display text-[9px] font-bold tabular-nums text-muted/55"
                          aria-hidden="true"
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium leading-relaxed text-white/85 sm:text-[13px]">
                            {question.prompt}
                          </p>

                          <dl className="mt-2.5 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                            <div className="flex min-w-0 items-baseline gap-2 text-[10px]">
                              <dt className="shrink-0 font-semibold uppercase tracking-[0.12em] text-muted/45">
                                Your answer
                              </dt>
                              <dd
                                className={cn(
                                  'truncate font-medium',
                                  isCorrect ? 'text-emerald-300' : 'text-red-300',
                                )}
                                title={answerLabel(answer)}
                              >
                                {answerLabel(answer)}
                              </dd>
                            </div>
                            <div className="flex min-w-0 items-baseline gap-2 text-[10px]">
                              <dt className="shrink-0 font-semibold uppercase tracking-[0.12em] text-muted/45">
                                Correct
                              </dt>
                              <dd
                                className="truncate font-medium text-emerald-300"
                                title={
                                  answer?.correctAnswer ??
                                  correctOption?.text ??
                                  'Not available'
                                }
                              >
                                {answer?.correctAnswer ??
                                  correctOption?.text ??
                                  'Not available'}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        <span
                          className={cn(
                            'flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em]',
                            isCorrect
                              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                              : 'border-red-500/25 bg-red-500/10 text-red-400',
                          )}
                        >
                          {isCorrect ? (
                            <CircleCheck
                              className="size-3"
                              aria-hidden="true"
                            />
                          ) : answer ? (
                            <CircleX className="size-3" aria-hidden="true" />
                          ) : (
                            <Minus className="size-3" aria-hidden="true" />
                          )}
                          <span className="hidden sm:inline">
                            {isCorrect
                              ? 'Correct'
                              : answer
                                ? 'Incorrect'
                                : 'Unanswered'}
                          </span>
                          <span className="sr-only sm:hidden">
                            {isCorrect
                              ? 'Correct'
                              : answer
                                ? 'Incorrect'
                                : 'Unanswered'}
                          </span>
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          )
        })}
      </div>
    </section>
  )
}
