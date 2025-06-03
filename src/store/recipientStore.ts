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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Recipient, AutoSendPreferences, OccasionPreference, AutoSendOccasions, PaymentMethod, Address } from '../types';
import { useAuthStore } from './authStore';
import { STORAGE_KEYS, COLLECTIONS, DEMO_USER_ID, DEFAULTS } from '../utils/constants';

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

// Constants for localStorage keys - using centralized constants
// const RECIPIENTS_STORAGE_KEY = 'lazyuncle_recipients';

const defaultAutoSendPreferences = {
  enabled: DEFAULTS.AUTO_SEND_ENABLED,
  defaultBudget: DEFAULTS.BUDGET,
  requireApproval: DEFAULTS.REQUIRE_APPROVAL,
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

// Deep clean function to remove undefined values recursively (Firebase doesn't allow undefined)
const deepCleanUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepCleanUndefined(item)).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = deepCleanUndefined(value);
      }
    }
    return cleaned;
  }
  
  return obj;
};

export const useRecipientStore = create<RecipientState>((set, get) => ({
  recipients: [],
  loading: false,
  error: null,

  fetchRecipients: async () => {
    const user = useAuthStore.getState().user;
    const demoMode = useAuthStore.getState().demoMode;
    
    console.log('=== FETCH RECIPIENTS ===');
    console.log('Demo mode:', demoMode);
    console.log('Fetching recipients with user:', user?.id);
    
    set({ loading: true, error: null });
    
    try {
      if (demoMode) {
        // Handle demo mode
        const stored = localStorage.getItem(STORAGE_KEYS.RECIPIENTS);
        const recipients = stored ? JSON.parse(stored) : [];
        
        console.log('Demo recipients loaded from localStorage:', recipients.length);
        set({ 
          recipients, 
          loading: false 
        });
      } else {
        // Handle Firebase mode
        if (!user) {
          console.log('No user found, cannot fetch recipients');
          set({ loading: false });
          return;
        }
        
        console.log('Fetching recipients from Firebase for user:', user.id);
        const q = query(collection(db, COLLECTIONS.RECIPIENTS), where('userId', '==', user.id));
        const snapshot = await getDocs(q);
        const recipients: Recipient[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          recipients.push({
            id: doc.id,
            userId: data.userId,
            name: data.name,
            relationship: data.relationship,
            birthdate: data.birthdate,
            interests: data.interests || [],
            deliveryAddress: data.deliveryAddress,
            autoSendPreferences: ensureAutoSendPreferences(data.autoSendPreferences),
            createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().getTime() : data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().getTime() : data.updatedAt,
          });
        });
        
        console.log('Firebase recipients loaded:', recipients.length);
        set({ 
          recipients, 
          loading: false 
        });
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
      set({ 
        error: (error as Error).message,
        loading: false 
      });
    }
  },

  addRecipient: async (recipientData) => {
    const user = useAuthStore.getState().user;
    const demoMode = useAuthStore.getState().demoMode;
    
    console.log('=== ADD RECIPIENT ===');
    console.log('Adding recipient in mode:', demoMode ? 'demo' : 'firebase', 'User:', user?.id);
    console.log('RecipientStore - addRecipient called with data:', recipientData);
    console.log('RecipientStore - deliveryAddress in data:', recipientData.deliveryAddress);
    
    set({ loading: true, error: null });
    try {
      const timestamp = Timestamp.now();
      
      if (demoMode) {
        console.log('Creating demo recipient with data:', recipientData);
        // Handle demo mode recipient creation
        const newRecipient: Recipient = {
          id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: DEMO_USER_ID,
          ...recipientData,
          interests: recipientData.interests || [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        // Save to localStorage with consistent key
        const savedRecipients = localStorage.getItem(STORAGE_KEYS.RECIPIENTS);
        const existingRecipients = savedRecipients ? JSON.parse(savedRecipients) : [];
        const updatedRecipients = [...existingRecipients, newRecipient];
        localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(updatedRecipients));
        console.log('Saved to localStorage with key:', STORAGE_KEYS.RECIPIENTS);
        
        set(state => ({ 
          recipients: [...state.recipients, newRecipient],
          loading: false 
        }));
        
        console.log('Demo recipient created successfully:', newRecipient.id);
        return newRecipient;
      } else {
        // Normal Firebase mode
        if (!user) {
          throw new Error('User not authenticated');
        }
        // Validate required fields
        if (!recipientData.name || !recipientData.relationship) {
          throw new Error('Missing required recipient fields');
        }
        
        // Filter out undefined values for Firebase (Firebase doesn't allow undefined)
        const cleanedRecipientData = deepCleanUndefined(recipientData);
        
        console.log('Deep cleaned recipient data for Firebase:', cleanedRecipientData);
        
        const newRecipient = {
          ...cleanedRecipientData,
          userId: user.id,
          interests: recipientData.interests || [],
          createdAt: timestamp,
          updatedAt: timestamp
        };
        console.log('Writing recipient to Firestore:', newRecipient);
        const docRef = await addDoc(collection(db, COLLECTIONS.RECIPIENTS), newRecipient);
        const recipient: Recipient = {
          id: docRef.id,
          ...newRecipient,
          createdAt: timestamp.toDate().getTime(),
          updatedAt: timestamp.toDate().getTime()
        } as Recipient;
        set(state => ({ 
          recipients: [...state.recipients, recipient],
          loading: false 
        }));
        return recipient;
      }
    } catch (error) {
      console.error('Error adding recipient to Firestore:', error, recipientData);
      set({ error: `Failed to add recipient: ${(error as Error).message}. Check Firestore rules, config, and data structure.`, loading: false });
      return null;
    }
  },

  updateRecipient: async (id, recipientData) => {
    const demoMode = useAuthStore.getState().demoMode;
    
    console.log('=== UPDATE RECIPIENT ===');
    console.log('Recipient ID:', id);
    console.log('Update data:', recipientData);
    console.log('Demo mode:', demoMode);
    
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
          
          console.log('Updated recipients in demo mode:', updatedRecipients);
          
          // Save to localStorage
          localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(updatedRecipients));
          console.log('Recipients saved to localStorage');
          
          return {
            recipients: updatedRecipients,
            loading: false
          };
        });
      } else {
        // Handle Firebase mode update
        const user = useAuthStore.getState().user;
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Filter out undefined values for Firebase (Firebase doesn't allow undefined)
        const cleanedData = deepCleanUndefined(recipientData);
        
        console.log('Deep cleaned data for Firebase (removed undefined values recursively):', cleanedData);
        
        const docRef = doc(db, COLLECTIONS.RECIPIENTS, id);
        await updateDoc(docRef, {
          ...cleanedData,
          updatedAt: serverTimestamp()
        });
        
        // Update local state
        set(state => ({
          recipients: state.recipients.map(recipient => 
            recipient.id === id 
              ? { 
                  ...recipient, 
                  ...recipientData, 
                  updatedAt: Date.now() 
                } 
              : recipient
          ),
          loading: false
        }));
        
        console.log('Recipient updated in Firebase successfully');
      }
    } catch (error) {
      console.error('Error updating recipient:', error);
      set({ 
        error: (error as Error).message,
        loading: false 
      });
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
          localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(filteredRecipients));
          
          return {
            recipients: filteredRecipients,
            loading: false
          };
        });
        return;
      }
      
      // Normal Firebase mode
      await deleteDoc(doc(db, COLLECTIONS.RECIPIENTS, id));
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
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(updatedRecipients));
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
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(updatedRecipients));
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
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(updatedRecipients));
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
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(updatedRecipients));
      return { recipients: updatedRecipients };
    });
  },
  updateShippingAddress: async (id, address) => {
    set(state => {
      const updatedRecipients = state.recipients.map(recipient => {
        if (recipient.id !== id) return recipient;
        return {
          ...recipient,
          deliveryAddress: address
        } as Recipient;
      });
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(updatedRecipients));
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
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(updatedRecipients));
      return { recipients: updatedRecipients };
    });
  }
})); 