// CommonJS script to check environment variables
const fs = require('fs');

// Set environment variables manually
process.env.VITE_DEMO_MODE = 'true';
process.env.VITE_FIREBASE_API_KEY = 'demo-mode';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'demo-mode';
process.env.VITE_FIREBASE_PROJECT_ID = 'demo-mode';
process.env.VITE_FIREBASE_STORAGE_BUCKET = 'demo-mode';
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = 'demo-mode';
process.env.VITE_FIREBASE_APP_ID = 'demo-mode';

console.log('Environment variables set:');
console.log('VITE_DEMO_MODE:', process.env.VITE_DEMO_MODE);
console.log('VITE_FIREBASE_API_KEY:', process.env.VITE_FIREBASE_API_KEY);

// Check if the app is in demo mode
console.log('App is in demo mode:', process.env.VITE_DEMO_MODE === 'true'); 