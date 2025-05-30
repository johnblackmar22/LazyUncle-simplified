import { useAuthStore } from '../../store/authStore';
import { act } from 'react-dom/test-utils';
import * as firebaseAuth from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    onAuthStateChanged: jest.fn(() => () => {}),
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAuthStore.setState({
      user: null,
      loading: false,
      error: null,
      initialized: true,
      demoMode: false,
    });
    
    // Clear mock calls
    jest.clearAllMocks();
    
    // Clear localStorage
    localStorageMock.clear();
  });

  describe('signIn', () => {
    it('should sign in a user with valid credentials', async () => {
      // Mock Firebase sign in success
      (firebaseAuth.signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
          metadata: {
            creationTime: new Date().toISOString(),
          },
          planId: 'free',
        },
      });

      // Call sign in
      await act(async () => {
        await useAuthStore.getState().signIn('test@example.com', 'password');
      });

      // Check store state
      const state = useAuthStore.getState();
      expect(state.user).not.toBeNull();
      expect(state.user?.id).toBe('test-uid');
      expect(state.user?.email).toBe('test@example.com');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.demoMode).toBe(false);

      // Verify Firebase was called
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password'
      );
    });

    it('should handle demo mode login', async () => {
      // Call sign in with demo credentials
      await act(async () => {
        await useAuthStore.getState().signIn('demo@example.com', 'password');
      });

      // Check store state
      const state = useAuthStore.getState();
      expect(state.user).not.toBeNull();
      expect(state.user?.id).toBe('demo-user');
      expect(state.user?.email).toBe('demo@example.com');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.demoMode).toBe(true);

      // Verify Firebase was NOT called
      expect(firebaseAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should handle sign in errors', async () => {
      // Mock Firebase sign in error
      (firebaseAuth.signInWithEmailAndPassword as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      // Call sign in
      await act(async () => {
        await useAuthStore.getState().signIn('test@example.com', 'wrong-password');
      });

      // Check store state
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('should create a new user account', async () => {
      // Mock Firebase sign up success
      (firebaseAuth.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: {
          uid: 'new-user-id',
          email: 'newuser@example.com',
          displayName: 'New User',
          photoURL: null,
          metadata: {
            creationTime: new Date().toISOString(),
          },
          planId: 'free',
        },
      });

      // Call sign up
      await act(async () => {
        await useAuthStore.getState().signUp('newuser@example.com', 'password123', 'New User');
      });

      // Check store state
      const state = useAuthStore.getState();
      expect(state.user).not.toBeNull();
      expect(state.user?.id).toBe('new-user-id');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      // Verify Firebase was called
      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'password123'
      );
    });

    it('should handle sign up errors', async () => {
      // Mock Firebase sign up error
      (firebaseAuth.createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(
        new Error('Email already in use')
      );

      // Call sign up
      await act(async () => {
        await useAuthStore.getState().signUp('existing@example.com', 'password', 'Existing User');
      });

      // Check store state
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Email already in use');
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      // Mock Firebase reset success
      (firebaseAuth.sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      // Call reset password
      await act(async () => {
        await useAuthStore.getState().resetPassword('user@example.com');
      });

      // Check store state
      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      // Verify Firebase was called
      expect(firebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'user@example.com'
      );
    });

    it('should not allow password reset for demo accounts', async () => {
      // Call reset password for demo email
      await act(async () => {
        await useAuthStore.getState().resetPassword('demo@example.com');
      });

      // Check store state
      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Cannot reset password for demo account');

      // Verify Firebase was NOT called
      expect(firebaseAuth.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('should sign out the user', async () => {
      // Setup initial state with a logged in user
      useAuthStore.setState({
        user: {
          id: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: '',
          createdAt: Date.now(),
          planId: 'free',
        },
        loading: false,
        error: null,
        initialized: true,
        demoMode: false,
      });

      // Mock Firebase sign out success
      (firebaseAuth.signOut as jest.Mock).mockResolvedValue(undefined);

      // Call sign out
      await act(async () => {
        await useAuthStore.getState().signOut();
      });

      // Check store state
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      // Verify Firebase was called
      expect(firebaseAuth.signOut).toHaveBeenCalled();
    });

    it('should clear localStorage in demo mode', async () => {
      // Setup initial state with demo mode
      useAuthStore.setState({
        user: {
          id: 'demo-user',
          email: 'demo@example.com',
          displayName: 'Demo User',
          photoURL: '',
          createdAt: Date.now(),
          planId: 'free',
        },
        loading: false,
        error: null,
        initialized: true,
        demoMode: true,
      });

      // Set some demo data in localStorage
      localStorageMock.setItem('demo-mode', 'true');
      localStorageMock.setItem('recipients', JSON.stringify([{ id: 1, name: 'Test' }]));

      // Call sign out
      await act(async () => {
        await useAuthStore.getState().signOut();
      });

      // Check store state
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.demoMode).toBe(false);

      // Verify localStorage was cleared
      expect(localStorageMock.getItem('demo-mode')).toBeNull();
      expect(localStorageMock.getItem('recipients')).toBeNull();

      // Verify Firebase was NOT called
      expect(firebaseAuth.signOut).not.toHaveBeenCalled();
    });
  });
}); 