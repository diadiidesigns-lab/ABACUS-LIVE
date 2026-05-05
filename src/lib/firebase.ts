import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

console.log("[Firebase] NEXT_PUBLIC_FIREBASE_PROJECT_ID =", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

if (!firebaseConfig.apiKey) {
  console.error(
    "Firebase API key is missing. Make sure NEXT_PUBLIC_FIREBASE_API_KEY is set in .env.local"
  );
} else {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  try {
    // Explicitly request the (default) database — equivalent to getFirestore(app) but unambiguous
    db = getFirestore(app, "(default)");
  } catch (err) {
    console.error("[Firebase] Firestore initialization failed:", err);
  }
}

export { auth, db };
export default app!;
