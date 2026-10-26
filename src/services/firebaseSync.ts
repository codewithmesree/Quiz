import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseDb } from './firebase'
import type { QuizSession, ScoreSummary } from '../types/quiz'
import type { GameMasterState } from '../types/gamemaster'
import type { User } from 'firebase/auth'

const TEAMS_COLLECTION = 'hwi_teams'
const GM_DOC_ID = 'hwi_gm_state'
const SYSTEM_COLLECTION = 'hwi_system'
const ACCOUNTS_COLLECTION = 'hwi_accounts'

/** Fetch the team name previously saved for a signed-in user. Returns null when not found. */
export async function fetchAccountTeamProfile(uid: string): Promise<string | null> {
  const db = getFirebaseDb()
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, ACCOUNTS_COLLECTION, uid))
    if (!snap.exists()) return null
    const data = snap.data() as { teamName?: string }
    return typeof data.teamName === 'string' && data.teamName.trim() ? data.teamName.trim() : null
  } catch (error) {
    console.warn('Failed to fetch account team profile:', error)
    return null
  }
}

/** Save the signed-in user's team profile after Firebase Authentication succeeds. */
export async function saveAccountTeamProfile(user: User, teamName: string): Promise<boolean> {
  const db = getFirebaseDb()
  if (!db || !teamName.trim()) return false
  try {
    await setDoc(doc(db, ACCOUNTS_COLLECTION, user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      teamName: teamName.trim(),
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  } catch (error) {
    console.warn('Firebase Authentication succeeded, but saving the team profile failed:', error)
    return false
  }
}

export interface CloudTeamRecord {
  teamName: string
  sessionId: string
  currentSection: number
  currentIndex: number
  sectionBreak: number | null
  phase: 'welcome' | 'quiz' | 'results'
  totalCorrect: number
  totalAnswered: number
  percentage: number
  codingStagesCompleted: number
  totalPoints: number
  sessionData?: string // JSON serialized QuizSession for exact rehydration
  isCompleted: boolean
  lastUpdated: number
  clientTimestamp: number
}

function sanitizeDocId(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
}

/** Save team's live progress to Firebase Firestore */
export async function syncTeamProgressToCloud(
  session: QuizSession,
  score: ScoreSummary,
  currentSection: number,
  currentIndex: number,
  sectionBreak: number | null,
  phase: 'welcome' | 'quiz' | 'results',
  codingStagesCompleted: number = 0,
): Promise<boolean> {
  const db = getFirebaseDb()
  if (!db || !session) return false

  const docId = sanitizeDocId(session.profile.teamName)
  if (!docId) return false

  try {
    const isCompleted = phase === 'results'
    const totalPoints = score.totalCorrect + codingStagesCompleted * 2

    const payload = {
      teamName: session.profile.teamName,
      sessionId: session.id,
      currentSection,
      currentIndex,
      sectionBreak,
      phase,
      totalCorrect: score.totalCorrect,
      totalAnswered: score.totalAnswered,
      percentage: score.percentage,
      codingStagesCompleted,
      totalPoints,
      isCompleted,
      sessionData: JSON.stringify(session),
      lastUpdated: Date.now(),
      serverUpdatedAt: serverTimestamp(),
    }

    await setDoc(doc(db, TEAMS_COLLECTION, docId), payload, { merge: true })
    return true
  } catch (error) {
    console.warn('Failed to sync team progress to Firebase:', error)
    return false
  }
}

/** Fetch a saved team's session from Firebase Firestore by team name */
export async function fetchTeamProgressFromCloud(
  teamName: string,
): Promise<CloudTeamRecord | null> {
  const db = getFirebaseDb()
  if (!db) return null

  const docId = sanitizeDocId(teamName)
  if (!docId) return null

  try {
    const snap = await getDoc(doc(db, TEAMS_COLLECTION, docId))
    if (!snap.exists()) return null
    return snap.data() as CloudTeamRecord
  } catch (error) {
    console.warn('Failed to fetch team progress from Firebase:', error)
    return null
  }
}

/** Fetch all registered teams from Cloud */
export async function fetchAllCloudTeams(): Promise<CloudTeamRecord[]> {
  const db = getFirebaseDb()
  if (!db) return []

  try {
    const q = query(collection(db, TEAMS_COLLECTION), orderBy('totalPoints', 'desc'))
    const snap = await getDocs(q)
    const teams: CloudTeamRecord[] = []
    snap.forEach((doc) => {
      teams.push(doc.data() as CloudTeamRecord)
    })
    return teams
  } catch (error) {
    console.warn('Failed to fetch all teams from Firebase:', error)
    return []
  }
}

/** Subscribe to live multi-device leaderboard */
export function subscribeToCloudLeaderboard(
  callback: (teams: CloudTeamRecord[]) => void,
): Unsubscribe | null {
  const db = getFirebaseDb()
  if (!db) return null

  try {
    const q = query(collection(db, TEAMS_COLLECTION))
    return onSnapshot(
      q,
      (snapshot) => {
        const teams: CloudTeamRecord[] = []
        snapshot.forEach((doc) => {
          teams.push(doc.data() as CloudTeamRecord)
        })

        // Sort descending by total score, then by completed time
        teams.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints
          }
          if (b.totalCorrect !== a.totalCorrect) {
            return b.totalCorrect - a.totalCorrect
          }
          return a.lastUpdated - b.lastUpdated
        })

        callback(teams)
      },
      (error) => {
        console.warn('Error listening to cloud leaderboard:', error)
      },
    )
  } catch (error) {
    console.warn('Failed to subscribe to cloud leaderboard:', error)
    return null
  }
}

/** Subscribe to live GameMaster state across devices */
export function subscribeToCloudGameMaster(
  callback: (state: Partial<GameMasterState>) => void,
): Unsubscribe | null {
  const db = getFirebaseDb()
  if (!db) return null

  try {
    const ref = doc(db, SYSTEM_COLLECTION, GM_DOC_ID)
    return onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as Partial<GameMasterState>)
        }
      },
      (error) => {
        console.warn('Error listening to cloud GameMaster:', error)
      },
    )
  } catch (error) {
    console.warn('Failed to subscribe to cloud GameMaster:', error)
    return null
  }
}

/** Update live GameMaster state in cloud (Admin only) */
export async function syncGameMasterToCloud(
  state: GameMasterState,
): Promise<boolean> {
  const db = getFirebaseDb()
  if (!db) return false

  try {
    const ref = doc(db, SYSTEM_COLLECTION, GM_DOC_ID)
    await setDoc(ref, {
      version: state.version,
      isLive: state.isLive,
      phase: state.phase,
      adminPasscode: state.adminPasscode,
      startedAt: state.startedAt,
      phaseChangedAt: state.phaseChangedAt,
      showCountdown: state.showCountdown,
      countdownSeconds: state.countdownSeconds,
      announcements: state.announcements,
      lastUpdated: Date.now(),
    }, { merge: true })
    return true
  } catch (error) {
    console.warn('Failed to sync GameMaster to cloud:', error)
    return false
  }
}
