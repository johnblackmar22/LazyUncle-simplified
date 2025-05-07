import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Gift, GiftSuggestion } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  getGifts, 
  getGift, 
  getGiftsByRecipient, 
  getAutoSendGifts,
  addGift, 
  updateGift, 
  deleteGift,
  scheduleAutoSend,
  cancelAutoSend,
  getGiftSuggestions
} from '../services/giftService';

interface GiftState {
  gifts: Gift[];
  recipientGifts: { [recipientId: string]: Gift[] };
  autoSendGifts: Gift[];
  selectedGift: Gift | null;
  giftSuggestions: GiftSuggestion[];
  loading: boolean;
  suggestionsLoading: boolean;
  error: string | null;
  
  // Actions
  fetchGifts: () => Promise<void>;
  fetchGift: (id: string) => Promise<void>;
  fetchGiftsByRecipient: (recipientId: string) => Promise<void>;
  fetchAutoSendGifts: () => Promise<void>;
  createGift: (data: Omit<Gift, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Gift>;
  updateGift: (id: string, data: Partial<Gift>) => Promise<Gift>;
  removeGift: (id: string) => Promise<void>;
  scheduleAutoSend: (id: string, sendDate: string) => Promise<Gift>;
  cancelAutoSend: (id: string) => Promise<Gift>;
  fetchGiftSuggestions: (recipientId: string) => Promise<void>;
  clearSelectedGift: () => void;
  clearError: () => void;
}

export const useGiftStore = create<GiftState>()(
  persist(
    (set, get) => ({
      gifts: [],
      recipientGifts: {},
      autoSendGifts: [],
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
          set(state => ({ 
            recipientGifts: {
              ...state.recipientGifts,
              [recipientId]: gifts
            },
            loading: false 
          }));
        } catch (error) {
          set({ 
            error: (error as Error).message, 
            loading: false 
          });
        }
      },
      
      // Fetch auto-send gifts
      fetchAutoSendGifts: async () => {
        set({ loading: true, error: null });
        try {
          const autoSendGifts = await getAutoSendGifts();
          set({ autoSendGifts, loading: false });
        } catch (error) {
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
            
            // Update auto-send list if needed
            let updatedAutoSendGifts = [...state.autoSendGifts];
            if (updatedGift.autoSend) {
              // If it's now auto-send and not in the list, add it
              if (!updatedAutoSendGifts.some(g => g.id === id)) {
                updatedAutoSendGifts.push(updatedGift);
              } else {
                // Update existing entry
                updatedAutoSendGifts = updatedAutoSendGifts.map(g =>
                  g.id === id ? updatedGift : g
                );
              }
            } else {
              // If auto-send is turned off, remove from list
              updatedAutoSendGifts = updatedAutoSendGifts.filter(g => g.id !== id);
            }
            
            return { 
              gifts: updatedGifts,
              recipientGifts: updatedRecipientGifts,
              autoSendGifts: updatedAutoSendGifts,
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
          const giftToDelete = get().gifts.find(g => g.id === id);
          
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
            
            // Remove from auto-send list if present
            const updatedAutoSendGifts = state.autoSendGifts.filter(g => g.id !== id);
            
            return { 
              gifts: updatedGifts,
              recipientGifts: updatedRecipientGifts,
              autoSendGifts: updatedAutoSendGifts,
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
      
      // Schedule a gift for auto-send
      scheduleAutoSend: async (id, sendDate) => {
        set({ loading: true, error: null });
        try {
          const updatedGift = await scheduleAutoSend(id, sendDate);
          
          // Update the gift in all state objects
          set(state => {
            const updatedGifts = state.gifts.map(g => 
              g.id === id ? updatedGift : g
            );
            
            const updatedRecipientGifts = { ...state.recipientGifts };
            if (updatedRecipientGifts[updatedGift.recipientId]) {
              updatedRecipientGifts[updatedGift.recipientId] = 
                updatedRecipientGifts[updatedGift.recipientId].map(g => 
                  g.id === id ? updatedGift : g
                );
            }
            
            // Add to auto-send list if not already present
            let updatedAutoSendGifts = [...state.autoSendGifts];
            if (!updatedAutoSendGifts.some(g => g.id === id)) {
              updatedAutoSendGifts.push(updatedGift);
            } else {
              updatedAutoSendGifts = updatedAutoSendGifts.map(g =>
                g.id === id ? updatedGift : g
              );
            }
            
            return { 
              gifts: updatedGifts,
              recipientGifts: updatedRecipientGifts,
              autoSendGifts: updatedAutoSendGifts,
              selectedGift: state.selectedGift?.id === id ? updatedGift : state.selectedGift,
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
      
      // Cancel auto-send for a gift
      cancelAutoSend: async (id) => {
        set({ loading: true, error: null });
        try {
          const updatedGift = await cancelAutoSend(id);
          
          // Update the gift in all state objects
          set(state => {
            const updatedGifts = state.gifts.map(g => 
              g.id === id ? updatedGift : g
            );
            
            const updatedRecipientGifts = { ...state.recipientGifts };
            if (updatedRecipientGifts[updatedGift.recipientId]) {
              updatedRecipientGifts[updatedGift.recipientId] = 
                updatedRecipientGifts[updatedGift.recipientId].map(g => 
                  g.id === id ? updatedGift : g
                );
            }
            
            // Remove from auto-send list
            const updatedAutoSendGifts = state.autoSendGifts.filter(g => g.id !== id);
            
            return { 
              gifts: updatedGifts,
              recipientGifts: updatedRecipientGifts,
              autoSendGifts: updatedAutoSendGifts,
              selectedGift: state.selectedGift?.id === id ? updatedGift : state.selectedGift,
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
      }
    }),
    {
      name: 'lazyuncle-gifts',
    }
  )
); 