import { create } from 'zustand';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Occasion } from '../types';
import { useAuthStore } from './authStore';

interface OccasionState {
  occasions: { [recipientId: string]: Occasion[] };
  loading: boolean;
  error: string | null;
  fetchOccasions: (recipientId: string) => Promise<void>;
  addOccasion: (recipientId: string, occasion: Omit<Occasion, 'id' | 'recipientId' | 'createdAt' | 'updatedAt'>) => Promise<Occasion | null>;
  updateOccasion: (occasionId: string, data: Partial<Occasion>) => Promise<void>;
  deleteOccasion: (occasionId: string, recipientId: string) => Promise<void>;
  setOccasions: (recipientId: string, occasions: Occasion[]) => void;
  resetError: () => void;
}

// Helper function to get localStorage key
function getOccasionsStorageKey(recipientId: string): string {
  return `lazyuncle_occasions_${recipientId}`;
}

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
        const storageKey = getOccasionsStorageKey(recipientId);
        console.log('Looking for occasions in localStorage with key:', storageKey);
        const saved = localStorage.getItem(storageKey);
        console.log('Found occasions data:', saved);
        const occasions = saved ? JSON.parse(saved) : [];
        console.log('Parsed occasions:', occasions);
        set(state => ({ occasions: { ...state.occasions, [recipientId]: occasions }, loading: false }));
        return;
      }
      if (!user) {
        console.log('No user found, setting empty occasions');
        set({ loading: false });
        return;
      }
      const q = query(collection(db, 'occasions'), where('recipientId', '==', recipientId));
      const snapshot = await getDocs(q);
      const occasions: Occasion[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        occasions.push({
          id: docSnap.id,
          recipientId: data.recipientId,
          name: data.name,
          date: data.date,
          type: data.type,
          notes: data.notes,
          budget: data.budget,
          giftWrap: data.giftWrap,
          personalizedNote: data.personalizedNote,
          noteText: data.noteText,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        });
      });
      set(state => ({ occasions: { ...state.occasions, [recipientId]: occasions }, loading: false }));
    } catch (error) {
      console.error('Error fetching occasions:', error);
      set({ error: (error as Error).message, loading: false });
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
          id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          recipientId,
          ...occasionData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        console.log('Demo occasion created:', newOccasion);
        
        // Get existing occasions and add the new one
        const storageKey = getOccasionsStorageKey(recipientId);
        const saved = localStorage.getItem(storageKey);
        const existingOccasions = saved ? JSON.parse(saved) : [];
        const updatedOccasions = [...existingOccasions, newOccasion];
        
        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(updatedOccasions));
        console.log('Saved to localStorage with key:', storageKey);
        console.log('Updated occasions:', updatedOccasions);
        
        // Update store state
        set(state => ({ 
          occasions: { ...state.occasions, [recipientId]: updatedOccasions }, 
          loading: false 
        }));
        console.log('Demo occasion saved successfully');
        return newOccasion;
      }
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
      
      const newOccasion = {
        ...cleanedOccasionData,
        recipientId,
        userId: user.id,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      console.log('Firebase occasion to save:', newOccasion);
      const docRef = await addDoc(collection(db, 'occasions'), newOccasion);
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
    } catch (error) {
      console.error('Error in addOccasion store:', error);
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
      }
      const timestamp = Timestamp.now();
      await updateDoc(doc(db, 'occasions', occasionId), { ...data, updatedAt: timestamp });
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
      }
      await deleteDoc(doc(db, 'occasions', occasionId));
      const updated = (get().occasions[recipientId] || []).filter(o => o.id !== occasionId);
      set(state => ({ occasions: { ...state.occasions, [recipientId]: updated }, loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setOccasions: (recipientId, occasions) => {
    set(state => ({ occasions: { ...state.occasions, [recipientId]: occasions } }));
  },

  resetError: () => set({ error: null }),
})); 