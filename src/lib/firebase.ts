import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  deleteField,
  query,
  orderBy,
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalEntry, JournalMessage } from '../types';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with local persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore targeting the specific provisioned database
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Auth helper functions
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Firestore error types and handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Recursively strips any keys with value `undefined` to prevent Firestore setDoc errors
export function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    // Preserve Firestore sentinel objects like deleteField()
    if ((data as any)?._methodName || (data as any)?.constructor?.name === 'FieldValue') {
      return data;
    }
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = cleanFirestoreData(val);
      }
    }
    return cleaned as T;
  }
  return data;
}

// User-isolated collection reference
function getUserEntriesCollection(userId: string) {
  if (!userId) throw new Error('User ID is required for database operations.');
  return collection(db, 'users', userId, 'entries');
}

// Firestore operations isolated strictly per user
export async function saveJournalEntry(
  userId: string,
  entry: Partial<JournalEntry> & { id: string }
): Promise<void> {
  if (userId.startsWith('guest-')) {
    return; // Guest reflections are maintained in local session state
  }
  const path = `users/${userId}/entries/${entry.id}`;
  const docRef = doc(db, 'users', userId, 'entries', entry.id);
  const now = Date.now();
  
  // Calculate preview text from first user message
  const preview = entry.messages?.find((m: JournalMessage) => m.role === 'user')?.content.slice(0, 160) || '';

  const rawPayload: Record<string, any> = {
    ...entry,
    userId,
    updatedAt: now,
    previewText: preview,
    title: entry.title || 'Untitled Reflection',
    createdAt: entry.createdAt || now,
    messages: entry.messages || [],
    mood: entry.mood ? entry.mood : deleteField(),
  };

  const payload = cleanFirestoreData(rawPayload);

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserJournalEntries(userId: string): Promise<JournalEntry[]> {
  if (userId.startsWith('guest-')) {
    return [];
  }
  const path = `users/${userId}/entries`;
  try {
    const entriesCol = getUserEntriesCollection(userId);
    const q = query(entriesCol, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as JournalEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToUserEntries(
  userId: string,
  callback: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
) {
  if (userId.startsWith('guest-')) {
    return () => {};
  }
  const path = `users/${userId}/entries`;
  const entriesCol = getUserEntriesCollection(userId);
  const q = query(entriesCol, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((d) => d.data() as JournalEntry);
      callback(entries);
    },
    (error) => {
      console.error('Firestore snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (userId.startsWith('guest-')) {
    return;
  }
  const path = `users/${userId}/entries/${entryId}`;
  try {
    const docRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
