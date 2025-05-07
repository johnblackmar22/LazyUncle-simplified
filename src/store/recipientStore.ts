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
import { Recipient, RecipientAutoSendPreferences, OccasionPreference, Address } from '../types';
import { useAuthStore } from './authStore';

interface RecipientState {
  recipients: Recipient[];
  loading: boolean;
  error: string | null;
  fetchRecipients: () => Promise<void>;
  addRecipient: (recipient: Omit<Recipient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecipient: (id: string, recipientData: Partial<Recipient>) => Promise<void>;
  deleteRecipient: (id: string) => Promise<void>;
  resetError: () => void;
  
  // Auto-send related functions
  toggleAutoSend: (recipientId: string, enabled: boolean) => Promise<void>;
  updateAutoSendPreferences: (recipientId: string, preferences: Partial<RecipientAutoSendPreferences>) => Promise<void>;
  setDefaultBudget: (recipientId: string, budget: number) => Promise<void>;
  toggleOccasionAutoSend: (recipientId: string, occasion: string, enabled: boolean) => Promise<void>;
  updateOccasionPreference: (recipientId: string, occasion: string, preference: Partial<OccasionPreference>) => Promise<void>;
  addCustomOccasion: (recipientId: string, occasionName: string, preference: OccasionPreference) => Promise<void>;
  removeCustomOccasion: (recipientId: string, occasionName: string) => Promise<void>;
  updatePaymentMethod: (recipientId: string, type: 'creditCard' | 'paypal' | 'other', details: Record<string, any>) => Promise<void>;
  updateShippingAddress: (recipientId: string, shippingAddress: Address) => Promise<void>;
  toggleApprovalRequirement: (recipientId: string, requireApproval: boolean) => Promise<void>;
}

export const useRecipientStore = create<RecipientState>((set, get) => ({
  recipients: [],
  loading: false,
  error: null,

  fetchRecipients: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ loading: true, error: null });
    try {
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
          autoSendPreferences: data.autoSendPreferences,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        });
      });
      
      set({ recipients: recipientsData, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addRecipient: async (recipientData) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ loading: true, error: null });
    try {
      const timestamp = Timestamp.now();
      const newRecipient = {
        ...recipientData,
        userId: user.id,
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
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateRecipient: async (id, recipientData) => {
    set({ loading: true, error: null });
    try {
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
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteRecipient: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'recipients', id));
      set(state => ({
        recipients: state.recipients.filter(recipient => recipient.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Auto-send related functions
  toggleAutoSend: async (recipientId, enabled) => {
    const recipient = get().recipients.find(r => r.id === recipientId);
    if (!recipient) return;

    const autoSendPreferences = recipient.autoSendPreferences || {
      enabled: false,
      defaultBudget: 50, // Default budget amount
      occasions: {},
      requireApproval: true
    };

    return get().updateAutoSendPreferences(recipientId, {
      ...autoSendPreferences,
      enabled
    });
  },

  updateAutoSendPreferences: async (recipientId, preferences) => {
    const recipient = get().recipients.find(r => r.id === recipientId);
    if (!recipient) return;

    const currentPreferences = recipient.autoSendPreferences || {
      enabled: false,
      defaultBudget: 50,
      occasions: {},
      requireApproval: true
    };

    const updatedPreferences = {
      ...currentPreferences,
      ...preferences
    };

    return get().updateRecipient(recipientId, {
      autoSendPreferences: updatedPreferences
    });
  },

  setDefaultBudget: async (recipientId, budget) => {
    const recipient = get().recipients.find(r => r.id === recipientId);
    if (!recipient) return;

    const autoSendPreferences = recipient.autoSendPreferences || {
      enabled: false,
      defaultBudget: 50,
      occasions: {},
      requireApproval: true
    };

    return get().updateAutoSendPreferences(recipientId, {
      ...autoSendPreferences,
      defaultBudget: budget
    });
  },

  toggleOccasionAutoSend: async (recipientId, occasion, enabled) => {
    const recipient = get().recipients.find(r => r.id === recipientId);
    if (!recipient) return;

    const autoSendPreferences = recipient.autoSendPreferences || {
      enabled: false,
      defaultBudget: 50,
      occasions: {},
      requireApproval: true
    };

    // Standard occasions (birthday, christmas, anniversary)
    if (['birthday', 'christmas', 'anniversary'].includes(occasion)) {
      const currentOccasion = autoSendPreferences.occasions[occasion as keyof typeof autoSendPreferences.occasions] || {
        enabled: false,
        budget: autoSendPreferences.defaultBudget,
        leadTime: 7
      };

      const updatedOccasions = {
        ...autoSendPreferences.occasions,
        [occasion]: {
          ...currentOccasion,
          enabled
        }
      };

      return get().updateAutoSendPreferences(recipientId, {
        ...autoSendPreferences,
        occasions: updatedOccasions
      });
    }
    // Custom occasions
    else {
      const customOccasions = autoSendPreferences.occasions.custom || {};
      const currentOccasion = customOccasions[occasion] || {
        enabled: false,
        budget: autoSendPreferences.defaultBudget,
        leadTime: 7
      };

      const updatedCustomOccasions = {
        ...customOccasions,
        [occasion]: {
          ...currentOccasion,
          enabled
        }
      };

      const updatedOccasions = {
        ...autoSendPreferences.occasions,
        custom: updatedCustomOccasions
      };

      return get().updateAutoSendPreferences(recipientId, {
        ...autoSendPreferences,
        occasions: updatedOccasions
      });
    }
  },

  updateOccasionPreference: async (recipientId, occasion, preference) => {
    const recipient = get().recipients.find(r => r.id === recipientId);
    if (!recipient) return;

    const autoSendPreferences = recipient.autoSendPreferences || {
      enabled: false,
      defaultBudget: 50,
      occasions: {},
      requireApproval: true
    };

    // Standard occasions (birthday, christmas, anniversary)
    if (['birthday', 'christmas', 'anniversary'].includes(occasion)) {
      const currentOccasion = autoSendPreferences.occasions[occasion as keyof typeof autoSendPreferences.occasions] || {
        enabled: false,
        budget: autoSendPreferences.defaultBudget,
        leadTime: 7
      };

      const updatedOccasions = {
        ...autoSendPreferences.occasions,
        [occasion]: {
          ...currentOccasion,
          ...preference
        }
      };

      return get().updateAutoSendPreferences(recipientId, {
        ...autoSendPreferences,
        occasions: updatedOccasions
      });
    }
    // Custom occasions
    else {
      const customOccasions = autoSendPreferences.occasions.custom || {};
      const currentOccasion = customOccasions[occasion] || {
        enabled: false,
        budget: autoSendPreferences.defaultBudget,
        leadTime: 7
      };

      const updatedCustomOccasions = {
        ...customOccasions,
        [occasion]: {
          ...currentOccasion,
          ...preference
        }
      };

      const updatedOccasions = {
        ...autoSendPreferences.occasions,
        custom: updatedCustomOccasions
      };

      return get().updateAutoSendPreferences(recipientId, {
        ...autoSendPreferences,
        occasions: updatedOccasions
      });
    }
  },

  addCustomOccasion: async (recipientId, occasionName, preference) => {
    const recipient = get().recipients.find(r => r.id === recipientId);
    if (!recipient) return;

    const autoSendPreferences = recipient.autoSendPreferences || {
      enabled: false,
      defaultBudget: 50,
      occasions: {},
      requireApproval: true
    };

    const customOccasions = autoSendPreferences.occasions.custom || {};
    const updatedCustomOccasions = {
      ...customOccasions,
      [occasionName]: preference
    };

    const updatedOccasions = {
      ...autoSendPreferences.occasions,
      custom: updatedCustomOccasions
    };

    return get().updateAutoSendPreferences(recipientId, {
      ...autoSendPreferences,
      occasions: updatedOccasions
    });
  },

  removeCustomOccasion: async (recipientId, occasionName) => {
    const recipient = get().recipients.find(r => r.id === recipientId);
    if (!recipient || !recipient.autoSendPreferences?.occasions.custom) return;

    const customOccasions = {...recipient.autoSendPreferences.occasions.custom};
    delete customOccasions[occasionName];

    const updatedOccasions = {
      ...recipient.autoSendPreferences.occasions,
      custom: customOccasions
    };

    return get().updateAutoSendPreferences(recipientId, {
      ...recipient.autoSendPreferences,
      occasions: updatedOccasions
    });
  },

  updatePaymentMethod: async (recipientId, type, details) => {
    const recipient = get().recipients.find(r => r.id === recipientId);
    if (!recipient) return;

    const autoSendPreferences = recipient.autoSendPreferences || {
      enabled: false,
      defaultBudget: 50,
      occasions: {},
      requireApproval: true
    };

    return get().updateAutoSendPreferences(recipientId, {
      ...autoSendPreferences,
      paymentMethod: {
        type,
        details
      }
    });
  },

  updateShippingAddress: async (recipientId, shippingAddress) => {
    const recipient = get().recipients.find(r => r.id === recipientId);
    if (!recipient) return;

    const autoSendPreferences = recipient.autoSendPreferences || {
      enabled: false,
      defaultBudget: 50,
      occasions: {},
      requireApproval: true
    };

    return get().updateAutoSendPreferences(recipientId, {
      ...autoSendPreferences,
      shippingAddress
    });
  },

  toggleApprovalRequirement: async (recipientId, requireApproval) => {
    const recipient = get().recipients.find(r => r.id === recipientId);
    if (!recipient) return;

    const autoSendPreferences = recipient.autoSendPreferences || {
      enabled: false,
      defaultBudget: 50,
      occasions: {},
      requireApproval: true
    };

    return get().updateAutoSendPreferences(recipientId, {
      ...autoSendPreferences,
      requireApproval
    });
  },

  resetError: () => set({ error: null })
})); 