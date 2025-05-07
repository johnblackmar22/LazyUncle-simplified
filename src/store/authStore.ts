import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../services/firebase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetError: () => void;
}

const convertFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName || '',
  photoURL: firebaseUser.photoURL || '',
  createdAt: firebaseUser.metadata.creationTime 
    ? new Date(firebaseUser.metadata.creationTime).getTime() 
    : Date.now(),
});

// Create demo user for testing
const createDemoUser = (email: string, displayName: string): User => ({
  id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
  email,
  displayName,
  photoURL: '',
  createdAt: Date.now(),
});

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: true,

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // In demo mode, create a fake user
      if (email === 'demo@example.com' && password === 'password') {
        const demoUser = createDemoUser(email, 'Demo User');
        set({ 
          user: demoUser,
          loading: false 
        });
        return;
      }
      
      // Otherwise, try Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ 
        user: convertFirebaseUser(userCredential.user),
        loading: false 
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
      // In demo mode, create a fake user
      if (email && password) {
        const demoUser = createDemoUser(email, displayName || email.split('@')[0]);
        set({ 
          user: demoUser,
          loading: false 
        });
        return;
      }
      
      // Otherwise, try Firebase signup
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      set({ 
        user: convertFirebaseUser(userCredential.user),
        loading: false 
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
      await firebaseSignOut(auth);
      set({ user: null, loading: false });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },

  resetError: () => set({ error: null })
}));

// Initialize auth state listener
onAuthStateChanged(auth, (firebaseUser) => {
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