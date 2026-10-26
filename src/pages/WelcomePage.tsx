import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, LockKeyhole, LogOut, Trophy, Users } from 'lucide-react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { QUIZ_SECTIONS, TOTAL_QUESTIONS } from '../data/questions'
import type { PlayerProfile } from '../types/quiz'
import type { QuizState } from '../types/quiz'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/Button'
import { getFirebaseAuth } from '../services/firebase'
import {
  fetchAccountTeamProfile,
  fetchTeamProgressFromCloud,
  saveAccountTeamProfile,
} from '../services/firebaseSync'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WelcomePageProps {
  onStart: (profile: PlayerProfile) => void
  /** Called when a returning user's full quiz state is restored from the cloud. */
  onRestoreSession: (state: QuizState) => void
  onSignOut: () => void
  onOpenLeaderboard?: () => void
  /** Currently signed-in Firebase user, if any (passed down from App). */
  firebaseUser: User | null
}

type Stage = 'home' | 'auth' | 'rules'

// ---------------------------------------------------------------------------
// Helper — build a QuizState from a cloud progress record
// ---------------------------------------------------------------------------

function buildRestoredState(sessionData: string, record: {
  currentSection: number
  currentIndex: number
  sectionBreak: number | null
  phase: 'welcome' | 'quiz' | 'results'
}): QuizState | null {
  try {
    const session = JSON.parse(sessionData)
    if (!session || typeof session !== 'object') return null
    const section = record.currentSection as 1 | 2 | 3
    if (section !== 1 && section !== 2 && section !== 3) return null
    const phase = record.phase === 'results' ? 'results' : 'quiz'
    return {
      phase,
      session,
      currentSection: section,
      currentIndex: record.currentIndex,
      sectionBreak: record.sectionBreak as null | 1 | 2 | 3,
      stageResults: {},
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WelcomePage({
  onStart,
  onRestoreSession,
  onSignOut,
  onOpenLeaderboard,
  firebaseUser,
}: WelcomePageProps) {
  const [stage, setStage] = useState<Stage>('home')
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [profileSaveWarning, setProfileSaveWarning] = useState(false)
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  // Animated placeholder for the team-name input on the home screen
  useEffect(() => {
    const phrase = 'Type your team name here'
    let position = 0
    let deleting = false
    let timeout: ReturnType<typeof setTimeout>

    const animate = () => {
      if (!deleting) {
        position += 1
        setAnimatedPlaceholder(phrase.slice(0, position))
        if (position === phrase.length) {
          deleting = true
          timeout = setTimeout(animate, 1100)
          return
        }
      } else {
        position -= 1
        setAnimatedPlaceholder(phrase.slice(0, position))
        if (position === 0) deleting = false
      }
      timeout = setTimeout(animate, deleting ? 42 : 82)
    }

    timeout = setTimeout(animate, 450)
    return () => clearTimeout(timeout)
  }, [])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleTeamSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = teamName.trim()
    if (!trimmed) {
      setError('Enter your team name to continue.')
      formRef.current?.querySelector('input')?.focus()
      return
    }
    setError('')
    if (firebaseUser) {
      void handlePostSignIn(firebaseUser, trimmed)
      return
    }
    setAuthMode('signup')
    setStage('auth')
  }

  async function handleSignOut() {
    const auth = getFirebaseAuth()
    if (auth) {
      try {
        await signOut(auth)
      } catch {
        // ignore — still reset local state
      }
    }
    onSignOut()
    setStage('home')
    setTeamName('')
    setError('')
  }

  /**
   * After a successful sign-in:
   * — returning user (has hwi_accounts profile):
   *     → look up cloud progress
   *     → if found: restore full session directly (skip rules)
   *     → if not found: pre-fill team name and go to rules (no re-entry needed)
   * — new user (no profile yet): fall through to rules with the entered team name
   */
  async function handlePostSignIn(user: User, enteredTeamName: string): Promise<void> {
    // Always save/update the account profile with whatever team name we have
    const existingTeamName = await fetchAccountTeamProfile(user.uid)

    if (existingTeamName) {
      // Returning user — use their registered team name, ignore what they typed
      setTeamName(existingTeamName)
      const cloudRecord = await fetchTeamProgressFromCloud(existingTeamName)
      if (cloudRecord?.sessionData) {
        const restored = buildRestoredState(cloudRecord.sessionData, cloudRecord)
        if (restored) {
          onRestoreSession(restored)
          return
        }
      }
      // No cloud progress yet (or couldn't parse) — proceed to rules
      setProfileSaveWarning(false)
      setStage('rules')
    } else {
      // New user — save their chosen team name
      setProfileSaveWarning(!(await saveAccountTeamProfile(user, enteredTeamName)))
      setStage('rules')
    }
  }

  async function authenticate(method: 'email' | 'google') {
    // For Google sign-in, a team name is only required for brand-new accounts.
    // We don't enforce it here — handlePostSignIn decides which path to take.
    if (method !== 'google' && !teamName.trim()) {
      setError('Enter your team name before creating or logging into an account.')
      return
    }

    const auth = getFirebaseAuth()
    if (!auth) {
      setError('Account sign-in is unavailable. Check the Firebase configuration and try again.')
      return
    }

    setError('')
    setAuthBusy(true)
    try {
      if (method === 'google') {
        const result = await signInWithPopup(auth, new GoogleAuthProvider())
        await handlePostSignIn(result.user, teamName.trim())
      } else if (authMode === 'signup') {
        if (!teamName.trim()) {
          setError('Enter your team name before creating or logging into an account.')
          return
        }
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await handlePostSignIn(result.user, teamName.trim())
      } else {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password)
        await handlePostSignIn(result.user, teamName.trim())
      }
    } catch (cause) {
      const code = (cause as { code?: string }).code
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'An account already exists for this email. Try logging in.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Choose a password with at least 6 characters.',
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
        'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups and try again.',
        'auth/unauthorized-domain': 'This site domain is not authorized in Firebase Authentication settings.',
        'auth/operation-not-allowed': 'Google sign-in is not enabled for this Firebase project.',
        'auth/network-request-failed': 'Could not reach Firebase Authentication. Check your connection and try again.',
        'auth/cancelled-popup-request': 'Another sign-in window is already open. Finish or close it, then try again.',
        'auth/operation-not-supported-in-this-environment': 'Google pop-up sign-in is blocked in this browser. Try another browser or disable strict tracking protection for this site.',
      }
      console.error('Firebase authentication failed:', cause)
      setError(messages[code ?? ''] ?? `Sign-in failed${code ? ` (${code})` : ''}. Please try again.`)
    } finally {
      setAuthBusy(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Derived display values
  // ---------------------------------------------------------------------------

  const signedInLabel = firebaseUser?.displayName ?? firebaseUser?.email ?? null

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" />
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">Hack With India <span className="text-hwi">/</span> SAIU</p>
            <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.3em] text-muted/50">Official event quiz</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenLeaderboard && (
            <button type="button" onClick={onOpenLeaderboard} className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/70 transition hover:border-hwi/40 hover:text-white sm:flex">
              <Trophy className="size-3 text-hwi" />Leaderboard
            </button>
          )}
          {firebaseUser ? (
            /* Signed-in state */
            <div className="flex items-center gap-2">
              {signedInLabel && (
                <span className="hidden max-w-[180px] truncate text-[10px] font-medium text-white/50 sm:inline">
                  {signedInLabel}
                </span>
              )}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70 transition hover:border-hwi/40 hover:text-white"
                aria-label="Sign out"
              >
                <LogOut className="size-3" />
                Sign out
              </button>
            </div>
          ) : (
            /* Signed-out state */
            <>
              {stage !== 'auth' && (
                <button type="button" onClick={() => setStage('auth')} className="rounded-full border border-hwi/50 bg-hwi/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-hwi">
                  Login <span className="hidden sm:inline">/ Sign up</span>
                </button>
              )}
              {stage === 'auth' && (
                <button type="button" onClick={() => setStage('home')} className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 hover:text-white">
                  Back
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-12 sm:px-8">

        {/* ── Home: enter team name ── */}
        {stage === 'home' && (
          <section className="animate-fade-up w-full max-w-4xl text-center">
            <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.34em] text-hwi">Hack With India · SAIU</p>
            <h1 className="font-display text-[clamp(3.5rem,12vw,8.5rem)] font-bold leading-[0.88] tracking-[-0.065em] text-white">
              ACCESS <span className="text-hwi drop-shadow-[0_0_38px_rgba(255,0,85,0.3)]">DENIED</span>
              <span className="block pt-4 text-[0.34em] tracking-[0.4em] text-white/80">— QUIZ</span>
            </h1>
            <form ref={formRef} onSubmit={handleTeamSubmit} className="mx-auto mt-12 w-full max-w-xl">
              <label htmlFor="homeTeamName" className="sr-only">Team name</label>
              <div className="flex items-center rounded-2xl border border-white/15 bg-black/45 p-2 shadow-[0_16px_60px_rgba(0,0,0,0.35)] transition focus-within:border-hwi/70 focus-within:shadow-[0_0_30px_rgba(255,0,85,0.12)]">
                <Users className="ml-3 size-5 shrink-0 text-hwi" aria-hidden="true" />
                <input
                  id="homeTeamName"
                  name="teamName"
                  value={teamName}
                  onChange={(e) => { setTeamName(e.target.value); setError('') }}
                  placeholder={animatedPlaceholder}
                  autoComplete="organization"
                  maxLength={48}
                  aria-invalid={Boolean(error)}
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 font-display text-base text-white outline-none placeholder:text-white/45 sm:text-lg"
                />
                <button
                  type="submit"
                  aria-label="Start Quiz"
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-hwi px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-hwi-bright sm:px-5 sm:text-xs"
                >
                  Enter <ArrowRight className="size-4" />
                </button>
              </div>
              {error && <p role="alert" className="mt-2 text-left text-xs text-red-400">{error}</p>}
            </form>
            <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted/35">Three rounds · One team · Your score</p>
          </section>
        )}

        {/* ── Auth: email/password + Google ── */}
        {stage === 'auth' && (
          <section className="surface animate-fade-up w-full max-w-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-hwi via-hwi/50 to-transparent" />
            <div className="p-6 sm:p-8">
              <button
                type="button"
                onClick={() => { setStage('home'); setError('') }}
                className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50 hover:text-white transition"
              >
                <ArrowLeft className="size-3" /> Back
              </button>
              <div className="mb-6 flex size-11 items-center justify-center rounded-xl border border-hwi/25 bg-hwi/[0.08] text-hwi">
                <Users className="size-5" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-hwi">
                {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">
                {authMode === 'signup' ? 'Sign up to join' : 'Log in to continue'}
              </h2>
              <p className="mt-2 text-sm text-white/50">
                Team <span className="font-semibold text-white/80">{teamName.trim() || 'name needed'}</span> · Secure account powered by Firebase.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); void authenticate('email') }} className="mt-6 space-y-4">
                {!teamName.trim() && (
                  <div>
                    <label htmlFor="authTeamName" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">Team name</label>
                    <input id="authTeamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Your team name" autoComplete="organization" maxLength={48} required className="field-input mt-2" />
                  </div>
                )}
                <div>
                  <label htmlFor="authEmail" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">Email</label>
                  <input id="authEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required className="field-input mt-2" />
                </div>
                <div>
                  <label htmlFor="authPassword" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">Password</label>
                  <input id="authPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required className="field-input mt-2" />
                </div>
                {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
                <Button type="submit" size="lg" disabled={authBusy} className="w-full">
                  {authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create account' : 'Log in'} <ArrowRight className="size-4" />
                </Button>
              </form>
              <div className="my-4 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                <span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" />
              </div>
              <button
                type="button"
                disabled={authBusy}
                onClick={() => void authenticate('google')}
                className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] text-xs font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                <span className="font-display text-base font-bold text-white">G</span>Continue with Google
              </button>
              <p className="mt-5 text-center text-xs text-white/45">
                {authMode === 'signup' ? 'Already have an account?' : 'New to the quiz?'}{' '}
                <button type="button" onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setError('') }} className="font-semibold text-hwi hover:text-hwi-bright">
                  {authMode === 'signup' ? 'Log in' : 'Sign up'}
                </button>
              </p>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setStage('rules'); setError('') }}
                  className="text-[11px] font-medium text-white/40 hover:text-white/80 transition underline underline-offset-4"
                >
                  Skip and view rules as guest →
                </button>
              </div>
              <p className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-[10px] leading-relaxed text-white/40">
                <LockKeyhole className="size-3 shrink-0 text-hwi" />Your team progress saves automatically on this device.
              </p>
            </div>
          </section>
        )}

        {/* ── Rules: briefing before starting ── */}
        {stage === 'rules' && (
          <section className="surface animate-fade-up w-full max-w-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-hwi via-hwi/50 to-transparent" />
            <div className="p-6 sm:p-9">
              <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-hwi">Team check-in · {teamName.trim()}</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Know the rules</h2>
              <p className="mt-2 text-sm text-white/50">A quick briefing before your team enters the arena.</p>
              {profileSaveWarning && (
                <p role="status" className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2 text-xs text-amber-200">
                  Your account is signed in, but Firebase could not save the team profile. Check the Firestore rules for the <code>hwi_accounts</code> collection.
                </p>
              )}
              <ol className="mt-7 space-y-3">
                {[
                  'The quiz has three sections: Computer Knowledge, Advanced Computer Knowledge, and Computer Riddles.',
                  'Answer each question carefully. Once submitted, an answer is locked and cannot be changed.',
                  'Your progress saves automatically. Complete all sections to see your final score.',
                ].map((rule, index) => (
                  <li key={rule} className="flex gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <span className="font-display text-sm font-bold text-hwi">0{index + 1}</span>
                    <p className="text-sm leading-relaxed text-white/75">{rule}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">
                {QUIZ_SECTIONS.length} sections · {TOTAL_QUESTIONS} questions
              </p>
              <Button onClick={() => onStart({ teamName: teamName.trim() })} size="lg" className="mt-6 w-full">
                Get started <ArrowRight className="size-4" />
              </Button>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
