import { create } from 'zustand';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Occasion } from '../types';
import { useAuthStore } from './authStore';
import { STORAGE_KEYS, COLLECTIONS, DEMO_USER_ID, DEFAULTS } from '../utils/constants';

interface OccasionState {
  occasions: Record<string, Occasion[]>; // recipientId -> occasions
  loading: boolean;
  error: string | null;
  fetchOccasions: (recipientId: string) => Promise<void>;
  addOccasion: (recipientId: string, occasionData: Omit<Occasion, 'id' | 'recipientId' | 'createdAt' | 'updatedAt'>) => Promise<Occasion | null>;
  updateOccasion: (occasionId: string, data: Partial<Occasion>) => Promise<void>;
  deleteOccasion: (occasionId: string, recipientId: string) => Promise<void>;
  setOccasions: (recipientId: string, occasions: Occasion[]) => void;
  resetError: () => void;
}

// Helper function to get localStorage key for occasions by recipient
const getOccasionsStorageKey = (recipientId: string) => {
  return STORAGE_KEYS.OCCASIONS(recipientId);
};

export const useOccasionStore = create<OccasionState>((set, get) => ({
  occasions: {},
  loading: false,
  error: null,

  fetchOccasions: async (recipientId) => {
    const user = useAuthStore.getState().user;
    const demoMode = useAuthStore.getState().demoMode;
    
    console.log('=== FETCH OCCASIONS ===');
    console.log('Recipient ID:', recipientId);
    console.log('Demo mode:', demoMode);
    console.log('User:', user);
    
    set({ loading: true, error: null });
    
    try {
      if (demoMode) {
        // Handle demo mode
        const storageKey = getOccasionsStorageKey(recipientId);
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
          const occasions = JSON.parse(stored);
          console.log(`Found ${occasions.length} occasions for recipient ${recipientId} in localStorage`);
          set(state => ({
            occasions: {
              ...state.occasions,
              [recipientId]: occasions
            },
            loading: false
          }));
        } else {
          console.log(`No occasions found for recipient ${recipientId} in localStorage`);
          set(state => ({
            occasions: {
              ...state.occasions,
              [recipientId]: []
            },
            loading: false
          }));
        }
      } else {
        // Handle Firebase mode
        if (!user) {
          console.log('No user found, cannot fetch occasions');
          set({ loading: false });
          return;
        }
        
        console.log(`Fetching occasions from Firebase for recipient: ${recipientId}`);
        const occasionsRef = collection(db, COLLECTIONS.OCCASIONS);
        const q = query(occasionsRef, where('recipientId', '==', recipientId), where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        const occasions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Occasion[];
        
        console.log(`Found ${occasions.length} occasions for recipient ${recipientId} in Firebase`);
        
        set(state => ({
          occasions: {
            ...state.occasions,
            [recipientId]: occasions
          },
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error fetching occasions:', error);
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },

  addOccasion: async (recipientId, occasionData) => {
    const user = useAuthStore.getState().user;
    const demoMode = useAuthStore.getState().demoMode;
    console.log('=== OCCASION STORE ADD ===');
    console.log('Recipient ID:', recipientId);
    console.log('Occasion data:', occasionData);
    console.log('Demo mode:', demoMode);
    console.log('User:', user);
    
    set({ loading: true, error: null });
    try {
      const timestamp = Timestamp.now();
      if (demoMode) {
        console.log('Using demo mode for occasion creation');
        const newOccasion: Occasion = {
          id: `demo-occasion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          recipientId,
          ...occasionData,
          userId: "demo-user",
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        console.log('Demo occasion created:', newOccasion);
        
        // Get existing occasions and add the new one
        const storageKey = getOccasionsStorageKey(recipientId);
        console.log('Storage key:', storageKey);
        
        let existingOccasions: Occasion[] = [];
        try {
          const saved = localStorage.getItem(storageKey);
          console.log('Existing data from localStorage:', saved);
          existingOccasions = saved ? JSON.parse(saved) : [];
          console.log('Parsed existing occasions:', existingOccasions);
        } catch (parseError) {
          console.error('Error parsing existing occasions:', parseError);
          existingOccasions = [];
        }
        
        const updatedOccasions = [...existingOccasions, newOccasion];
        console.log('Updated occasions array:', updatedOccasions);
        
        // Save to localStorage with error handling
        try {
          localStorage.setItem(storageKey, JSON.stringify(updatedOccasions));
          console.log('✅ Successfully saved to localStorage');
          
          // Verify the save worked
          const verification = localStorage.getItem(storageKey);
          console.log('Verification read:', verification);
          
          if (!verification) {
            throw new Error('localStorage save verification failed');
          }
        } catch (storageError) {
          console.error('❌ localStorage save failed:', storageError);
          throw new Error(`Failed to save occasion: ${(storageError as Error).message}`);
        }
        
        // Update store state
        set(state => {
          const newState = { 
            occasions: { ...state.occasions, [recipientId]: updatedOccasions }, 
            loading: false 
          };
          console.log('✅ Store state updated:', newState);
          return newState;
        });
        
        console.log('✅ Demo occasion saved successfully');
        return newOccasion;
      } else {
        if (!user) {
          console.error('User not authenticated for Firebase mode');
          throw new Error('User not authenticated');
        }
        console.log('Using Firebase mode for occasion creation');
        
        // Clean the occasion data to remove undefined values that Firebase rejects
        const cleanedOccasionData = Object.fromEntries(
          Object.entries(occasionData).filter(([key, value]) => value !== undefined)
        ) as Omit<Occasion, 'id' | 'recipientId' | 'createdAt' | 'updatedAt'>;
        console.log('Cleaned occasion data (removed undefined values):', cleanedOccasionData);
        
        const newOccasion = { ...cleanedOccasionData, recipientId, userId: user.id, createdAt: timestamp, updatedAt: timestamp };
        console.log('Writing occasion to Firestore:', newOccasion);
        const docRef = await addDoc(collection(db, COLLECTIONS.OCCASIONS), newOccasion);
        const occasion: Occasion = {
          id: docRef.id,
          ...newOccasion,
          createdAt: timestamp.toDate().getTime(),
          updatedAt: timestamp.toDate().getTime(),
        };
        set(state => {
          const prev = state.occasions[recipientId] || [];
          return { occasions: { ...state.occasions, [recipientId]: [...prev, occasion] }, loading: false };
        });
        console.log('Firebase occasion saved successfully:', occasion);
        return occasion;
      }
    } catch (error) {
      console.error('❌ Error in addOccasion store:', error);
      set({ error: (error as Error).message, loading: false });
      return null;
    }
  },

  updateOccasion: async (occasionId, data) => {
    const demoMode = useAuthStore.getState().demoMode;
    set({ loading: true, error: null });
    try {
      if (demoMode) {
        // Find the recipientId for this occasion
        let foundRecipientId: string | null = null;
        Object.entries(get().occasions).forEach(([rid, occs]) => {
          if (occs.some(o => o.id === occasionId)) foundRecipientId = rid;
        });
        if (!foundRecipientId) throw new Error('Occasion not found');
        
        const updated = get().occasions[foundRecipientId].map(o => 
          o.id === occasionId ? { ...o, ...data, updatedAt: Date.now() } : o
        );
        
        const storageKey = getOccasionsStorageKey(foundRecipientId);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        set(state => ({ occasions: { ...state.occasions, [foundRecipientId as string]: updated }, loading: false }));
        return;
      } else {
        const timestamp = Timestamp.now();
        await updateDoc(doc(db, COLLECTIONS.OCCASIONS, occasionId), { ...data, updatedAt: timestamp });
        // Find the recipientId for this occasion
        let foundRecipientId: string | null = null;
        Object.entries(get().occasions).forEach(([rid, occs]) => {
          if (occs.some(o => o.id === occasionId)) foundRecipientId = rid;
        });
        if (!foundRecipientId) throw new Error('Occasion not found');
        const updated = get().occasions[foundRecipientId].map(o => 
          o.id === occasionId ? { ...o, ...data, updatedAt: timestamp.toDate().getTime() } : o
        );
        set(state => ({ occasions: { ...state.occasions, [foundRecipientId as string]: updated }, loading: false }));
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteOccasion: async (occasionId, recipientId) => {
    const demoMode = useAuthStore.getState().demoMode;
    set({ loading: true, error: null });
    try {
      if (demoMode) {
        const occasions = get().occasions[recipientId] || [];
        const updated = occasions.filter(o => o.id !== occasionId);
        const storageKey = getOccasionsStorageKey(recipientId);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        set(state => ({ occasions: { ...state.occasions, [recipientId]: updated }, loading: false }));
        return;
      } else {
        await deleteDoc(doc(db, COLLECTIONS.OCCASIONS, occasionId));
        // Also delete related admin orders
        const user = useAuthStore.getState().user;
        const occasions = get().occasions[recipientId] || [];
        const deletedOccasion = occasions.find(o => o.id === occasionId);
        if (user && deletedOccasion) {
          try {
            const AdminService = (await import('../services/adminService')).default;
            await AdminService.deleteOrdersByOccasion(user.id, deletedOccasion.id, deletedOccasion.name);
            console.log('🗑️ Deleted related admin orders for occasion:', deletedOccasion.id, deletedOccasion.name);
          } catch (error) {
            console.error('❌ Error deleting related admin orders:', error);
          }
        }
        const updated = occasions.filter(o => o.id !== occasionId);
        set(state => ({ occasions: { ...state.occasions, [recipientId]: updated }, loading: false }));
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setOccasions: (recipientId, occasions) => {
    set(state => ({ occasions: { ...state.occasions, [recipientId]: occasions } }));
  },

  resetError: () => set({ error: null }),
})); 