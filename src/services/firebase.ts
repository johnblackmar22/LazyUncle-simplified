import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Set demo mode
export const DEMO_MODE = true;

// Firebase configuration with demo mode defaults
const firebaseConfig = {
  apiKey: "demo-mode",
  authDomain: "demo-mode",
  projectId: "demo-mode",
  storageBucket: "demo-mode",
  messagingSenderId: "demo-mode",
  appId: "demo-mode"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 