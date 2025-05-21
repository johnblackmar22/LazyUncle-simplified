/**
 * Get environment variables safely in a way that works in both Vite and Jest
 */
export function getEnv(key: string): string | undefined {
  // Use try-catch to safely handle import.meta which is only available in ESM
  try {
    // @ts-ignore - This is a Vite-specific feature
    if (typeof window !== 'undefined' && window.__VITE_ENV__ && key in window.__VITE_ENV__) {
      // @ts-ignore - Access Vite environment variables
      return window.__VITE_ENV__[key];
    }
  } catch (e) {
    // Silently ignore errors when import.meta is not available
  }
  
  // Check for Node.js environment variables (for testing)
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key];
  }
  
  // For testing without either, provide default test values for important keys
  const testEnvVars: Record<string, string> = {
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
    VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-messaging-id',
    VITE_FIREBASE_APP_ID: 'test-app-id'
  };
  
  if (key in testEnvVars) {
    return testEnvVars[key];
  }
  
  return undefined;
} 