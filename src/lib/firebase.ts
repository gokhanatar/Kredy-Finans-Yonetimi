// Firebase is loaded dynamically to avoid pulling ~180KB into the main bundle.
// The SDK is only fetched when a family-sync operation is actually performed.

type FirebaseApp = import('firebase/app').FirebaseApp;
type Database = import('firebase/database').Database;
type DatabaseReference = import('firebase/database').DatabaseReference;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'placeholder',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://placeholder-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'placeholder',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:placeholder',
};

let app: FirebaseApp;
let database: Database;

async function getFirebaseApp(): Promise<FirebaseApp> {
  if (!app) {
    const { initializeApp, getApps } = await import('firebase/app');
    const existing = getApps();
    app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  }
  return app;
}

async function getFirebaseDatabase(): Promise<Database> {
  if (!database) {
    const { getDatabase } = await import('firebase/database');
    const fbApp = await getFirebaseApp();
    const dbUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;
    if (dbUrl && dbUrl !== 'https://placeholder-default-rtdb.firebaseio.com') {
      database = getDatabase(fbApp, dbUrl);
    } else {
      database = getDatabase(fbApp);
    }
  }
  return database;
}

function isFirebaseConfigured(): boolean {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return !!key && key !== 'placeholder';
}

async function ref(db: Database, path: string): Promise<DatabaseReference> {
  const mod = await import('firebase/database');
  return mod.ref(db, path);
}

async function onValue(
  refObj: DatabaseReference,
  callback: (snapshot: import('firebase/database').DataSnapshot) => void
): Promise<import('firebase/database').Unsubscribe> {
  const mod = await import('firebase/database');
  return mod.onValue(refObj, callback);
}

async function get(refObj: DatabaseReference): Promise<import('firebase/database').DataSnapshot> {
  const mod = await import('firebase/database');
  return mod.get(refObj);
}

async function set(refObj: DatabaseReference, value: unknown): Promise<void> {
  const mod = await import('firebase/database');
  return mod.set(refObj, value);
}

async function remove(refObj: DatabaseReference): Promise<void> {
  const mod = await import('firebase/database');
  return mod.remove(refObj);
}

async function push(refObj: DatabaseReference, value?: unknown) {
  const mod = await import('firebase/database');
  return mod.push(refObj, value);
}

// REST API helpers — bypass WebSocket, work reliably in WKWebView
const RTDB_BASE_URL = import.meta.env.VITE_FIREBASE_DATABASE_URL || '';

/** Get the current user's Firebase ID token for authenticated REST calls. */
async function getIdToken(): Promise<string | null> {
  try {
    const { getAuth } = await import('firebase/auth');
    const { getApps } = await import('firebase/app');
    const apps = getApps();
    if (apps.length === 0) return null;
    const auth = getAuth(apps[0]);
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/** Build the REST URL with optional auth token query parameter. */
function buildRestUrl(path: string, idToken: string | null): string {
  const base = `${RTDB_BASE_URL}/${path}.json`;
  if (!idToken) {
    // A4: Auth-required paths (families/, backups/) will fail without token.
    // Return base URL without auth param — Firebase will reject with 401/403.
    console.warn(`[Firebase REST] No auth token for path: ${path}`);
    return base;
  }
  return `${base}?auth=${encodeURIComponent(idToken)}`;
}

async function restGet(path: string): Promise<unknown> {
  const idToken = await getIdToken();
  const url = buildRestUrl(path, idToken);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Firebase REST read failed: ${res.status} (path: ${path})`);
  return res.json();
}

async function restSet(path: string, value: unknown): Promise<void> {
  const idToken = await getIdToken();
  const url = buildRestUrl(path, idToken);
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`Firebase REST write failed: ${res.status} (path: ${path})`);
}

async function restRemove(path: string): Promise<void> {
  const idToken = await getIdToken();
  const url = buildRestUrl(path, idToken);
  const res = await fetch(url, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Firebase REST delete failed: ${res.status} (path: ${path})`);
}

export { getFirebaseDatabase, ref, onValue, set, push, get, remove, isFirebaseConfigured, restGet, restSet, restRemove };
export type { Database, DatabaseReference };
