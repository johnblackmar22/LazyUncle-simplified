import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Simple demo mode detection
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

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

console.log('Firebase initialized in', DEMO_MODE ? 'demo mode' : 'production mode');

export default app; 