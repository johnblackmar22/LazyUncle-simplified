import { create } from 'zustand';
import { getUserProfile, createUserProfile, updateUserProfile } from '../services/userService';
import { useAuthStore } from './authStore';
import type { User, UserPreferences } from '../types';

interface UserState {
  profile: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  initialized: false,
  
  // Fetch user profile
  fetchProfile: async () => {
    const authUser = useAuthStore.getState().user;
    if (!authUser) return; // Not logged in
    
    set({ loading: true, error: null });
    
    try {
      let userProfile = await getUserProfile(authUser.id);
      
      // If profile doesn't exist, create it
      if (!userProfile) {
        userProfile = await createUserProfile({});
      }
      
      set({ 
        profile: userProfile,
        loading: false,
        initialized: true 
      });
    } catch (error) {
      set({ 
        error: (error as Error).message, 
        loading: false,
        initialized: true
      });
    }
  },
  
  // Update user profile
  updateProfile: async (data) => {
    const { profile } = get();
    if (!profile) {
      set({ error: 'No profile loaded' });
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      const updatedProfile = await updateUserProfile(data);
      set({ profile: updatedProfile, loading: false });
    } catch (error) {
      set({ 
        error: (error as Error).message, 
        loading: false 
      });
    }
  },
  
  // Update user preferences
  updatePreferences: async (prefs) => {
    const { profile } = get();
    if (!profile) {
      set({ error: 'No profile loaded' });
      return;
    }
    
    // Get current preferences or use defaults
    const currentPrefs = profile.preferences || {
      reminderDays: 7,
      defaultCurrency: 'USD',
      theme: 'system',
      notifications: true,
    };
    
    // Update only the provided preferences
    const updatedPrefs = {
      ...currentPrefs,
      ...prefs
    };
    
    await get().updateProfile({ preferences: updatedPrefs });
  },
  
  // Clear error
  clearError: () => set({ error: null })
}));

// Initialize user profile when auth state changes
useAuthStore.subscribe((state) => {
  if (state.user) {
    useUserStore.getState().fetchProfile();
  } else {
    useUserStore.setState({ 
      profile: null, 
      initialized: false 
    });
  }
}); 