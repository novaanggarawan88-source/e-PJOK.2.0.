/**
 * Firebase Initialization & Configuration
 * PENILAIAN ANTAR TEMAN PJOK
 *
 * File ini menginisialisasi Firebase App, Firebase Authentication,
 * Cloud Firestore, dan Firebase Storage menggunakan konfigurasi modular.
 * Pengguna dapat mengganti nilai pada `firebaseConfig` dengan kredensial dari Firebase Console.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  type Firestore
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

// Matikan log internal Firestore yang bising saat initial handshake / koneksi transien
try {
  setLogLevel('error');
} catch {}

// Kredensial Firebase Proyek Aktif
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || "ISI_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "penilaian-pjok.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "penilaian-pjok",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || "penilaian-pjok.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || "1:123456789012:web:abcdef123456",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (appletConfig as any).firestoreDatabaseId || ""
};

/**
 * Kontrol Status Firebase Cloud
 * Diatur ke 'false' agar aplikasi berjalan dalam Mode Mandiri / Lokal Cepat (Bebas Kuota 100%).
 * Dapat diaktifkan kembali kapan saja dengan mengubah nilai ini menjadi 'true'.
 */
export const FIREBASE_ENABLED = false;

/**
 * Memeriksa apakah Firebase sudah dikonfigurasi dan diaktifkan.
 */
export const isFirebaseConfigured = (): boolean => {
  if (!FIREBASE_ENABLED) {
    return false;
  }

  try {
    const savedConfig = localStorage.getItem('pjok_custom_firebase_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.apiKey && parsed.apiKey !== 'ISI_API_KEY' && parsed.projectId !== 'ISI_PROJECT_ID') {
        return true;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca custom Firebase config:', e);
  }

  return (
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey !== 'ISI_API_KEY' &&
    firebaseConfig.projectId !== 'penilaian-pjok' &&
    firebaseConfig.apiKey.startsWith('AIza')
  );
};

export const getActiveFirebaseConfig = () => {
  try {
    const savedConfig = localStorage.getItem('pjok_custom_firebase_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.apiKey && parsed.apiKey !== 'ISI_API_KEY') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca custom Firebase config:', e);
  }
  return firebaseConfig;
};

// Inisialisasi Firebase App secara aman
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

try {
  const activeConfig = getActiveFirebaseConfig();
  if (getApps().length === 0) {
    appInstance = initializeApp(activeConfig);
  } else {
    appInstance = getApp();
  }
  authInstance = getAuth(appInstance);
  
  // Gunakan initializeFirestore dengan mode force long-polling untuk konektivitas stabil di iframe/browser
  try {
    const firestoreSettings = {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    };
    if (activeConfig.firestoreDatabaseId) {
      dbInstance = initializeFirestore(appInstance, firestoreSettings, activeConfig.firestoreDatabaseId);
    } else {
      dbInstance = initializeFirestore(appInstance, firestoreSettings);
    }
  } catch {
    // Fallback jika Firestore instance sudah pernah diinisialisasi
    if (activeConfig.firestoreDatabaseId) {
      dbInstance = getFirestore(appInstance, activeConfig.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(appInstance);
    }
  }

  storageInstance = getStorage(appInstance);
} catch (error) {
  console.warn('Inisialisasi Firebase menggunakan mode fallback lokal:', error);
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

export default {
  app,
  auth,
  db,
  storage,
  firebaseConfig,
  isFirebaseConfigured
};
