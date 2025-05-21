/**
 * Get environment variables safely in a way that works in both Vite and Jest
 */
export function getEnv(key: string): string | undefined {
  // For safer TypeScript compilation, we need to carefully handle the Vite-specific import.meta
  let envValue: string | undefined = undefined;
  
  // Method 1: Try to access Vite's import.meta.env directly
  try {
    // @ts-ignore - This is for Vite's environment variables
    if (import.meta && import.meta.env) {
      // @ts-ignore - Access the specific key in Vite's env
      envValue = import.meta.env[key];
      if (envValue) {
        return envValue;
      }
    }
  } catch (error) {
    console.log('No import.meta.env available (expected in Node.js environment)');
  }
  
  // Method 2: Check for Node.js environment variables (for testing)
  if (typeof process !== 'undefined' && process.env) {
    envValue = process.env[key];
    if (envValue) {
      return envValue;
    }
  }
  
  // Method 3: Provide fallback values for certain keys in test environments
  if (process.env.NODE_ENV === 'test' || typeof window === 'undefined') {
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
  }
  
  // No value found through any method
  console.warn(`Environment variable not found: ${key}`);
  return undefined;
} 