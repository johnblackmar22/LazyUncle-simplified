import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper to get env variable from import.meta.env or process.env
function getEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key];
  }
  return undefined;
}

const apiKey = getEnv('VITE_FIREBASE_API_KEY');
const authDomain = getEnv('VITE_FIREBASE_AUTH_DOMAIN');
const projectId = getEnv('VITE_FIREBASE_PROJECT_ID');
const storageBucket = getEnv('VITE_FIREBASE_STORAGE_BUCKET');
const messagingSenderId = getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID');
const appId = getEnv('VITE_FIREBASE_APP_ID');
const demoModeEnv = getEnv('VITE_DEMO_MODE');

const hasValidConfig = !!apiKey && 
  apiKey !== 'replace-with-your-api-key' &&
  apiKey !== 'demo-mode';

export const DEMO_MODE = demoModeEnv === 'true' || !hasValidConfig;

// console.log('Running in demo mode:', DEMO_MODE); // Uncomment for debugging only

const firebaseConfig = {
  apiKey: hasValidConfig ? apiKey : 'demo-mode',
  authDomain: hasValidConfig ? authDomain : 'demo-mode',
  projectId: hasValidConfig ? projectId : 'demo-mode',
  storageBucket: hasValidConfig ? storageBucket : 'demo-mode',
  messagingSenderId: hasValidConfig ? messagingSenderId : 'demo-mode',
  appId: hasValidConfig ? appId : 'demo-mode',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app; 