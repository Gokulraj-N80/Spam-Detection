import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Automatically fallback to mock auth if VITE_USE_MOCK_AUTH is set to "True"
// or if the configuration API key is missing.
const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === "True" || 
                     !import.meta.env.VITE_FIREBASE_API_KEY || 
                     import.meta.env.VITE_FIREBASE_API_KEY.trim() === "";

let app = null;
let auth = null;
let googleProvider = null;

if (!useMockAuth) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase Client SDK failed to initialize:", error);
  }
}

export { auth, googleProvider, useMockAuth };
