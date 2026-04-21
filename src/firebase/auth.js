import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth } from './config';

/**
 * Sign in with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function signIn(email, password) {
  if (!auth) throw new Error('Firebase is not configured. Please set up your .env file.');
  return signInWithEmailAndPassword(auth, email, password);
}

export const signInWithEmailPassword = signIn;

/**
 * Sign up (create account) with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function signUp(email, password) {
  if (!auth) throw new Error('Firebase is not configured. Please set up your .env file.');
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user.
 * @returns {Promise<void>}
 */
export async function signOut() {
  if (!auth) return;
  return firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes.
 * In demo mode (no Firebase config), always fires null immediately.
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {Unsubscribe}
 */

export function onAuth(callback) {
  if (!auth) {
    // Demo mode: no Firebase — resolve as unauthenticated after a tick
    setTimeout(() => callback(null), 0);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Send a password reset email.
 * @param {string} email 
 * @returns {Promise<void>}
 */
export async function sendResetEmail(email) {
  if (!auth) throw new Error('Firebase configuration missing.');
  return sendPasswordResetEmail(auth, email);
}

/**
 * Set auth persistence.
 * @param {boolean} rememberMe 
 */
export async function setAuthPersistence(rememberMe) {
  if (!auth) return;
  const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
  return setPersistence(auth, persistence);
}
