import { AlertTriangle, ArrowRight, Check, Code2, Lock, RefreshCw, Sparkles } from 'lucide-react'
import { SECTION_BY_ID } from '../data/questions'
import type { ScoreSummary, SectionId } from '../types/quiz'
import type { StageResultMap } from '../utils/progressionEngine'
import { sectionToStageId } from '../config/progressionConfig'
import { Button } from './Button'
import { ProgressBar } from './ProgressBar'
import { SectionIcon } from './SectionIcon'

interface SectionBreakProps {
  completedSection: SectionId
  score: ScoreSummary
  stageResults: StageResultMap
  onContinue: () => void
  onRetry: () => void
}

export function SectionBreak({
  completedSection,
  score,
  stageResults,
  onContinue,
  onRetry,
}: SectionBreakProps) {
  const completedMeta = SECTION_BY_ID[completedSection]
  const isFinalSection = completedSection === 3
  const nextMeta = isFinalSection
    ? null
    : SECTION_BY_ID[(completedSection + 1) as SectionId]
  const sectionScore = score.sections[completedSection]

  // Authoritative pass/fail from the progression engine
  const stageId = sectionToStageId(completedSection)
  const stageResult = stageResults[stageId]
  const passed = Boolean(stageResult?.passed)
  const threshold = stageResult?.total !== undefined ? (
    // Look up threshold from config
    completedSection === 3 ? 4 : 3
  ) : 3
  const attempts = stageResult?.attempts ?? 1

  const encouragement: Record<SectionId, string> = {
    1: 'Way to go! Keep it up!',
    2: "Great job! You're almost there!",
    3: "Congratulations! You've completed all the quiz rounds!",
  }

  // ── FAILURE SCREEN ──────────────────────────────────────────────────────
  if (!passed) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-up" data-testid="section-failed">
        <section className="surface overflow-hidden p-6 sm:p-9">
          <div className="flex flex-col items-center text-center">
            {/* Failure icon */}
            <span className="flex size-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
              <AlertTriangle className="size-6 text-red-400" strokeWidth={2} aria-hidden="true" />
            </span>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-red-400">
              {completedMeta.eyebrow} — Not passed
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Not quite there yet
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted/70">
              You scored <span className="font-semibold text-white">{sectionScore.score}/{sectionScore.total}</span> correct.
              You need at least <span className="font-semibold text-hwi">{threshold}</span> correct answers to proceed.
              Don't worry — you can retry this section now.
            </p>

            {/* Score vs threshold */}
            <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-left">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-red-400/70">
                  Your score
                </p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
                  {sectionScore.score}
                  <span className="text-sm font-medium text-muted/50">
                    /{sectionScore.total}
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-hwi/20 bg-hwi/[0.04] px-4 py-3 text-left">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-hwi/70">
                  Required to pass
                </p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
                  {threshold}
                  <span className="text-sm font-medium text-muted/50">
                    /{sectionScore.total}
                  </span>
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5 w-full max-w-sm">
              <ProgressBar
                value={sectionScore.score}
                max={sectionScore.total}
                label={`${completedMeta.name} score`}
                tone="red"
                className="mt-3 h-1.5"
              />
            </div>

            {attempts > 1 && (
              <p className="mt-3 text-[9px] font-medium uppercase tracking-[0.16em] text-muted/40">
                Attempt #{attempts} — Questions reshuffled
              </p>
            )}

            <div className="mt-4 w-full max-w-md rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-400">
                Retry rules
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted/65">
                A new set of questions from the same pool will be presented. Your progress in other
                completed sections is preserved. Keep going — no penalties apply.
              </p>
            </div>

            <Button
              onClick={onRetry}
              size="lg"
              className="mt-6 w-full max-w-md gap-2 bg-hwi/90 shadow-[0_0_24px_rgba(255,0,85,0.35)] hover:bg-hwi"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Retry {completedMeta.shortName}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </div>
    )
  }

  // ── PASS SCREEN ─────────────────────────────────────────────────────────
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
            "{encouragement[completedSection]}"
          </blockquote>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted/70">
            {isFinalSection
              ? 'Quiz rounds complete! Continue to review your quiz score and proceed to the coding rounds.'
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

          {isFinalSection ? (
            <div className="mt-7 w-full max-w-md rounded-xl border border-hwi/25 bg-hwi/[0.05] p-4 text-left">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-hwi" />
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-hwi">
                  Up next · Python Code Lab
                </p>
              </div>
              <h2 className="mt-2 font-display text-lg font-semibold text-white">
                Python Coding Challenge
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted/65">
                3 progressive algorithmic challenges in the in-browser Python IDE.
              </p>
              <div className="mt-3 flex items-center gap-4 text-[10px] font-medium uppercase tracking-[0.14em] text-muted/55">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3 text-hwi" aria-hidden="true" />
                  3 stages
                </span>
                <span className="flex items-center gap-1.5">
                  <Code2 className="size-3 text-hwi" aria-hidden="true" />
                  Python IDE
                </span>
              </div>
            </div>
          ) : (
            nextMeta && (
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
            )
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
