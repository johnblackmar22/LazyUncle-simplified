import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Recipient } from '../types';
import { useAuthStore } from './authStore';

interface RecipientState {
  recipients: Recipient[];
  loading: boolean;
  error: string | null;
  fetchRecipients: () => Promise<void>;
  addRecipient: (recipient: Omit<Recipient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Recipient | null>;
  updateRecipient: (id: string, recipientData: Partial<Recipient>) => Promise<void>;
  deleteRecipient: (id: string) => Promise<void>;
  resetError: () => void;
}

export const useRecipientStore = create<RecipientState>((set, get) => ({
  recipients: [],
  loading: false,
  error: null,

  fetchRecipients: async () => {
    const user = useAuthStore.getState().user;
    const demoMode = useAuthStore.getState().demoMode;
    
    console.log('Fetching recipients with user:', user?.id, 'Demo mode:', demoMode);
    
    set({ loading: true, error: null });
    
    try {
      // If in demo mode, get data from localStorage
      if (demoMode) {
        console.log('Using demo mode for recipients');
        const savedRecipients = localStorage.getItem('recipients');
        const recipients = savedRecipients ? JSON.parse(savedRecipients) : [];
        console.log('Found demo recipients:', recipients.length);
        set({ recipients, loading: false });
        return;
      }
      
      // Otherwise, proceed with Firebase fetching if user is authenticated
      if (!user) {
        console.log('No user found, cannot fetch recipients');
        set({ loading: false });
        return;
      }

      const recipientsQuery = query(
        collection(db, 'recipients'),
        where('userId', '==', user.id)
      );
      
      const querySnapshot = await getDocs(recipientsQuery);
      const recipientsData: Recipient[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        recipientsData.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          relationship: data.relationship,
          birthdate: data.birthdate?.toDate?.() || data.birthdate,
          interests: data.interests || [],
          giftPreferences: data.giftPreferences,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        });
      });
      
      console.log('Fetched Firebase recipients:', recipientsData.length);
      set({ recipients: recipientsData, loading: false });
    } catch (error) {
      console.error('Error fetching recipients:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  addRecipient: async (recipientData) => {
    const user = useAuthStore.getState().user;
    const demoMode = useAuthStore.getState().demoMode;
    
    if (!user && !demoMode) {
      console.error('No user found and not in demo mode');
      set({ error: 'User not authenticated', loading: false });
      return null;
    }

    set({ loading: true, error: null });
    try {
      const timestamp = Timestamp.now();
      
      if (demoMode) {
        // Handle demo mode recipient creation
        const newRecipient: Recipient = {
          id: `demo-${Date.now()}`,
          userId: 'demo-user',
          ...recipientData,
          interests: recipientData.interests || [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        // Save to localStorage
        const savedRecipients = localStorage.getItem('recipients');
        const existingRecipients = savedRecipients ? JSON.parse(savedRecipients) : [];
        localStorage.setItem('recipients', JSON.stringify([...existingRecipients, newRecipient]));
        
        set(state => ({ 
          recipients: [...state.recipients, newRecipient],
          loading: false 
        }));
        
        return newRecipient;
      }
      
      // Normal Firebase mode
      const newRecipient = {
        ...recipientData,
        userId: user!.id,
        interests: recipientData.interests || [],
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      const docRef = await addDoc(collection(db, 'recipients'), newRecipient);
      
      const recipient: Recipient = {
        id: docRef.id,
        ...newRecipient,
        createdAt: timestamp.toDate().getTime(),
        updatedAt: timestamp.toDate().getTime()
      };
      
      set(state => ({ 
        recipients: [...state.recipients, recipient],
        loading: false 
      }));
      
      return recipient;
    } catch (error) {
      console.error('Error adding recipient:', error);
      set({ error: (error as Error).message, loading: false });
      return null;
    }
  },

  updateRecipient: async (id, recipientData) => {
    const demoMode = useAuthStore.getState().demoMode;
    
    set({ loading: true, error: null });
    try {
      if (demoMode) {
        // Handle demo mode update
        set(state => {
          const updatedRecipients = state.recipients.map(recipient => 
            recipient.id === id 
              ? { 
                  ...recipient, 
                  ...recipientData, 
                  updatedAt: Date.now() 
                } 
              : recipient
          );
          
          // Update localStorage
          localStorage.setItem('recipients', JSON.stringify(updatedRecipients));
          
          return {
            recipients: updatedRecipients,
            loading: false
          };
        });
        return;
      }
      
      // Normal Firebase mode
      const timestamp = Timestamp.now();
      await updateDoc(doc(db, 'recipients', id), {
        ...recipientData,
        updatedAt: timestamp
      });
      
      set(state => ({
        recipients: state.recipients.map(recipient => 
          recipient.id === id 
            ? { 
                ...recipient, 
                ...recipientData, 
                updatedAt: timestamp.toDate().getTime() 
              } 
            : recipient
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating recipient:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteRecipient: async (id) => {
    const demoMode = useAuthStore.getState().demoMode;
    
    set({ loading: true, error: null });
    try {
      if (demoMode) {
        // Handle demo mode delete
        set(state => {
          const filteredRecipients = state.recipients.filter(recipient => recipient.id !== id);
          
          // Update localStorage
          localStorage.setItem('recipients', JSON.stringify(filteredRecipients));
          
          return {
            recipients: filteredRecipients,
            loading: false
          };
        });
        return;
      }
      
      // Normal Firebase mode
      await deleteDoc(doc(db, 'recipients', id));
      set(state => ({
        recipients: state.recipients.filter(recipient => recipient.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting recipient:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  resetError: () => set({ error: null })
})); 