// Import both environment modules and choose based on the environment
import { getEnv as getEnvBrowser } from './firebase.env';
import { getEnv as getEnvNode } from './firebase.env.node';
import { initializeApp } from 'firebase/app';
import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// Export version for debugging
export const FIREBASE_VERSION = '10.7.1'; // This should match package.json

// Dynamically choose the right getEnv function
let getEnv: (key: string) => string | undefined;

// For tests, override with the Node version if in Jest
if (typeof process !== 'undefined' && process.env && process.env.JEST_WORKER_ID !== undefined) {
  console.log('Using Node.js environment for tests');
  getEnv = getEnvNode;
} else {
  console.log('Using browser environment for Vite');
  getEnv = getEnvBrowser;
}

// Set to false to use Firebase in production
// This should generally be controlled by .env file through VITE_DEMO_MODE
const forceDemoMode = false;

// We check both import.meta.env and process.env to ensure we get the values
const getEnvVar = (key: string): string | undefined => {
  // Try direct process.env first (from .env file)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // Try import.meta.env (Vite runtime)
  try {
    // @ts-ignore - Access Vite's environment variables
    if (import.meta.env && import.meta.env[key]) {
      // @ts-ignore - Access the specific key in Vite's env
      return import.meta.env[key];
    }
  } catch (error) {
    console.log(`Error accessing import.meta.env for ${key}`);
  }
  
  // Finally use the getEnv helper
  return getEnv(key);
};

// Read all environment variables with multiple fallbacks
const apiKey = getEnvVar('VITE_FIREBASE_API_KEY');
const authDomain = getEnvVar('VITE_FIREBASE_AUTH_DOMAIN');
const projectId = getEnvVar('VITE_FIREBASE_PROJECT_ID');
const storageBucket = getEnvVar('VITE_FIREBASE_STORAGE_BUCKET');
const messagingSenderId = getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID');
const appId = getEnvVar('VITE_FIREBASE_APP_ID');
const demoModeEnv = getEnvVar('VITE_DEMO_MODE');

// Check for valid Firebase configuration
const hasValidConfig = !!apiKey && 
  !!authDomain &&
  !!projectId &&
  !!appId &&
  apiKey !== 'replace-with-your-api-key' &&
  apiKey !== 'demo-mode' &&
  apiKey !== 'test-api-key' && 
  apiKey.length > 10;  // API keys should be reasonably long

// Only enable demo mode if explicitly forced, environment variable is set, 
// config is invalid, or we're in a test environment
export const DEMO_MODE = 
  forceDemoMode || 
  (demoModeEnv === 'true' && process.env.NODE_ENV !== 'production') || 
  (!hasValidConfig && process.env.NODE_ENV !== 'production') || 
  process.env.NODE_ENV === 'test';

// Log the configuration for easier debugging
console.log('Detected Firebase config:', { 
  apiKey: apiKey ? 'Found' : 'Not found',
  demoMode: DEMO_MODE ? 'true' : 'false',
  nodeEnv: process.env.NODE_ENV
});
console.log('Firebase running in ' + (DEMO_MODE ? 'demo mode' : 'production mode'));

// Create the Firebase configuration object
const firebaseConfig: FirebaseOptions = {
  apiKey: hasValidConfig && !DEMO_MODE ? apiKey : 'demo-mode',
  authDomain: hasValidConfig && !DEMO_MODE ? authDomain : 'demo-mode',
  projectId: hasValidConfig && !DEMO_MODE ? projectId : 'demo-mode',
  storageBucket: hasValidConfig && !DEMO_MODE ? storageBucket : 'demo-mode',
  messagingSenderId: hasValidConfig && !DEMO_MODE ? messagingSenderId : 'demo-mode',
  appId: hasValidConfig && !DEMO_MODE ? appId : 'demo-mode',
};

// Initialize Firebase app (either with real or demo config)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize auth and db
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Connect to emulators in development if needed
  if (process.env.NODE_ENV === 'development' && getEnvVar('VITE_USE_FIREBASE_EMULATOR') === 'true') {
    console.log('Connecting to Firebase emulators...');
    try {
      // Auth emulator usually runs on port 9099
      connectAuthEmulator(auth, 'http://localhost:9099');
      // Firestore emulator usually runs on port 8080
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firebase emulators successfully');
    } catch (emulatorError) {
      console.error('Failed to connect to Firebase emulators:', emulatorError);
    }
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Create a mock Firebase app for fallback
  console.warn('Using fallback Firebase configuration due to initialization error');
  const demoConfig = {
    apiKey: 'demo-mode',
    authDomain: 'demo-mode',
    projectId: 'demo-mode',
    storageBucket: 'demo-mode',
    messagingSenderId: 'demo-mode',
    appId: 'demo-mode'
  };
  
  app = initializeApp(demoConfig);
  
  // Initialize services with fallback
  auth = getAuth(app);
  db = getFirestore(app);
}

// Export initialized services
export { auth, db };
export default app; 