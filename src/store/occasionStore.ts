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

export const useOccasionStore = create<OccasionState>((set, get) => ({
  occasions: {},
  loading: false,
  error: null,

  fetchOccasions: async (recipientId) => {
    const user = useAuthStore.getState().user;
    const demoMode = useAuthStore.getState().demoMode;
    set({ loading: true, error: null });
    try {
      if (demoMode) {
        const saved = localStorage.getItem(`occasions-${recipientId}`);
        const occasions = saved ? JSON.parse(saved) : [];
        set(state => ({ occasions: { ...state.occasions, [recipientId]: occasions }, loading: false }));
        return;
      }
      if (!user) {
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
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        });
      });
      set(state => ({ occasions: { ...state.occasions, [recipientId]: occasions }, loading: false }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addOccasion: async (recipientId, occasionData) => {
    const user = useAuthStore.getState().user;
    const demoMode = useAuthStore.getState().demoMode;
    set({ loading: true, error: null });
    try {
      const timestamp = Timestamp.now();
      if (demoMode) {
        const newOccasion: Occasion = {
          id: `demo-${Date.now()}`,
          recipientId,
          ...occasionData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const saved = localStorage.getItem(`occasions-${recipientId}`);
        const occasions = saved ? JSON.parse(saved) : [];
        const updated = [...occasions, newOccasion];
        localStorage.setItem(`occasions-${recipientId}`, JSON.stringify(updated));
        set(state => ({ occasions: { ...state.occasions, [recipientId]: updated }, loading: false }));
        return newOccasion;
      }
      if (!user) throw new Error('User not authenticated');
      const newOccasion = {
        ...occasionData,
        recipientId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
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
      return occasion;
    } catch (error) {
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
        const updated = get().occasions[foundRecipientId].map(o => o.id === occasionId ? { ...o, ...data, updatedAt: Date.now() } : o);
        localStorage.setItem(`occasions-${foundRecipientId as string}`, JSON.stringify(updated));
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
      const updated = get().occasions[foundRecipientId].map(o => o.id === occasionId ? { ...o, ...data, updatedAt: timestamp.toDate().getTime() } : o);
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
        localStorage.setItem(`occasions-${recipientId}`, JSON.stringify(updated));
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