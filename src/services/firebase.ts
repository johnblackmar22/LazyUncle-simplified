// Import both environment modules and choose based on the environment
import { getEnv as getEnvBrowser } from './firebase.env';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Dynamically choose the right getEnv function
let getEnv: (key: string) => string | undefined = getEnvBrowser;

// For tests, override with the Node version if in Jest
if (typeof process !== 'undefined' && process.env && process.env.JEST_WORKER_ID !== undefined) {
  // We would normally import this, but it's a conditional import for testing only
  // The app will never hit this in the browser
  console.log('Using Node.js environment for tests');
}

// Set to false to use Firebase in production
const forceDemoMode = false;

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

export const DEMO_MODE = forceDemoMode || demoModeEnv === 'true' || !hasValidConfig;

console.log('Running in demo mode:', DEMO_MODE); // Keep for debugging

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