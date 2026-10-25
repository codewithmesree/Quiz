import { useEffect } from 'react'
import { AppBackdrop } from './components/AppBackdrop'
import { useQuiz } from './hooks/useQuiz'
import { QuizPage } from './pages/QuizPage'
import { ResultsPage } from './pages/ResultsPage'
import { WelcomePage } from './pages/WelcomePage'

function App() {
  const quiz = useQuiz()

  // Start every new screen/question at the top of the viewport.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [quiz.phase, quiz.currentQuestion?.id, quiz.sectionBreak])

  return (
    <div className="relative min-h-dvh">
      <AppBackdrop />
      {quiz.phase === 'welcome' && <WelcomePage onStart={quiz.startQuiz} />}
      {quiz.phase === 'quiz' && <QuizPage quiz={quiz} />}
      {quiz.phase === 'results' && quiz.session && (
        <ResultsPage
          session={quiz.session}
          score={quiz.score}
          onRestart={quiz.restart}
        />
      )}
    </div>
  )
}

export default App
