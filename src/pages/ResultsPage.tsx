import {
  ArrowDown,
  Award,
  CircleCheck,
  CircleX,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import { QUIZ_SECTIONS } from '../data/questions'
import type { QuizSession } from '../types/quiz'
import type { ScoreSummary } from '../types/quiz'
import { cn } from '../utils/cn'
import { getPerformanceLabel } from '../utils/scoring'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/Button'
import { ProgressBar } from '../components/ProgressBar'
import { ResultsBreakdown } from '../components/ResultsBreakdown'
import { ScoreRing } from '../components/ScoreRing'
import { SectionIcon } from '../components/SectionIcon'

interface ResultsPageProps {
  session: QuizSession
  score: ScoreSummary
  onRestart: () => void
}

const STAT_TONES = {
  green: 'border-emerald-500/15 bg-emerald-500/[0.04]',
  red: 'border-red-500/15 bg-red-500/[0.04]',
  red_brand: 'border-hwi/20 bg-hwi/[0.04]',
  neutral: 'border-white/[0.08] bg-white/[0.02]',
} as const

export function ResultsPage({ session, score, onRestart }: ResultsPageProps) {
  const performanceLabel = getPerformanceLabel(score.percentage)
  const perfectSections = QUIZ_SECTIONS.filter((meta) => {
    const section = score.sections[meta.id]
    return section.score === section.total
  }).length

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo size="sm" className="ring-1 ring-hwi/30" />
          <div className="min-w-0">
            <p className="truncate font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
              Hack With India <span className="text-hwi">/</span> SAIU
            </p>
            <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.28em] text-muted/50">
              Final report
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-1.5">
          <CircleCheck
            className="size-3 text-emerald-400"
            aria-hidden="true"
          />
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            Session complete
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-14 pt-7 sm:px-6 sm:pt-9">
        <section
          className="surface animate-fade-up relative overflow-hidden"
          aria-labelledby="results-title"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,0,85,0.14),transparent_55%)]"
            aria-hidden="true"
          />
          <div className="h-1 w-full bg-gradient-to-r from-hwi via-hwi/45 to-transparent" />

          <div className="relative grid items-center gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_auto] lg:gap-12 lg:p-10">
            <div>
              <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.28em] text-hwi">
                <Trophy className="size-3.5" aria-hidden="true" />
                Final results
              </p>
              <h1
                id="results-title"
                className="mt-3 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl"
              >
                {session.profile.teamName}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted/70">
                Fourteen questions. Three sections. Every answer sealed. Here is
                how the session finished.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-full border border-hwi/25 bg-hwi/[0.07] px-3.5 py-2">
                  <Sparkles className="size-3.5 text-hwi" aria-hidden="true" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-hwi">
                    {performanceLabel}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted/50">
                  <Users className="size-3.5 text-muted/40" aria-hidden="true" />
                  14 questions · 3 sections
                </span>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#breakdown"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-hwi/45 hover:bg-hwi/[0.06] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hwi"
                >
                  Review answers
                  <ArrowDown className="size-3" aria-hidden="true" />
                </a>
                <Button variant="outline" onClick={onRestart}>
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  New session
                </Button>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted/40">
                  {perfectSections} of 3 sections perfect
                </span>
              </div>
            </div>

            <div className="relative">
              <div
                className="absolute inset-6 rounded-full bg-hwi/10 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:p-5">
                <ScoreRing
                  percentage={score.percentage}
                  correct={score.totalCorrect}
                  total={score.totalQuestions}
                />
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] px-2 pt-3">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted/50">
                    Maximum
                  </span>
                  <span className="font-display text-xs font-semibold tabular-nums text-white/75">
                    {score.totalQuestions} pts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
          aria-label="Score summary"
        >
          <div
            className={cn(
              'animate-fade-up rounded-xl border px-4 py-3.5',
              STAT_TONES.green,
            )}
            style={{ animationDelay: '60ms' }}
          >
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CircleCheck className="size-3" aria-hidden="true" />
              <p className="text-[8px] font-bold uppercase tracking-[0.18em]">
                Correct
              </p>
            </div>
            <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-white">
              {score.totalCorrect}
            </p>
          </div>
          <div
            className={cn(
              'animate-fade-up rounded-xl border px-4 py-3.5',
              STAT_TONES.red,
            )}
            style={{ animationDelay: '90ms' }}
          >
            <div className="flex items-center gap-1.5 text-red-400">
              <CircleX className="size-3" aria-hidden="true" />
              <p className="text-[8px] font-bold uppercase tracking-[0.18em]">
                Incorrect
              </p>
            </div>
            <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-white">
              {score.totalIncorrect}
            </p>
          </div>
          <div
            className={cn(
              'animate-fade-up rounded-xl border px-4 py-3.5',
              STAT_TONES.red_brand,
            )}
            style={{ animationDelay: '120ms' }}
          >
            <div className="flex items-center gap-1.5 text-hwi">
              <Target className="size-3" aria-hidden="true" />
              <p className="text-[8px] font-bold uppercase tracking-[0.18em]">
                Accuracy
              </p>
            </div>
            <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-white">
              {score.percentage}
              <span className="text-sm text-muted/50">%</span>
            </p>
          </div>
          <div
            className={cn(
              'animate-fade-up rounded-xl border px-4 py-3.5',
              STAT_TONES.neutral,
            )}
            style={{ animationDelay: '150ms' }}
          >
            <div className="flex items-center gap-1.5 text-muted/60">
              <Award className="size-3" aria-hidden="true" />
              <p className="text-[8px] font-bold uppercase tracking-[0.18em]">
                Out of
              </p>
            </div>
            <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-white">
              {score.totalQuestions}
            </p>
          </div>
        </section>

        <section className="mt-9" aria-labelledby="section-scores-heading">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-hwi">
                Round by round
              </p>
              <h2
                id="section-scores-heading"
                className="mt-1.5 font-display text-xl font-bold tracking-tight text-white sm:text-2xl"
              >
                Section performance
              </h2>
            </div>
            <p className="pb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted/40">
              14 points available
            </p>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {QUIZ_SECTIONS.map((meta) => {
              const section = score.sections[meta.id]
              const isPerfect = section.score === section.total
              const percentage = Math.round(
                (section.score / Math.max(section.total, 1)) * 100,
              )

              return (
                <article
                  key={meta.id}
                  className="surface p-4"
                  aria-label={`${meta.name}: ${section.score} out of ${section.total}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg border border-hwi/20 bg-hwi/[0.06] text-hwi">
                        <SectionIcon section={meta.id} />
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted/55">
                        {meta.eyebrow}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em]',
                        isPerfect
                          ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400'
                          : 'border-white/[0.08] bg-white/[0.02] text-muted/50',
                      )}
                    >
                      {isPerfect ? 'Perfect' : `${percentage}%`}
                    </span>
                  </div>

                  <h3 className="mt-3 text-[12px] font-semibold leading-snug text-white/90">
                    {meta.name}
                  </h3>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
                    {section.score}
                    <span className="text-sm font-medium text-muted/45">
                      /{section.total}
                    </span>
                  </p>
                  <ProgressBar
                    value={section.score}
                    max={section.total}
                    label={`${meta.name} score`}
                    tone={isPerfect ? 'green' : 'red'}
                    className="mt-3 h-1"
                  />
                </article>
              )
            })}
          </div>
        </section>

        <div className="mt-9">
          <ResultsBreakdown session={session} />
        </div>

        <section className="surface mt-9 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-hwi">
              Run it back
            </p>
            <h2 className="mt-1.5 font-display text-xl font-bold text-white">
              New session. New draw.
            </h2>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted/60">
              Restarting clears every answer and score, returns to check-in, and
              draws a fresh set of questions for the next session.
            </p>
          </div>
          <Button onClick={onRestart} size="lg" className="w-full shrink-0 sm:w-auto">
            <RotateCcw className="size-4" aria-hidden="true" />
            Restart Quiz
          </Button>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted/35">
            Hack With India — SAIU · Access Denied Quiz
          </p>
          <p className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-muted/35">
            <span className="size-1.5 rounded-full bg-hwi" aria-hidden="true" />
            Session archived
          </p>
        </div>
      </footer>
    </div>
  )
}
