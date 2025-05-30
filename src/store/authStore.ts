import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import type { User } from '../types';
import { isDemoMode, initializeDemoData } from '../services/demoData';
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

// Flag to track if auth listener has been set up
let authListenerInitialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,
  demoMode: false,

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // Check for demo credentials
      if (email === 'demo@example.com' && password === 'password') {
        // Set demo mode and create demo user
        const demoUser = createDemoUser();
        set({ 
          user: demoUser,
          loading: false,
          demoMode: true,
          initialized: true
        });
        
        // Store demo user and initialize demo data
        localStorage.setItem('demoMode', 'true');
        localStorage.setItem('demoUser', JSON.stringify(demoUser));
        initializeDemoData();
        return;
      }
      
      // Otherwise, try Firebase login
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
      // Create user profile in Firestore
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
      // If in demo mode, just clear the state
      if (get().demoMode) {
        set({ 
          user: null, 
          loading: false,
          demoMode: false,
          initialized: true
        });
        
        // Clear demo data from localStorage
        localStorage.removeItem('demoMode');
        localStorage.removeItem('demoUser');
        localStorage.removeItem('recipients');
        localStorage.removeItem('gifts');
        return;
      }
      
      // Otherwise, sign out from Firebase
      await firebaseSignOut(auth);
      set({ user: null, loading: false });
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
      // Don't try to reset password for demo account
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
    const isDemo = isDemoMode();
    
    if (isDemo) {
      // Get stored demo user or create one
      const storedUser = localStorage.getItem('demoUser');
      const demoUser = storedUser ? JSON.parse(storedUser) : createDemoUser();
      
      // Initialize demo data
      initializeDemoData();
      
      // Update store state
      set({
        user: demoUser,
        demoMode: true,
        initialized: true
      });
      
      console.log('Demo mode initialized with user:', demoUser);
      return;
    }
    
    // Set up Firebase auth listener only once and only for non-demo mode
    if (!authListenerInitialized) {
      authListenerInitialized = true;
      
      console.log('Setting up Firebase auth listener');
      onAuthStateChanged(auth, (firebaseUser) => {
        const currentState = get();
        
        // Skip Firebase auth if we're in demo mode
        if (currentState.demoMode) {
          console.log('Skipping Firebase auth listener - demo mode active');
          return;
        }
        
        if (firebaseUser) {
          console.log('Firebase user detected, updating auth state');
          set({ 
            user: convertFirebaseUser(firebaseUser),
            initialized: true,
            demoMode: false
          });
        } else {
          console.log('No Firebase user, clearing auth state');
          set({ 
            user: null,
            initialized: true,
            demoMode: false
          });
        }
      });
    }
    
    // For non-demo mode, mark as initialized but wait for Firebase
    set({ initialized: true });
    console.log('Non-demo mode initialized, waiting for Firebase auth');
  }
})); 