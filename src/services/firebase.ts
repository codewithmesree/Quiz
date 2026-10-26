import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
  measurementId?: string
}

const STORAGE_KEY = 'hwi-saiu-firebase-config'

/** Prefer the project's build-time Firebase config; use a saved config only as fallback. */
export function getFirebaseConfig(): FirebaseConfig | null {
  const env = import.meta.env
  if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as FirebaseConfig
        if (parsed.apiKey && parsed.projectId && parsed.appId) {
          return parsed
        }
      }
    } catch {
      // ignore
    }
  }

  return null
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  // Reinitialize app
  cachedApp = null
  cachedDb = null
  cachedAuth = null
}

export function clearFirebaseConfig(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  cachedApp = null
  cachedDb = null
  cachedAuth = null
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null
}

let cachedApp: FirebaseApp | null = null
let cachedDb: Firestore | null = null
let cachedAuth: Auth | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (cachedApp) return cachedApp
  const config = getFirebaseConfig()
  if (!config) return null

  try {
    const existing = getApps()
    if (existing.length > 0) {
      cachedApp = existing[0]
    } else {
      cachedApp = initializeApp(config)
    }
    return cachedApp
  } catch (error) {
    console.error('Failed to initialize Firebase app:', error)
    return null
  }
}

export function getFirebaseDb(): Firestore | null {
  if (cachedDb) return cachedDb
  const app = getFirebaseApp()
  if (!app) return null

  try {
    cachedDb = getFirestore(app)
    return cachedDb
  } catch (error) {
    console.error('Failed to get Firestore instance:', error)
    return null
  }
}

export function getFirebaseAuth(): Auth | null {
  if (cachedAuth) return cachedAuth
  const app = getFirebaseApp()
  if (!app) return null
  try {
    cachedAuth = getAuth(app)
    return cachedAuth
  } catch (error) {
    console.error('Failed to get Firebase Auth instance:', error)
    return null
  }
}
