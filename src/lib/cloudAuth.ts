// Cloud Auth - Firebase Authentication (Google, Apple, Email)
// Native iOS: uses @capacitor-community/apple-sign-in for Apple Sign-In
// Web: uses Firebase signInWithPopup
// All Firebase imports are dynamic to keep the main bundle lean.

import type { User } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

export type AuthProvider = 'google' | 'apple' | 'email';

const AUTH_TIMEOUT_MS = 30000;

let authInstance: import('firebase/auth').Auth | null = null;

async function getAuth(): Promise<import('firebase/auth').Auth> {
  if (authInstance) return authInstance;
  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth: fbGetAuth } = await import('firebase/auth');

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'placeholder',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://placeholder-default-rtdb.firebaseio.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'placeholder',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:placeholder',
  };

  const existing = getApps();
  const app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  authInstance = fbGetAuth(app);
  return authInstance;
}

function withAuthTimeout<T>(promise: Promise<T>, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(msg)), AUTH_TIMEOUT_MS)
    ),
  ]);
}

// Generate a random nonce for Apple Sign-In security
function generateNonce(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

// SHA-256 hash for nonce (Apple requires hashed nonce)
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function signInWithGoogle(): Promise<User> {
  const auth = await getAuth();
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  const result = await withAuthTimeout(
    signInWithPopup(auth, provider),
    'Google giriş zaman aşımı. Lütfen tekrar deneyin.'
  );
  return result.user;
}

export async function signInWithApple(): Promise<User> {
  const auth = await getAuth();

  // Native iOS: use custom Capacitor Apple Sign-In plugin → Firebase credential
  if (Capacitor.isNativePlatform()) {
    const rawNonce = generateNonce();
    const hashedNonce = await sha256(rawNonce);

    const { registerPlugin } = await import('@capacitor/core');
    const AppleSignIn = registerPlugin<{
      authorize(opts: { nonce: string }): Promise<{
        identityToken?: string;
        authorizationCode?: string;
        user?: string;
        email?: string;
        givenName?: string;
        familyName?: string;
      }>;
    }>('AppleSignIn');

    const result = await withAuthTimeout(
      AppleSignIn.authorize({ nonce: hashedNonce }),
      'Apple giriş zaman aşımı. Lütfen tekrar deneyin.'
    );

    const idToken = result.identityToken;
    if (!idToken) {
      throw new Error('Apple giriş başarısız: Token alınamadı.');
    }

    const { OAuthProvider, signInWithCredential } = await import('firebase/auth');
    const credential = new OAuthProvider('apple.com').credential({
      idToken,
      rawNonce,
    });
    const firebaseResult = await signInWithCredential(auth, credential);
    return firebaseResult.user;
  }

  // Web: use Firebase popup
  const { OAuthProvider, signInWithPopup } = await import('firebase/auth');
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  const result = await withAuthTimeout(
    signInWithPopup(auth, provider),
    'Apple giriş zaman aşımı.'
  );
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = await getAuth();
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithEmail(email: string, password: string): Promise<User> {
  const auth = await getAuth();
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOut(): Promise<void> {
  const auth = await getAuth();
  await auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const auth = await getAuth();
  return new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged((user) => {
      unsub();
      resolve(user);
    });
  });
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  getAuth().then((auth) => {
    if (cancelled) return;
    unsubscribe = auth.onAuthStateChanged(callback);
  });

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}
