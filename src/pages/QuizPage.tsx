import { useCallback, useState } from 'react'
import { SECTION_BY_ID } from '../data/questions'
import type { UseQuizResult } from '../hooks/useQuiz'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { MCQCard } from '../components/MCQCard'
import { QuizHeader } from '../components/QuizHeader'
import { RiddleCard } from '../components/RiddleCard'
import { SectionBreak } from '../components/SectionBreak'
import { SessionSidebar } from '../components/SessionSidebar'

interface QuizPageProps {
  quiz: UseQuizResult
}

export function QuizPage({ quiz }: QuizPageProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const closeResetConfirm = useCallback(() => setShowResetConfirm(false), [])
  const {
    session,
    currentSection,
    currentIndex,
    currentQuestion,
    currentAnswer,
    sectionBreak,
    score,
    nextLabel,
    selectOption,
    submitRiddle,
    advance,
    enterNextSection,
  } = quiz

  if (!session) return null

  const sectionMeta = SECTION_BY_ID[currentSection]
  const totalInSection =
    currentSection === 1 ? session.section1.length : currentSection === 2 ? session.section2.length : session.section3.length

  return (
    <div className="relative z-10 min-h-dvh">
      <QuizHeader
        teamName={session.profile.teamName}
        score={score}
        onReset={() => setShowResetConfirm(true)}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        {sectionBreak ? (
          <SectionBreak
            completedSection={sectionBreak}
            score={score}
            onContinue={enterNextSection}
          />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_296px] lg:gap-7">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-hwi">
                    Round {String(currentSection).padStart(2, '0')} of 03
                  </p>
                  <p className="mt-1 font-display text-sm font-semibold text-white/80">
                    {sectionMeta.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted/50">
                    Question {currentIndex + 1} of {totalInSection}
                  </p>
                  <p className="mt-1 font-display text-[11px] font-medium tabular-nums text-muted/45">
                    {score.totalAnswered} / {score.totalQuestions} answered
                  </p>
                </div>
              </div>

              {currentQuestion && currentQuestion.section === 3 ? (
                <RiddleCard
                  key={currentQuestion.id}
                  riddle={currentQuestion}
                  answer={currentAnswer}
                  section={sectionMeta}
                  index={currentIndex}
                  total={totalInSection}
                  nextLabel={nextLabel}
                  onSubmit={submitRiddle}
                  onAdvance={advance}
                />
              ) : (
                currentQuestion && (
                  <MCQCard
                    key={currentQuestion.id}
                    question={currentQuestion}
                    answer={currentAnswer}
                    section={sectionMeta}
                    index={currentIndex}
                    total={totalInSection}
                    nextLabel={nextLabel}
                    onSelect={selectOption}
                    onAdvance={advance}
                  />
                )
              )}

              <p className="mt-5 px-1 text-center text-[9px] font-medium uppercase tracking-[0.18em] text-muted/30 lg:text-left">
                Answers are final. There is no backward navigation.
              </p>
            </div>

            <SessionSidebar
              session={session}
              score={score}
              currentSection={currentSection}
              currentIndex={currentIndex}
              sectionBreak={sectionBreak}
            />
          </div>
        )}
      </main>

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset this quiz?"
        description="Every answer, point, and question drawn in this session will be cleared. This cannot be undone."
        confirmLabel="Reset quiz"
        onConfirm={() => {
          setShowResetConfirm(false)
          quiz.restart()
        }}
        onCancel={closeResetConfirm}
      />
    </div>
  )
}
