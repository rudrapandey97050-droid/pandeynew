import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  memoryLocalCache,
  setLogLevel
} from 'firebase/firestore';

import appletConfig from '../../firebase-applet-config.json';

// Suppress noisy internal offline/unavailable transient warnings
try {
  setLogLevel('error');
} catch {
  // ignore
}

// Decoupled optional Firebase configuration with auto-detection from applet config
export const firebaseConfig: Record<string, any> = {
  projectId: appletConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: appletConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
  apiKey: appletConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: appletConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  firestoreDatabaseId: appletConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
  storageBucket: appletConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: appletConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    const dbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)';

    try {
      // Use experimentalForceLongPolling to guarantee rock-solid connectivity
      // across Cloud Run, sandboxed iframes, proxies, and preview environments.
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache(),
      }, dbId);
    } catch {
      db = getFirestore(app, dbId);
    }
  }
} catch (err) {
  console.warn('Firebase optional initialization bypassed:', err);
}

// Check connection to Firestore backend gracefully with timeout and non-blocking fallback
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    const checkPromise = getDoc(doc(db, 'settings', 'store'));
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
    const res = await Promise.race([checkPromise, timeoutPromise]);
    return res !== null;
  } catch {
    return false;
  }
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');

// In-memory token storage (never saved to localStorage for security)
let cachedAccessToken: string | null = null;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export { app, auth, db };
export { collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot };
