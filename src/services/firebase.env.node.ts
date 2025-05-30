// A simplified environment variable getter for Node.js environments (like tests)
export function getEnv(key: string): string | undefined {
  const testValues: Record<string, string> = {
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
    VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-messaging-id',
    VITE_FIREBASE_APP_ID: 'test-app-id',
    VITE_FIREBASE_DATABASE_URL: 'https://test-project.firebaseio.com',
  };
  
  // First try Node.js process.env
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key];
  }
  
  // Fall back to test values
  if (key in testValues) {
    return testValues[key];
  }
  
  return undefined;
} 