import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Gift, GiftSuggestion } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  getGifts, 
  getGift, 
  getGiftsByRecipient, 
  addGift, 
  updateGift, 
  deleteGift,
  getGiftSuggestions
} from '../services/giftService';

interface GiftState {
  gifts: Gift[];
  recipientGifts: { [recipientId: string]: Gift[] };
  selectedGift: Gift | null;
  giftSuggestions: GiftSuggestion[];
  loading: boolean;
  suggestionsLoading: boolean;
  error: string | null;
  
  // Actions
  fetchGifts: () => Promise<void>;
  fetchGift: (id: string) => Promise<void>;
  fetchGiftsByRecipient: (recipientId: string) => Promise<void>;
  createGift: (data: Omit<Gift, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Gift>;
  updateGift: (id: string, data: Partial<Gift>) => Promise<Gift>;
  removeGift: (id: string) => Promise<void>;
  fetchGiftSuggestions: (recipientId: string) => Promise<void>;
  clearSelectedGift: () => void;
  clearError: () => void;
  setGifts: (gifts: Gift[]) => void;
  
  // Aliases for test compatibility
  addGift: (data: Omit<Gift, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Gift>;
  deleteGift: (id: string) => Promise<void>;
  getGiftsByRecipient: (recipientId: string) => Gift[];
}

export const useGiftStore = create<GiftState>()(
  persist(
    (set, get) => ({
      gifts: [],
      recipientGifts: {},
      selectedGift: null,
      giftSuggestions: [],
      loading: false,
      suggestionsLoading: false,
      error: null,
      
      // Fetch all gifts
      fetchGifts: async () => {
        set({ loading: true, error: null });
        try {
          const gifts = await getGifts();
          set({ gifts, loading: false });
        } catch (error) {
          set({ 
            error: (error as Error).message, 
            loading: false 
          });
        }
      },
      
      // Fetch a single gift
      fetchGift: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const gift = await getGift(id);
          set({ selectedGift: gift, loading: false });
        } catch (error) {
          set({ 
            error: (error as Error).message, 
            loading: false 
          });
        }
      },
      
      // Fetch gifts for a specific recipient
      fetchGiftsByRecipient: async (recipientId: string) => {
        console.log('🎁 === FETCH GIFTS BY RECIPIENT START ===');
        console.log('🎁 Fetching gifts for recipient:', recipientId);
        
        set(state => ({ 
          loading: true, 
          error: null,
          // Keep other recipient gifts in the cache
          recipientGifts: {
            ...state.recipientGifts,
            [recipientId]: state.recipientGifts[recipientId] || []
          }
        }));
        
        try {
          const gifts = await getGiftsByRecipient(recipientId);
          console.log('🎁 Firebase returned gifts:', gifts.length);
          console.log('🎁 Gift details:', gifts.map(g => ({
            id: g.id,
            name: g.name,
            status: g.status,
            occasionId: g.occasionId,
            createdAt: g.createdAt
          })));
          
          set(state => ({ 
            recipientGifts: {
              ...state.recipientGifts,
              [recipientId]: gifts
            },
            loading: false 
          }));
          
          console.log('🎁 ✅ Gifts loaded into store for recipient:', recipientId);
          console.log('🎁 === FETCH GIFTS BY RECIPIENT END ===');
        } catch (error) {
          console.error('🎁 ❌ Error fetching gifts for recipient:', error);
          set({ 
            error: (error as Error).message, 
            loading: false 
          });
        }
      },
      
      // Create a new gift
      createGift: async (data) => {
        set({ loading: true, error: null });
        try {
          const newGift = await addGift(data);
          
          // Update both the main list and recipient-specific list
          set(state => {
            const updatedRecipientGifts = { ...state.recipientGifts };
            if (updatedRecipientGifts[data.recipientId]) {
              updatedRecipientGifts[data.recipientId] = [
                newGift,
                ...updatedRecipientGifts[data.recipientId]
              ];
            }
            
            return { 
              gifts: [newGift, ...state.gifts],
              recipientGifts: updatedRecipientGifts,
              loading: false 
            };
          });
          
          return newGift;
        } catch (error) {
          set({ 
            error: (error as Error).message, 
            loading: false 
          });
          throw error;
        }
      },
      
      // Update a gift
      updateGift: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const updatedGift = await updateGift(id, data);
          
          // Update in all relevant state objects
          set(state => {
            // Update main gifts list
            const updatedGifts = state.gifts.map(g => 
              g.id === id ? updatedGift : g
            );
            
            // Update recipient-specific list
            const updatedRecipientGifts = { ...state.recipientGifts };
            if (updatedRecipientGifts[updatedGift.recipientId]) {
              updatedRecipientGifts[updatedGift.recipientId] = 
                updatedRecipientGifts[updatedGift.recipientId].map(g => 
                  g.id === id ? updatedGift : g
                );
            }
            
            return { 
              gifts: updatedGifts,
              recipientGifts: updatedRecipientGifts,
              selectedGift: state.selectedGift?.id === id 
                ? updatedGift 
                : state.selectedGift,
              loading: false 
            };
          });
          
          return updatedGift;
        } catch (error) {
          set({ 
            error: (error as Error).message, 
            loading: false 
          });
          throw error;
        }
      },
      
      // Delete a gift
      removeGift: async (id) => {
        set({ loading: true, error: null });
        try {
          // Look for the gift in both the main list and recipient-specific lists
          let giftToDelete = get().gifts.find(g => g.id === id);
          
          if (!giftToDelete) {
            // Look in recipient-specific lists
            const { recipientGifts } = get();
            for (const recipientId in recipientGifts) {
              const found = recipientGifts[recipientId].find(g => g.id === id);
              if (found) {
                giftToDelete = found;
                break;
              }
            }
          }
          
          if (!giftToDelete) {
            throw new Error('Gift not found');
          }
          
          await deleteGift(id);
          
          // Remove from all state lists
          set(state => {
            // Remove from main gifts list
            const updatedGifts = state.gifts.filter(g => g.id !== id);
            
            // Remove from recipient-specific list
            const updatedRecipientGifts = { ...state.recipientGifts };
            if (updatedRecipientGifts[giftToDelete.recipientId]) {
              updatedRecipientGifts[giftToDelete.recipientId] = 
                updatedRecipientGifts[giftToDelete.recipientId].filter(g => g.id !== id);
            }
            
            return { 
              gifts: updatedGifts,
              recipientGifts: updatedRecipientGifts,
              selectedGift: state.selectedGift?.id === id ? null : state.selectedGift,
              loading: false 
            };
          });
        } catch (error) {
          set({ 
            error: (error as Error).message, 
            loading: false 
          });
          throw error;
        }
      },
      
      // Fetch gift suggestions for a recipient
      fetchGiftSuggestions: async (recipientId) => {
        set({ suggestionsLoading: true, error: null });
        try {
          const suggestions = await getGiftSuggestions(recipientId);
          set({ giftSuggestions: suggestions, suggestionsLoading: false });
        } catch (error) {
          set({ 
            error: (error as Error).message, 
            suggestionsLoading: false 
          });
        }
      },
      
      // Clear the selected gift
      clearSelectedGift: () => {
        set({ selectedGift: null });
      },
      
      // Clear any error
      clearError: () => {
        set({ error: null });
      },
      
      // Set gifts
      setGifts: (gifts: Gift[]) => {
        set({ gifts });
      },
      
      // Aliases for test compatibility
      addGift: async (data) => {
        set({ loading: true, error: null });
        try {
          const newGift = await addGift(data);
          
          // Update both the main list and recipient-specific list
          set(state => {
            const updatedRecipientGifts = { ...state.recipientGifts };
            if (updatedRecipientGifts[data.recipientId]) {
              updatedRecipientGifts[data.recipientId] = [
                newGift,
                ...updatedRecipientGifts[data.recipientId]
              ];
            }
            
            return { 
              gifts: [newGift, ...state.gifts],
              recipientGifts: updatedRecipientGifts,
              loading: false 
            };
          });
          
          return newGift;
        } catch (error) {
          set({ 
            error: (error as Error).message, 
            loading: false 
          });
          throw error;
        }
      },
      
      deleteGift: async (id) => {
        set({ loading: true, error: null });
        try {
          await deleteGift(id);
          
          // Remove from all state lists
          set(state => {
            // Remove from main gifts list
            const updatedGifts = state.gifts.filter(g => g.id !== id);
            
            // Remove from recipient-specific list
            const updatedRecipientGifts = { ...state.recipientGifts };
            if (updatedRecipientGifts[id]) {
              updatedRecipientGifts[id] = [];
            }
            
            return { 
              gifts: updatedGifts,
              recipientGifts: updatedRecipientGifts,
              selectedGift: state.selectedGift?.id === id ? null : state.selectedGift,
              loading: false 
            };
          });
        } catch (error) {
          set({ 
            error: (error as Error).message, 
            loading: false 
          });
          throw error;
        }
      },
      
      getGiftsByRecipient: (recipientId) => {
        const state = get();
        // Return cached gifts if available
        if (state.recipientGifts[recipientId]) {
          return state.recipientGifts[recipientId];
        }
        // Otherwise return empty array
        return [];
      }
    }),
    {
      name: 'lazyuncle-gifts',
    }
  )
); 