/**
 * Firestore Initialization, Collection References, and Standardized Helpers
 * PENILAIAN ANTAR TEMAN PJOK
 *
 * File ini menyediakan referensi koleksi Firestore yang terstandarisasi dengan data converter,
 * serta helper function untuk operasi CRUD dan query pada modul-modul manajemen.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  CollectionReference,
  DocumentReference,
  QueryConstraint,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';
import {
  UserProfile,
  ClassItem,
  IndicatorItem,
  AssessmentTask,
  AssessmentRecord
} from '../types';

/**
 * Nama-nama koleksi standar Firestore
 */
export const COLLECTIONS = {
  PENGGUNA: 'pengguna',
  USERS: 'users',
  CLASSES: 'classes',
  INDICATORS: 'indicators',
  TASKS: 'tasks',
  ASSESSMENTS: 'assessments'
} as const;

/**
 * Generic Firestore Data Converter untuk menjamin tipe TypeScript yang aman
 */
export const createConverter = <T extends { [key: string]: any }>(): FirestoreDataConverter<T> => ({
  toFirestore(modelObject: T) {
    // Bersihkan properti bernilai undefined
    const clean: { [key: string]: any } = {};
    for (const key of Object.keys(modelObject)) {
      if (modelObject[key] !== undefined) {
        clean[key] = modelObject[key];
      }
    }
    return clean;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as unknown as T;
  }
});

/**
 * Helper untuk membuat CollectionReference dengan converter
 */
export const getTypedCollection = <T extends { [key: string]: any }>(
  collectionName: string
): CollectionReference<T> | null => {
  if (!db) return null;
  return collection(db, collectionName).withConverter(createConverter<T>());
};

// Referensi Koleksi Terstandarisasi
export const penggunaCol = db ? collection(db, COLLECTIONS.PENGGUNA).withConverter(createConverter<UserProfile>()) : null;
export const usersCol = db ? collection(db, COLLECTIONS.USERS).withConverter(createConverter<UserProfile>()) : null;
export const classesCol = db ? collection(db, COLLECTIONS.CLASSES).withConverter(createConverter<ClassItem>()) : null;
export const indicatorsCol = db ? collection(db, COLLECTIONS.INDICATORS).withConverter(createConverter<IndicatorItem>()) : null;
export const tasksCol = db ? collection(db, COLLECTIONS.TASKS).withConverter(createConverter<AssessmentTask>()) : null;
export const assessmentsCol = db ? collection(db, COLLECTIONS.ASSESSMENTS).withConverter(createConverter<AssessmentRecord>()) : null;

/**
 * Enum tipe operasi Firestore untuk logging & standard error handling
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

/**
 * Struktur info error Firestore sesuai standar keamanan Zero-Trust
 */
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Standard CRUD & Query Helpers
 */

/**
 * Mengambil semua dokumen dari sebuah koleksi
 */
export async function fetchCollection<T extends { [key: string]: any }>(colName: string): Promise<T[]> {
  if (!db || !isFirebaseConfigured()) return [];
  try {
    const colRef = collection(db, colName).withConverter(createConverter<T>());
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((docSnap) => docSnap.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
  }
}

/**
 * Mengambil satu dokumen berdasarkan ID
 */
export async function fetchDocById<T extends { [key: string]: any }>(colName: string, docId: string): Promise<T | null> {
  if (!db || !isFirebaseConfigured()) return null;
  const path = `${colName}/${docId}`;
  try {
    const docRef = doc(db, colName, docId).withConverter(createConverter<T>());
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Menyimpan / menimpa dokumen dengan ID tertentu (merge: true)
 */
export async function saveDocWithId<T extends { [key: string]: any }>(
  colName: string,
  docId: string,
  data: T
): Promise<void> {
  if (!db || !isFirebaseConfigured()) return;
  const path = `${colName}/${docId}`;
  try {
    const docRef = doc(db, colName, docId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Menambahkan dokumen baru dengan auto-generated ID
 */
export async function addDocAutoId<T extends { [key: string]: any }>(
  colName: string,
  data: T
): Promise<string> {
  if (!db || !isFirebaseConfigured()) return `local-${Date.now()}`;
  try {
    const colRef = collection(db, colName);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colName);
  }
}

/**
 * Memperbarui field tertentu dalam dokumen
 */
export async function updateDocFields(
  colName: string,
  docId: string,
  fields: { [key: string]: any }
): Promise<void> {
  if (!db || !isFirebaseConfigured()) return;
  const path = `${colName}/${docId}`;
  try {
    const docRef = doc(db, colName, docId);
    await updateDoc(docRef, fields);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Menghapus dokumen berdasarkan ID
 */
export async function removeDocById(colName: string, docId: string): Promise<void> {
  if (!db || !isFirebaseConfigured()) return;
  const path = `${colName}/${docId}`;
  try {
    const docRef = doc(db, colName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Melakukan query terfilter pada koleksi
 */
export async function queryDocs<T extends { [key: string]: any }>(
  colName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  if (!db || !isFirebaseConfigured()) return [];
  try {
    const colRef = collection(db, colName).withConverter(createConverter<T>());
    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
  }
}

/**
 * Mendengarkan perubahan data dokumen secara real-time (onSnapshot)
 */
export function subscribeToCollection<T extends { [key: string]: any }>(
  colName: string,
  onUpdate: (data: T[]) => void,
  ...constraints: QueryConstraint[]
): () => void {
  if (!db || !isFirebaseConfigured()) {
    return () => {};
  }
  const colRef = collection(db, colName).withConverter(createConverter<T>());
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => docSnap.data());
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, colName);
    }
  );

  return unsubscribe;
}

export {
  db,
  serverTimestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
};
