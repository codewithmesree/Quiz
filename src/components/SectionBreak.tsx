import { ArrowRight, Check, Lock, Sparkles } from 'lucide-react'
import { SECTION_BY_ID } from '../data/questions'
import type { ScoreSummary, SectionId } from '../types/quiz'
import { Button } from './Button'
import { ProgressBar } from './ProgressBar'
import { SectionIcon } from './SectionIcon'

interface SectionBreakProps {
  completedSection: SectionId
  score: ScoreSummary
  onContinue: () => void
}

export function SectionBreak({
  completedSection,
  score,
  onContinue,
}: SectionBreakProps) {
  const completedMeta = SECTION_BY_ID[completedSection]
  const nextSection = (completedSection + 1) as SectionId
  const nextMeta = SECTION_BY_ID[nextSection]
  const sectionScore = score.sections[completedSection]

  return (
    <div
      className="mx-auto max-w-2xl animate-fade-up"
      data-testid="section-break"
    >
      <section className="surface relative overflow-hidden p-6 text-center sm:p-9">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(255,0,85,0.16),transparent_70%)]"
          aria-hidden="true"
        />

        <div className="relative">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-hwi/30 bg-hwi/10 shadow-[0_0_40px_-10px_rgba(255,0,85,0.5)]">
            <Check className="size-7 text-hwi" strokeWidth={2.5} aria-hidden="true" />
          </span>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-hwi">
            {completedMeta.eyebrow} cleared
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {completedMeta.name} complete
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted/70">
            Answers for this section are now sealed. Take a breath, then move
            into the next round.
          </p>

          <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-left">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted/50">
                Section score
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
                {sectionScore.score}
                <span className="text-sm font-medium text-muted/50">
                  /{sectionScore.total}
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-left">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted/50">
                Overall
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
                {score.totalCorrect}
                <span className="text-sm font-medium text-muted/50">
                  /{score.totalQuestions}
                </span>
              </p>
            </div>
          </div>

          <div className="mx-auto mt-5 max-w-sm">
            <ProgressBar
              value={score.totalAnswered}
              max={score.totalQuestions}
              label="Quiz progress"
            />
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted/45">
              {score.totalAnswered} of {score.totalQuestions} questions answered
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-hwi/20 bg-hwi/[0.04] p-4 text-left">
            <div className="flex items-center gap-2">
              <SectionIcon section={nextSection} className="size-4 text-hwi" />
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-hwi">
                Up next · {nextMeta.eyebrow}
              </p>
            </div>
            <h2 className="mt-2 font-display text-lg font-semibold text-white">
              {nextMeta.name}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted/65">
              {nextMeta.description}
            </p>
            <div className="mt-3 flex items-center gap-4 text-[10px] font-medium uppercase tracking-[0.14em] text-muted/55">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3 text-hwi" aria-hidden="true" />
                {nextMeta.count} {nextMeta.type === 'riddle' ? 'riddles' : 'questions'}
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="size-3 text-hwi" aria-hidden="true" />
                Locked answers
              </span>
            </div>
            <Button onClick={onContinue} size="lg" className="mt-5 w-full">
              Enter {nextMeta.eyebrow}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
