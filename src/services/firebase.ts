import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Fixed demo mode detection - only true if explicitly set to 'true'
const demoModeEnv = import.meta.env.VITE_DEMO_MODE;
export const DEMO_MODE = demoModeEnv === 'true';

console.log('🔧 Firebase Service - Environment Check:', {
  VITE_DEMO_MODE: demoModeEnv,
  DEMO_MODE,
  hasFirebaseConfig: !!(import.meta.env.VITE_FIREBASE_PROJECT_ID)
});

// Firebase configuration - only used if not in demo mode
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-mode',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-mode',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-mode',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-mode',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'demo-mode',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-mode',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('🔥 Firebase initialized in', DEMO_MODE ? 'DEMO MODE (localStorage)' : 'PRODUCTION MODE (Firebase)', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

export default app; 