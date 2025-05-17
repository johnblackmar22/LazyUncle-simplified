import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Check if we have valid Firebase configuration in environment variables
const hasValidConfig = !!import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_API_KEY !== 'replace-with-your-api-key' &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'demo-mode';

// Demo mode should be true if no valid Firebase config
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !hasValidConfig;

console.log('Running in demo mode:', DEMO_MODE);

// Firebase configuration using environment variables or demo mode values
const firebaseConfig = {
  apiKey: hasValidConfig ? import.meta.env.VITE_FIREBASE_API_KEY : "demo-mode",
  authDomain: hasValidConfig ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : "demo-mode",
  projectId: hasValidConfig ? import.meta.env.VITE_FIREBASE_PROJECT_ID : "demo-mode",
  storageBucket: hasValidConfig ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : "demo-mode",
  messagingSenderId: hasValidConfig ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : "demo-mode",
  appId: hasValidConfig ? import.meta.env.VITE_FIREBASE_APP_ID : "demo-mode"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 