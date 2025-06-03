import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, db, DEMO_MODE } from '../services/firebase';
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
    return localStorage.getItem('lazyuncle_demoMode') === 'true';
  } catch {
    return false;
  }
}

// Get stored demo user
function getStoredDemoUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('lazyuncle_demoUser');
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
      // Check for demo credentials first
      if (email === 'demo@example.com' && password === 'password') {
        const demoUser = createDemoUser();
        
        // Store in localStorage with prefixed keys
        localStorage.setItem('lazyuncle_demoMode', 'true');
        localStorage.setItem('lazyuncle_demoUser', JSON.stringify(demoUser));
        
        set({ 
          user: demoUser,
          loading: false,
          demoMode: true,
          initialized: true
        });
        return;
      }
      
      // If Firebase is in demo mode and not demo credentials, show helpful error
      if (DEMO_MODE) {
        set({ 
          error: "Firebase is in demo mode. Please use demo@example.com / password to sign in, or configure Firebase credentials in your .env file.",
          loading: false 
        });
        return;
      }
      
      // Firebase login for real credentials
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ 
        user: convertFirebaseUser(userCredential.user),
        loading: false,
        demoMode: false,
        initialized: true
      });
    } catch (error) {
      console.error('Sign in error:', error);
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      // If Firebase is in demo mode, prevent real registration
      if (DEMO_MODE) {
        set({ 
          error: "Firebase is in demo mode. Registration is disabled. Please configure Firebase credentials in your .env file or use demo mode.",
          loading: false 
        });
        return;
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = { ...convertFirebaseUser(userCredential.user), planId: 'free' };
      set({ 
        user,
        loading: false,
        initialized: true,
        demoMode: false
      });
      
      await setDoc(doc(db, 'users', user.id), {
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        planId: user.planId
      });
    } catch (error) {
      console.error('Sign up error:', error);
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      // Clear demo data with proper keys
      if (get().demoMode) {
        console.log('=== CLEARING DEMO DATA ===');
        localStorage.removeItem('lazyuncle_demoMode');
        localStorage.removeItem('lazyuncle_demoUser');
        localStorage.removeItem('lazyuncle_recipients');
        
        // Clear all occasion data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('lazyuncle_occasions_')) {
            console.log('Removing occasion data:', key);
            localStorage.removeItem(key);
          }
        });
        
        console.log('Demo data cleared successfully');
      } else if (!DEMO_MODE) {
        await firebaseSignOut(auth);
      }
      
      set({ 
        user: null, 
        loading: false,
        demoMode: false,
        initialized: true
      });
    } catch (error) {
      console.error('Sign out error:', error);
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
      
      if (DEMO_MODE) {
        set({ 
          error: "Firebase is in demo mode. Password reset is disabled. Please configure Firebase credentials in your .env file.",
          loading: false 
        });
        return;
      }
      
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
    } catch (error) {
      console.error('Reset password error:', error);
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
    console.log('=== AUTH INITIALIZATION START ===');
    
    // Check for demo mode first - this needs to be synchronous to prevent race conditions
    const isDemoMode = checkDemoMode();
    console.log('Demo mode detected:', isDemoMode);
    
    if (isDemoMode) {
      const storedUser = getStoredDemoUser();
      console.log('Stored demo user found:', !!storedUser);
      if (storedUser) {
        // Set state synchronously to prevent redirect
        set({
          user: storedUser,
          demoMode: true,
          initialized: true,
          loading: false,
          error: null
        });
        console.log('✅ Demo user restored successfully - auth initialized synchronously');
        return;
      } else {
        // Demo mode enabled but no user - clear demo mode and require login
        console.log('⚠️ Demo mode flag found but no user - clearing demo mode');
        localStorage.removeItem('lazyuncle_demoMode');
        set({
          user: null,
          demoMode: false,
          initialized: true,
          loading: false,
          error: null
        });
        return;
      }
    }
    
    // For Firebase auth, we need to wait for the onAuthStateChanged to fire at least once
    // This ensures we don't mark as initialized until we know the auth state
    console.log('Setting up Firebase auth initialization...');
    set({ 
      initialized: false,  // Don't mark as initialized yet
      demoMode: false,
      loading: true,       // Show loading while waiting for auth state
      error: null
    });
    
    // Set up a one-time listener to initialize auth state
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      console.log('🔥 Firebase onAuthStateChanged fired during initialization:', !!firebaseUser);
      
      if (firebaseUser) {
        const user = convertFirebaseUser(firebaseUser);
        set({
          user,
          initialized: true,
          demoMode: false,
          loading: false,
          error: null
        });
        console.log('✅ Firebase user restored successfully during initialization');
      } else {
        set({
          user: null,
          initialized: true,
          demoMode: false,
          loading: false,
          error: null
        });
        console.log('✅ No Firebase user found during initialization - user needs to log in');
      }
      
      // Unsubscribe after first auth state determination
      unsubscribe();
    });
    
    // Fallback timeout in case onAuthStateChanged never fires (shouldn't happen, but safety net)
    setTimeout(() => {
      const currentState = get();
      if (!currentState.initialized) {
        console.log('⚠️ Auth initialization timeout - marking as initialized without user');
        set({
          user: null,
          initialized: true,
          demoMode: false,
          loading: false,
          error: null
        });
      }
    }, 5000); // 5 second timeout
    
    console.log('✅ Firebase auth initialization setup complete - waiting for onAuthStateChanged');
  }
})); 