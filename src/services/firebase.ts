// Import both environment modules and choose based on the environment
import { getEnv as getEnvBrowser } from './firebase.env';
import { getEnv as getEnvNode } from './firebase.env.node';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Dynamically choose the right getEnv function
let getEnv: (key: string) => string | undefined;

// For tests, override with the Node version if in Jest
if (typeof process !== 'undefined' && process.env && process.env.JEST_WORKER_ID !== undefined) {
  console.log('Using Node.js environment for tests');
  getEnv = getEnvNode;
} else {
  getEnv = getEnvBrowser;
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

// Check for valid Firebase configuration
const hasValidConfig = !!apiKey && 
  apiKey !== 'replace-with-your-api-key' &&
  apiKey !== 'demo-mode' &&
  apiKey !== 'test-api-key' && 
  apiKey.length > 10;  // API keys should be reasonably long

// Debug log for API key issues
console.log('Firebase API Key validation:', { 
  hasKey: !!apiKey, 
  keyLength: apiKey ? apiKey.length : 0,
  hasValidConfig
});

// Only enable demo mode if explicitly forced, environment variable is set, 
// config is invalid, or we're in a test environment
export const DEMO_MODE = 
  forceDemoMode || 
  demoModeEnv === 'true' || 
  !hasValidConfig || 
  process.env.NODE_ENV === 'test' ||
  // Check if running locally - not in production
  (typeof window !== 'undefined' && 
   (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

console.log('Running in demo mode:', DEMO_MODE); // Keep for debugging

// Only initialize Firebase with real credentials if we have them and aren't in demo mode
const firebaseConfig = {
  apiKey: hasValidConfig && !DEMO_MODE ? apiKey : 'demo-mode',
  authDomain: hasValidConfig && !DEMO_MODE ? authDomain : 'demo-mode',
  projectId: hasValidConfig && !DEMO_MODE ? projectId : 'demo-mode',
  storageBucket: hasValidConfig && !DEMO_MODE ? storageBucket : 'demo-mode',
  messagingSenderId: hasValidConfig && !DEMO_MODE ? messagingSenderId : 'demo-mode',
  appId: hasValidConfig && !DEMO_MODE ? appId : 'demo-mode',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app; 