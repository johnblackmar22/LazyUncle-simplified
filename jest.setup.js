require('@testing-library/jest-dom'); 

// Mock window.matchMedia for Chakra UI responsive design
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock import.meta for Jest with comprehensive environment variables
global.import = { 
  meta: { 
    env: {
      VITE_DEMO_MODE: 'true',
      VITE_FIREBASE_API_KEY: 'demo-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-domain',
      VITE_FIREBASE_PROJECT_ID: 'demo-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-storage',
      VITE_FIREBASE_MESSAGING_SENDER_ID: 'demo-sender',
      VITE_FIREBASE_APP_ID: 'demo-app'
    }
  } 
};

// Set process.env for fallback compatibility
process.env.VITE_DEMO_MODE = 'true';
process.env.VITE_FIREBASE_API_KEY = 'demo-key';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'demo-domain';
process.env.VITE_FIREBASE_PROJECT_ID = 'demo-project';
process.env.VITE_FIREBASE_STORAGE_BUCKET = 'demo-storage';
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = 'demo-sender';
process.env.VITE_FIREBASE_APP_ID = 'demo-app';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  doc: jest.fn(() => ({})),
  getDocs: jest.fn(() => Promise.resolve({
    docs: [],
    forEach: jest.fn()
  })),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  getFirestore: jest.fn(() => ({})),
  Timestamp: {
    now: jest.fn(() => ({
      toDate: jest.fn(() => new Date())
    }))
  }
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

// Mock firebase app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: 'mock-app',
    options: {}
  }))
}));

// Mock the entire firebase service module
jest.mock('./src/services/firebase', () => ({
  DEMO_MODE: true,
  auth: {
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    currentUser: null,
  },
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
  }
}));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve('')
  })
);

// Mock static assets for Jest
defineJestAssetMocks();

function defineJestAssetMocks() {
  const assetExtensions = ['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp'];
  assetExtensions.forEach(ext => {
    jest.mock(`*.${ext}`, () => 'test-file-stub');
  });
} 