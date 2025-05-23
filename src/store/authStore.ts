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
}

function convertFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || '',
    createdAt: firebaseUser.metadata.creationTime 
      ? new Date(firebaseUser.metadata.creationTime).getTime() 
      : Date.now(),
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  initialized: true,
  demoMode: isDemoMode(),

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // Check for demo credentials
      if (email === 'demo@example.com' && password === 'password') {
        // Set demo mode and create demo user
        set({ 
          user: { ...createDemoUser(), planId: 'free' },
          loading: false,
          demoMode: true
        });
        
        // Initialize demo data
        initializeDemoData();
        return;
      }
      
      // Otherwise, try Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ 
        user: convertFirebaseUser(userCredential.user),
        loading: false,
        demoMode: false
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
        loading: false 
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
          demoMode: false
        });
        
        // Clear demo data from localStorage
        localStorage.removeItem('demoMode');
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
  }
}));

// Initialize auth state listener
onAuthStateChanged(auth, (firebaseUser) => {
  // Skip this if we're in demo mode
  if (useAuthStore.getState().demoMode) {
    return;
  }
  
  if (firebaseUser) {
    useAuthStore.setState({ 
      user: convertFirebaseUser(firebaseUser),
      initialized: true
    });
  } else {
    useAuthStore.setState({ 
      user: null,
      initialized: true
    });
  }
}); 