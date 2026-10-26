import { useCallback, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { AppBackdrop } from './components/AppBackdrop'
import { AnnouncementBanner } from './components/AnnouncementBanner'
import { PhaseLockScreen } from './components/PhaseLockScreen'
import { useGameMaster } from './hooks/useGameMaster'
import { useGMSync } from './hooks/useGMSync'
import { useQuiz } from './hooks/useQuiz'
import { AdminPage } from './pages/AdminPage'
import { CodingChallengePage } from './pages/CodingChallengePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { LobbyPage } from './pages/LobbyPage'
import { QuizPage } from './pages/QuizPage'
import { ResultsPage } from './pages/ResultsPage'
import { WelcomePage } from './pages/WelcomePage'
import { getFirebaseAuth } from './services/firebase'
import { submitCompletedScore } from './utils/leaderboard'
import {
  getUnlockedCodingStages,
  isGameComplete,
  type CodingStagePassMap,
} from './utils/progressionEngine'

// --- Routing helpers --------------------------------------------------------

function getAdminMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hash === '#admin' ||
    new URLSearchParams(window.location.search).get('admin') === 'true'
  )
}

// Map quiz sections to required GM phases
const SECTION_TO_PHASE = {
  1: 'round-1',
  2: 'round-2',
  3: 'round-3',
} as const

// ---------------------------------------------------------------------------

function App() {
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(getAdminMode)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)

  /**
   * Track which coding stages the team has PASSED (not just completed in the editor).
   * This comes from CodingChallengePage via onStagePassed callback.
   */
  const [codingPassMap, setCodingPassMap] = useState<CodingStagePassMap>({})

  // Legacy count for backward-compat with GM sync
  const codingStagesCompleted = Object.values(codingPassMap).filter(Boolean).length

  const quiz = useQuiz(codingStagesCompleted)
  const gm = useGameMaster()

  const [showCodingChallenge, setShowCodingChallenge] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash === '#coding'
    }
    return false
  })

  // Track Firebase auth state for the lifetime of the app
  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) return
    const unsub = onAuthStateChanged(auth, (user) => setFirebaseUser(user))
    return unsub
  }, [])

  // Derived label shown in the header (display name > email > nothing)
  const signedInAs = firebaseUser?.displayName ?? firebaseUser?.email ?? null

  const handleSignOut = useCallback(async () => {
    const auth = getFirebaseAuth()
    if (auth) {
      try { await signOut(auth) } catch { /* ignore */ }
    }
    setFirebaseUser(null)
    quiz.exitToHome()
  }, [quiz])

  // Sync quiz scores → GM leaderboard in real-time
  useGMSync({ session: quiz.session, codingStagesCompleted })

  // Hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      setShowCodingChallenge(hash === '#coding')
      setIsAdminMode(hash === '#admin')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // ── Progression engine: derive unlocked coding stages from quiz results ──
  const unlockedCodingStages = useMemo(
    () => getUnlockedCodingStages(quiz.stageResults, codingPassMap),
    [quiz.stageResults, codingPassMap],
  )

  const gameIsComplete = useMemo(
    () => isGameComplete(codingPassMap),
    [codingPassMap],
  )

  // ── Coding challenge navigation ──────────────────────────────────────────
  const openCodingChallenge = useCallback(() => {
    // Only open if at least code-1 is unlocked (team passed quiz section 1)
    if (unlockedCodingStages.length === 0) return
    setShowCodingChallenge(true)
    if (typeof window !== 'undefined') {
      window.location.hash = 'coding'
    }
  }, [unlockedCodingStages])

  const closeCodingChallenge = useCallback(() => {
    setShowCodingChallenge(false)
    if (typeof window !== 'undefined' && window.location.hash === '#coding') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  const closeAdmin = useCallback(() => {
    setIsAdminMode(false)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  // Submit to leaderboard on completion
  useEffect(() => {
    if (quiz.phase === 'results' && quiz.session) {
      submitCompletedScore(quiz.session)
    }
  }, [quiz.phase, quiz.session])

  // Scroll to top on page transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [quiz.phase, quiz.currentQuestion?.id, quiz.sectionBreak, showLeaderboard, showCodingChallenge])

  // ── GM phase gating ───────────────────────────────────────────────────────
  const isGMActive = gm.isLive
  const gmPhase = gm.phase

  // Should player see the lobby?
  const showLobby = useMemo(() => {
    if (!isGMActive || !quiz.session) return false
    return gmPhase === 'lobby' && quiz.phase === 'quiz'
  }, [isGMActive, quiz.session, quiz.phase, gmPhase])

  // Is the current quiz section gated?
  const isCurrentSectionLocked = useMemo(() => {
    if (!isGMActive || quiz.phase !== 'quiz') return false
    const required = SECTION_TO_PHASE[quiz.currentSection]
    if (!required) return false
    const phaseOrder = ['lobby', 'round-1', 'round-2', 'round-3', 'coding', 'finale']
    return phaseOrder.indexOf(gmPhase) < phaseOrder.indexOf(required)
  }, [isGMActive, quiz.phase, quiz.currentSection, gmPhase])

  // Is the coding challenge gated by GM?
  const isCodingLockedByGM = useMemo(() => {
    if (!isGMActive) return false
    const phaseOrder = ['lobby', 'round-1', 'round-2', 'round-3', 'coding', 'finale']
    return phaseOrder.indexOf(gmPhase) < phaseOrder.indexOf('coding')
  }, [isGMActive, gmPhase])

  // Coding is locked if either GM hasn't opened it OR no coding stages are unlocked by progression
  const isCodingLocked = isCodingLockedByGM || unlockedCodingStages.length === 0

  // ── Admin panel ──────────────────────────────────────────────────────────
  if (isAdminMode) {
    return <AdminPage onExit={closeAdmin} />
  }

  // ── Coding challenge ──────────────────────────────────────────────────────
  if (showCodingChallenge) {
    if (isCodingLocked) {
      return (
        <>
          <AnnouncementBanner announcements={gm.announcements} />
          <PhaseLockScreen
            currentPhase={isCodingLockedByGM ? gmPhase : 'round-1'}
            requiredPhase="coding"
            teamName={quiz.session?.profile.teamName}
            onBackToHome={closeCodingChallenge}
            message={
              !isCodingLockedByGM && unlockedCodingStages.length === 0
                ? 'Complete Quiz Section 1 first to unlock the Python Code Lab.'
                : undefined
            }
          />
        </>
      )
    }
    return (
      <>
        <AnnouncementBanner announcements={gm.announcements} />
        <CodingChallengePage
          teamName={quiz.session?.profile.teamName}
          onBackToQuiz={closeCodingChallenge}
          onStagesCompletedChange={() => {
            // legacy count tracked via codingPassMap
          }}
          onStagePassed={(stageId) => {
            setCodingPassMap((prev) => ({ ...prev, [stageId]: true }))
          }}
          externalUnlockedStages={unlockedCodingStages}
        />
      </>
    )
  }

  // ── Lobby wait screen ──────────────────────────────────────────────────────
  if (showLobby && quiz.session) {
    return (
      <>
        <AnnouncementBanner announcements={gm.announcements} />
        <LobbyPage
          teamName={quiz.session.profile.teamName}
          sessionId={quiz.session.id}
          teams={gm.teams}
          onRegister={gm.registerTeam}
          onBackToHome={quiz.exitToHome}
        />
      </>
    )
  }

  return (
    <div className="relative min-h-dvh">
      <AppBackdrop />
      <AnnouncementBanner announcements={gm.announcements} />

      {quiz.phase === 'welcome' && (
        showLeaderboard ? (
          <LeaderboardPage onBack={() => setShowLeaderboard(false)} backLabel="Back to Home" />
        ) : (
          <WelcomePage
            onStart={quiz.startQuiz}
            onRestoreSession={quiz.restoreSession}
            onSignOut={() => void handleSignOut()}
            firebaseUser={firebaseUser}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
          />
        )
      )}

      {quiz.phase === 'quiz' && (
        isCurrentSectionLocked && isGMActive ? (
          <PhaseLockScreen
            currentPhase={gmPhase}
            requiredPhase={SECTION_TO_PHASE[quiz.currentSection]}
            teamName={quiz.session?.profile.teamName}
            onBackToHome={quiz.exitToHome}
          />
        ) : (
          <QuizPage
            quiz={quiz}
            onOpenCodingChallenge={
              unlockedCodingStages.length > 0 ? openCodingChallenge : undefined
            }
            signedInAs={signedInAs}
            onSignOut={() => void handleSignOut()}
          />
        )
      )}

      {quiz.phase === 'results' && quiz.session && (
        showLeaderboard ? (
          <LeaderboardPage onBack={() => setShowLeaderboard(false)} />
        ) : (
          <ResultsPage
            session={quiz.session}
            score={quiz.score}
            onShowLeaderboard={() => setShowLeaderboard(true)}
            onOpenCodingChallenge={
              unlockedCodingStages.length > 0 ? openCodingChallenge : undefined
            }
            onBackToHome={quiz.exitToHome}
            gameIsComplete={gameIsComplete}
          />
        )
      )}
    </div>
  )
}

export default App
