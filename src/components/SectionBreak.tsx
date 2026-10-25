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
  const isFinalSection = completedSection === 3
  const nextMeta = isFinalSection
    ? null
    : SECTION_BY_ID[(completedSection + 1) as SectionId]
  const sectionScore = score.sections[completedSection]
  const encouragement: Record<SectionId, string> = {
    1: 'Way to go! Keep it up!',
    2: "Great job! You're almost there!",
    3: "Congratulations! You've completed the quiz!",
  }

  return (
    <div className="mx-auto max-w-2xl" data-testid="section-break">
      <section className="surface overflow-hidden p-6 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full border border-hwi/30 bg-hwi/10">
            <Check className="size-6 text-hwi" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-hwi">
            {completedMeta.eyebrow} {isFinalSection ? 'complete' : 'cleared'}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {isFinalSection ? 'Quiz complete' : `${completedMeta.name} complete`}
          </h1>
          <blockquote className="mt-4 rounded-lg border-l-2 border-hwi bg-hwi/[0.05] px-4 py-3 text-sm font-medium text-white/90">
            “{encouragement[completedSection]}”
          </blockquote>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted/70">
            {isFinalSection
              ? 'Your answers are sealed. Continue to review your final results.'
              : 'Answers for this section are now sealed. Continue when you are ready for the next round.'}
          </p>

          <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
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

          <div className="mt-5 w-full max-w-sm">
            <ProgressBar
              value={score.totalAnswered}
              max={score.totalQuestions}
              label="Quiz progress"
            />
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted/45">
              {score.totalAnswered} of {score.totalQuestions} questions answered
            </p>
          </div>

          {nextMeta && (
            <div className="mt-7 w-full max-w-md rounded-xl border border-hwi/20 bg-hwi/[0.04] p-4 text-left">
              <div className="flex items-center gap-2">
                <SectionIcon section={nextMeta.id} className="size-4 text-hwi" />
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
            </div>
          )}

          <Button onClick={onContinue} size="lg" className="mt-6 w-full max-w-md">
            Continue
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </section>
    </div>
  )
}
