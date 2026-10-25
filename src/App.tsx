import { useEffect, useState } from 'react'
import { AppBackdrop } from './components/AppBackdrop'
import { useQuiz } from './hooks/useQuiz'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { QuizPage } from './pages/QuizPage'
import { ResultsPage } from './pages/ResultsPage'
import { WelcomePage } from './pages/WelcomePage'
import { submitCompletedScore } from './utils/leaderboard'

function App() {
  const quiz = useQuiz()
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    if (quiz.phase === 'results' && quiz.session) {
      submitCompletedScore(quiz.session)
    }
  }, [quiz.phase, quiz.session])

  // Start every new screen/question at the top of the viewport.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [quiz.phase, quiz.currentQuestion?.id, quiz.sectionBreak, showLeaderboard])

  return (
    <div className="relative min-h-dvh">
      <AppBackdrop />
      {quiz.phase === 'welcome' && <WelcomePage onStart={quiz.startQuiz} />}
      {quiz.phase === 'quiz' && <QuizPage quiz={quiz} />}
      {quiz.phase === 'results' && quiz.session && (
        showLeaderboard ? (
          <LeaderboardPage onBack={() => setShowLeaderboard(false)} />
        ) : (
          <ResultsPage
            session={quiz.session}
            score={quiz.score}
            onShowLeaderboard={() => setShowLeaderboard(true)}
          />
        )
      )}
    </div>
  )
}

export default App
