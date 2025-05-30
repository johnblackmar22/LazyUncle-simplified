import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import type { User } from '../types';
import { doc, setDoc } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resetError: () => void;
  setDemoMode: (isDemo: boolean) => void;
  setPlanId: (planId: string) => void;
  initializeAuth: () => void;
}

// Helper function to convert Firebase user to app user
function convertFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || '',
    createdAt: Date.now(),
    planId: 'free',
  };
}

// Create demo user for testing
function createDemoUser(): User {
  return {
    id: 'demo-user',
    email: 'demo@example.com',
    displayName: 'Demo User',
    photoURL: '',
    createdAt: Date.now(),
    planId: 'free',
  };
}

// Check if we're in demo mode
function checkDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('demoMode') === 'true';
  } catch {
    return false;
  }
}

// Get stored demo user
function getStoredDemoUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('demoUser');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,
  demoMode: checkDemoMode(),

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // Check for demo credentials
      if (email === 'demo@example.com' && password === 'password') {
        const demoUser = createDemoUser();
        
        // Store in localStorage
        localStorage.setItem('demoMode', 'true');
        localStorage.setItem('demoUser', JSON.stringify(demoUser));
        
        set({ 
          user: demoUser,
          loading: false,
          demoMode: true,
          initialized: true
        });
        return;
      }
      
      // Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ 
        user: convertFirebaseUser(userCredential.user),
        loading: false,
        demoMode: false,
        initialized: true
      });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = { ...convertFirebaseUser(userCredential.user), planId: 'free' };
      set({ 
        user,
        loading: false,
        initialized: true
      });
      
      await setDoc(doc(db, 'users', user.id), {
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        planId: user.planId
      });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      // Clear demo data
      if (get().demoMode) {
        localStorage.removeItem('demoMode');
        localStorage.removeItem('demoUser');
        localStorage.removeItem('recipients');
        localStorage.removeItem('gifts');
      } else {
        await firebaseSignOut(auth);
      }
      
      set({ 
        user: null, 
        loading: false,
        demoMode: false,
        initialized: true
      });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      if (email === 'demo@example.com') {
        set({ 
          error: "Cannot reset password for demo account", 
          loading: false 
        });
        return;
      }
      
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },

  resetError: () => set({ error: null }),
  
  setDemoMode: (isDemo) => set({ demoMode: isDemo }),

  setPlanId: (planId: string) => {
    set(state => ({
      user: state.user ? { ...state.user, planId } : null
    }));
  },

  initializeAuth: () => {
    // Check for demo mode first
    const isDemoMode = checkDemoMode();
    
    if (isDemoMode) {
      const storedUser = getStoredDemoUser();
      if (storedUser) {
        set({
          user: storedUser,
          demoMode: true,
          initialized: true
        });
        return;
      }
    }
    
    // For Firebase auth, we'll handle it in the App component
    // to avoid module-level listeners
    set({ initialized: true });
  }
})); 