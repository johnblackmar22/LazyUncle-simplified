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
import type { Recipient, AutoSendPreferences, OccasionPreference, AutoSendOccasions, PaymentMethod, Address } from '../types';
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
  setRecipients: (recipients: Recipient[]) => void;
  toggleAutoSend: (id: string, enabled: boolean) => Promise<void>;
  toggleOccasionAutoSend: (id: string, occasion: string, enabled: boolean) => Promise<void>;
  setDefaultBudget: (id: string, budget: number) => Promise<void>;
  updateOccasionPreference: (id: string, occasion: string, preference: Partial<any>) => Promise<void>;
  updateShippingAddress: (id: string, address: any) => Promise<void>;
  toggleApprovalRequirement: (id: string, requireApproval: boolean) => Promise<void>;
}

const defaultAutoSendPreferences = {
  enabled: false,
  defaultBudget: 50,
  requireApproval: true,
  occasions: {},
  shippingAddress: { line1: '', city: '', state: '', postalCode: '', country: '' },
  paymentMethod: { type: 'creditCard' }
};

function ensureAutoSendPreferences(prefs: Partial<AutoSendPreferences> = {}): AutoSendPreferences {
  return {
    enabled: prefs.enabled !== undefined ? prefs.enabled : false,
    defaultBudget: prefs.defaultBudget !== undefined ? prefs.defaultBudget : 50,
    requireApproval: prefs.requireApproval !== undefined ? prefs.requireApproval : true,
    occasions: prefs.occasions !== undefined ? prefs.occasions : {},
    shippingAddress: prefs.shippingAddress !== undefined ? prefs.shippingAddress : { line1: '', city: '', state: '', postalCode: '', country: '' },
    paymentMethod: prefs.paymentMethod && (prefs.paymentMethod.type === 'creditCard' || prefs.paymentMethod.type === 'paypal' || prefs.paymentMethod.type === 'other')
      ? prefs.paymentMethod as PaymentMethod
      : { type: 'creditCard' as const }
  };
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
          description: data.description,
          deliveryAddress: data.deliveryAddress,
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
    
    console.log('Adding recipient in mode:', demoMode ? 'demo' : 'firebase', 'User:', user?.id);
    
    set({ loading: true, error: null });
    try {
      const timestamp = Timestamp.now();
      
      if (demoMode) {
        console.log('Creating demo recipient with data:', recipientData);
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
        
        console.log('Demo recipient created successfully:', newRecipient.id);
        return newRecipient;
      }
      
      // Normal Firebase mode
      if (!user) {
        throw new Error('User not authenticated');
      }
      // Validate required fields
      if (!recipientData.name || !recipientData.relationship) {
        throw new Error('Missing required recipient fields');
      }
      const newRecipient = {
        ...recipientData,
        userId: user.id,
        interests: recipientData.interests || [],
        createdAt: timestamp,
        updatedAt: timestamp
      };
      console.log('Writing recipient to Firestore:', newRecipient);
      const docRef = await addDoc(collection(db, 'recipients'), newRecipient);
      const recipient = {
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
      console.error('Error adding recipient to Firestore:', error, recipientData);
      set({ error: `Failed to add recipient: ${(error as Error).message}. Check Firestore rules, config, and data structure.`, loading: false });
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

  resetError: () => set({ error: null }),

  setRecipients: (recipients) => set({ recipients }),

  toggleAutoSend: async (id, enabled) => {
    set(state => {
      const updatedRecipients = state.recipients.map(recipient =>
        recipient.id === id
          ? {
              ...recipient,
              autoSendPreferences: ensureAutoSendPreferences({
                ...recipient.autoSendPreferences,
                enabled
              })
            } as Recipient
          : recipient
      );
      localStorage.setItem('recipients', JSON.stringify(updatedRecipients));
      return { recipients: updatedRecipients };
    });
  },
  toggleOccasionAutoSend: async (id, occasion, enabled) => {
    set(state => {
      const updatedRecipients = state.recipients.map(recipient => {
        if (recipient.id !== id) return recipient;
        const prefs = ensureAutoSendPreferences(recipient.autoSendPreferences);
        return {
          ...recipient,
          autoSendPreferences: {
            ...prefs,
            occasions: {
              ...prefs.occasions,
              [occasion]: {
                ...prefs.occasions[occasion],
                enabled: enabled ?? false,
                budget: prefs.occasions[occasion]?.budget ?? prefs.defaultBudget,
                leadTime: prefs.occasions[occasion]?.leadTime ?? 7
              }
            }
          }
        } as Recipient;
      });
      localStorage.setItem('recipients', JSON.stringify(updatedRecipients));
      return { recipients: updatedRecipients };
    });
  },
  setDefaultBudget: async (id, budget) => {
    set(state => {
      const updatedRecipients = state.recipients.map(recipient => {
        if (recipient.id !== id) return recipient;
        const prefs = ensureAutoSendPreferences(recipient.autoSendPreferences);
        return {
          ...recipient,
          autoSendPreferences: {
            ...prefs,
            defaultBudget: budget
          }
        } as Recipient;
      });
      localStorage.setItem('recipients', JSON.stringify(updatedRecipients));
      return { recipients: updatedRecipients };
    });
  },
  updateOccasionPreference: async (id, occasion, preference) => {
    set(state => {
      const updatedRecipients = state.recipients.map(recipient => {
        if (recipient.id !== id) return recipient;
        const prefs = ensureAutoSendPreferences(recipient.autoSendPreferences);
        return {
          ...recipient,
          autoSendPreferences: {
            ...prefs,
            occasions: {
              ...prefs.occasions,
              [occasion]: {
                enabled: preference.enabled ?? prefs.occasions[occasion]?.enabled ?? false,
                budget: preference.budget ?? prefs.occasions[occasion]?.budget ?? prefs.defaultBudget,
                leadTime: preference.leadTime ?? prefs.occasions[occasion]?.leadTime ?? 7
              }
            }
          }
        } as Recipient;
      });
      localStorage.setItem('recipients', JSON.stringify(updatedRecipients));
      return { recipients: updatedRecipients };
    });
  },
  updateShippingAddress: async (id, address) => {
    set(state => {
      const updatedRecipients = state.recipients.map(recipient => {
        if (recipient.id !== id) return recipient;
        const prefs = ensureAutoSendPreferences(recipient.autoSendPreferences);
        return {
          ...recipient,
          autoSendPreferences: {
            ...prefs,
            shippingAddress: address
          }
        } as Recipient;
      });
      localStorage.setItem('recipients', JSON.stringify(updatedRecipients));
      return { recipients: updatedRecipients };
    });
  },
  toggleApprovalRequirement: async (id, requireApproval) => {
    set(state => {
      const updatedRecipients = state.recipients.map(recipient => {
        if (recipient.id !== id) return recipient;
        const prefs = ensureAutoSendPreferences(recipient.autoSendPreferences);
        return {
          ...recipient,
          autoSendPreferences: {
            ...prefs,
            requireApproval
          }
        } as Recipient;
      });
      localStorage.setItem('recipients', JSON.stringify(updatedRecipients));
      return { recipients: updatedRecipients };
    });
  }
})); 