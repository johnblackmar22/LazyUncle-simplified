// Mock implementation of the environment variable getter
export function getEnv(key: string): string | undefined {
  // Return mock values for testing
  const mockEnvVars: Record<string, string> = {
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
    VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-messaging-id',
    VITE_FIREBASE_APP_ID: 'test-app-id',
    VITE_FIREBASE_DATABASE_URL: 'https://test-project.firebaseio.com',
  };
  
  return mockEnvVars[key];
}

export default getEnv; 