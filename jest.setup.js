require('@testing-library/jest-dom'); 

// Mock import.meta for Jest
global.import = { meta: { env: {} } };

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