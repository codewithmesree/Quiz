import {
  Check,
  CircleDot,
  Lock,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react'
import { QUIZ_SECTIONS } from '../data/questions'
import type { QuizSession, ScoreSummary, SectionId } from '../types/quiz'
import { cn } from '../utils/cn'
import { getSectionQuestions } from '../utils/session'
import { ProgressBar } from './ProgressBar'

interface SessionSidebarProps {
  session: QuizSession
  score: ScoreSummary
  currentSection: SectionId
  currentIndex: number
  sectionBreak: SectionId | null
}

export function SessionSidebar({
  session,
  score,
  currentSection,
  currentIndex,
  sectionBreak,
}: SessionSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-32" aria-label="Session progress">
      <section className="surface p-5" aria-labelledby="live-score-heading">
        <div className="flex items-center justify-between">
          <h2
            id="live-score-heading"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted/70"
          >
            Live score
          </h2>
          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-hwi">
            <span className="live-dot" aria-hidden="true" />
            Live
          </span>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <span className="font-display text-5xl font-bold leading-none tabular-nums text-white">
            {score.totalCorrect}
          </span>
          <span className="pb-1 font-display text-lg font-medium text-muted/60">
            / {score.totalQuestions}
          </span>
          <span className="mb-1.5 ml-auto rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
            pts
          </span>
        </div>

        <ProgressBar
          value={score.totalAnswered}
          max={score.totalQuestions}
          label="Overall quiz progress"
          className="mt-4"
        />

        <div className="mt-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-muted/60">
          <span>
            Answered <span className="text-white/90">{score.totalAnswered}</span>
          </span>
          <span>{score.percentage}%</span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4">
          <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.05] px-3 py-2">
            <dt className="text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-400/80">
              Correct
            </dt>
            <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-emerald-300">
              {score.totalCorrect}
            </dd>
          </div>
          <div className="rounded-lg border border-red-500/15 bg-red-500/[0.05] px-3 py-2">
            <dt className="text-[9px] font-semibold uppercase tracking-[0.16em] text-red-400/80">
              Missed
            </dt>
            <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-red-300">
              {score.totalIncorrect}
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="surface p-5"
        aria-labelledby="section-progress-heading"
      >
        <h2
          id="section-progress-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted/70"
        >
          Sections
        </h2>
        <ol className="mt-3 space-y-2.5">
          {QUIZ_SECTIONS.map((meta) => {
            const questions = getSectionQuestions(session, meta.id)
            const answered = questions.filter((question) =>
              Boolean(session.answers[question.id]),
            ).length
            const correct = questions.filter(
              (question) => session.answers[question.id]?.correct,
            ).length
            const complete = answered === questions.length
            const active =
              currentSection === meta.id &&
              sectionBreak !== meta.id &&
              !complete
            const isUpcoming = !complete && !active

            return (
              <li
                key={meta.id}
                className={cn(
                  'rounded-xl border px-3 py-2.5 transition-colors',
                  active
                    ? 'border-hwi/35 bg-hwi/[0.06]'
                    : 'border-white/[0.06] bg-black/20',
                  isUpcoming && 'opacity-70',
                )}
                aria-current={active ? 'step' : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                      complete
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                        : active
                          ? 'border-hwi/50 bg-hwi/15 text-hwi'
                          : 'border-white/10 bg-white/[0.03] text-muted/50',
                    )}
                    aria-hidden="true"
                  >
                    {complete ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : active ? (
                      <CircleDot className="size-3" />
                    ) : (
                      <Lock className="size-2.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-[11px] font-semibold tracking-wide',
                        active || complete ? 'text-white' : 'text-muted/70',
                      )}
                    >
                      {meta.shortName}
                    </p>
                    <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-muted/50">
                      {complete
                        ? `${correct} / ${questions.length} correct`
                        : active
                          ? `Question ${Math.min(currentIndex + 1, questions.length)} of ${questions.length}`
                          : `${questions.length} questions`}
                    </p>
                  </div>
                  {complete && (
                    <span className="font-display text-xs font-semibold tabular-nums text-emerald-400">
                      {correct}/{questions.length}
                    </span>
                  )}
                </div>
                {active && (
                  <ProgressBar
                    value={answered}
                    max={questions.length}
                    label={`${meta.name} progress`}
                    className="mt-2 h-1"
                  />
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <section className="surface p-5" aria-labelledby="team-heading">
        <div className="flex items-center gap-2">
          <Users className="size-3.5 text-hwi" aria-hidden="true" />
          <h2
            id="team-heading"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted/70"
          >
            Team
          </h2>
        </div>
        <p className="mt-3 truncate font-display text-sm font-semibold text-white">
          {session.profile.teamName}
        </p>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5">
          <ShieldCheck
            className="mt-0.5 size-3.5 shrink-0 text-hwi"
            aria-hidden="true"
          />
          <p className="text-[10px] leading-relaxed text-muted/60">
            Answers lock on submission and cannot be changed.
          </p>
        </div>
      </section>

      <div className="hidden items-center justify-center gap-2 text-[9px] font-medium uppercase tracking-[0.2em] text-muted/30 lg:flex">
        <Trophy className="size-3" aria-hidden="true" />
        Hack With India — SAIU
      </div>
    </aside>
  )
}
