import { useState, useEffect } from 'react';

export interface StoredGift {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  recipientId: string;
  occasionId: string;
  selectedAt: number;
  status: 'selected' | 'saved_for_later' | 'purchased';
  metadata?: {
    model?: string;
    confidence?: number;
    reasoning?: string;
    tags?: string[];
  };
}

export interface GiftStorage {
  selectedGifts: StoredGift[];
  savedGifts: StoredGift[];
  recentRecommendations: Record<string, any[]>; // Keyed by recipient+occasion
}

const STORAGE_KEY = 'lazyuncle_gifts';

export function useGiftStorage() {
  const [storage, setStorage] = useState<GiftStorage>({
    selectedGifts: [],
    savedGifts: [],
    recentRecommendations: {}
  });
  
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('Loading gift storage from localStorage:', saved ? 'found data' : 'no data');
      if (saved) {
        const parsed = JSON.parse(saved);
        const loadedStorage = {
          selectedGifts: parsed.selectedGifts || [],
          savedGifts: parsed.savedGifts || [],
          recentRecommendations: parsed.recentRecommendations || {}
        };
        console.log('Loaded storage:', {
          selectedGiftsCount: loadedStorage.selectedGifts.length,
          savedGiftsCount: loadedStorage.savedGifts.length,
          recommendationsCount: Object.keys(loadedStorage.recentRecommendations).length
        });
        setStorage(loadedStorage);
      }
    } catch (error) {
      console.error('Error loading gift storage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever storage changes, but only after initial load
  useEffect(() => {
    // Don't save during initial load to prevent overwriting existing data
    if (!isLoaded) return;
    
    try {
      const jsonString = JSON.stringify(storage);
      localStorage.setItem(STORAGE_KEY, jsonString);
      console.log('Saved gift storage to localStorage:', {
        selectedGiftsCount: storage.selectedGifts.length,
        savedGiftsCount: storage.savedGifts.length,
        storageSize: jsonString.length
      });
    } catch (error) {
      console.error('Error saving gift storage:', error);
    }
  }, [storage, isLoaded]); // Add isLoaded as dependency

  const selectGift = (gift: any, recipientId: string, occasionId: string) => {
    console.log('selectGift called with:', {
      giftId: gift.id,
      giftName: gift.name,
      recipientId,
      occasionId,
      currentSelectedCount: storage.selectedGifts.length
    });
    
    const storedGift: StoredGift = {
      id: gift.id,
      name: gift.name,
      description: gift.description,
      price: gift.price,
      category: gift.category,
      recipientId,
      occasionId,
      selectedAt: Date.now(),
      status: 'selected',
      metadata: {
        model: gift.metadata?.model,
        confidence: gift.confidence,
        reasoning: gift.reasoning,
        tags: gift.tags
      }
    };

    console.log('Creating stored gift:', storedGift);

    setStorage(prev => {
      const newSelectedGifts = [...prev.selectedGifts.filter(g => g.id !== gift.id), storedGift];
      console.log('Updating selected gifts:', {
        previousCount: prev.selectedGifts.length,
        newCount: newSelectedGifts.length,
        removedExisting: prev.selectedGifts.some(g => g.id === gift.id)
      });
      
      return {
        ...prev,
        selectedGifts: newSelectedGifts
      };
    });

    // ALSO create an admin order entry for the selected gift
    try {
      // Get user info from auth store (assuming it's available globally)
      const user = JSON.parse(localStorage.getItem('lazyuncle_auth') || '{}').user;
      
      if (user) {
        // Create admin order for selected gift
        const adminOrder = {
          id: `selected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          // Customer Info (who pays)
          customerId: user.id,
          customerName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
          customerEmail: user.email || '',
          customerPlan: user.planId || 'free',
          // Recipient Info (we'll need to fetch this)
          recipientName: `Recipient ${recipientId}`, // Will be updated with real name
          recipientAddress: 'Address to be confirmed',
          // Order Details  
          occasionName: `Occasion ${occasionId}`, // Will be updated with real occasion
          occasionDate: new Date().toISOString().split('T')[0], // Default to today
          giftName: gift.name,
          giftPrice: gift.price,
          giftUrl: gift.purchaseUrl,
          giftASIN: gift.asin,
          status: 'pending' as const,
          orderDate: Date.now(),
          amazonOrderId: undefined,
          trackingNumber: undefined,
          notes: `User selected gift: ${gift.reasoning || 'No reasoning provided'}`,
          giftWrap: false, // Default
          personalNote: undefined,
          // Billing
          billingStatus: 'pending' as const,
          chargeAmount: gift.price,
          // New field to track this is a selected gift (not ordered yet)
          source: 'gift_selection'
        };

        // Save to admin orders
        const existingOrders = localStorage.getItem('admin_pending_orders');
        const orders = existingOrders ? JSON.parse(existingOrders) : [];
        
        // Remove any existing order for the same gift to prevent duplicates
        const filteredOrders = orders.filter((order: any) => 
          !(order.recipientId === recipientId && order.occasionId === occasionId && order.giftName === gift.name)
        );
        
        filteredOrders.push(adminOrder);
        localStorage.setItem('admin_pending_orders', JSON.stringify(filteredOrders));
        
        console.log('📋 Created admin order for selected gift:', adminOrder.id);
      }
    } catch (error) {
      console.error('Error creating admin order for selected gift:', error);
    }

    return storedGift;
  };

  const saveForLater = (gift: any, recipientId: string, occasionId: string) => {
    const storedGift: StoredGift = {
      id: gift.id,
      name: gift.name,
      description: gift.description,
      price: gift.price,
      category: gift.category,
      recipientId,
      occasionId,
      selectedAt: Date.now(),
      status: 'saved_for_later',
      metadata: {
        model: gift.metadata?.model,
        confidence: gift.confidence,
        reasoning: gift.reasoning,
        tags: gift.tags
      }
    };

    setStorage(prev => ({
      ...prev,
      savedGifts: [...prev.savedGifts.filter(g => g.id !== gift.id), storedGift]
    }));

    return storedGift;
  };

  const removeGift = (giftId: string, type: 'selected' | 'saved') => {
    setStorage(prev => ({
      ...prev,
      [type === 'selected' ? 'selectedGifts' : 'savedGifts']: 
        prev[type === 'selected' ? 'selectedGifts' : 'savedGifts'].filter(g => g.id !== giftId)
    }));
  };

  const markAsPurchased = (giftId: string) => {
    setStorage(prev => ({
      ...prev,
      selectedGifts: prev.selectedGifts.map(gift => 
        gift.id === giftId ? { ...gift, status: 'purchased' } : gift
      )
    }));
  };

  const saveRecommendations = (recommendations: any[], recipientId: string, occasionId: string) => {
    const key = `${recipientId}_${occasionId}`;
    setStorage(prev => ({
      ...prev,
      recentRecommendations: {
        ...prev.recentRecommendations,
        [key]: recommendations
      }
    }));
  };

  const getRecommendations = (recipientId: string, occasionId: string) => {
    const key = `${recipientId}_${occasionId}`;
    return storage.recentRecommendations[key] || [];
  };

  const getSelectedGiftsForOccasion = (recipientId: string, occasionId: string) => {
    return storage.selectedGifts.filter(
      gift => gift.recipientId === recipientId && gift.occasionId === occasionId
    );
  };

  const getSavedGiftsForRecipient = (recipientId: string) => {
    return storage.savedGifts.filter(gift => gift.recipientId === recipientId);
  };

  const clearStorage = () => {
    setStorage({
      selectedGifts: [],
      savedGifts: [],
      recentRecommendations: {}
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateGiftWithFirebaseId = (localId: string, firebaseId: string) => {
    setStorage(prev => {
      const updatedSelectedGifts = prev.selectedGifts.map(gift =>
        gift.id === localId ? { ...gift, id: firebaseId } : gift
      );
      return {
        ...prev,
        selectedGifts: updatedSelectedGifts
      };
    });
  };

  return {
    // State
    selectedGifts: storage.selectedGifts,
    savedGifts: storage.savedGifts,
    isLoaded,
    
    // Actions
    selectGift,
    saveForLater,
    removeGift,
    markAsPurchased,
    saveRecommendations,
    updateGiftWithFirebaseId,
    
    // Getters
    getRecommendations,
    getSelectedGiftsForOccasion,
    getSavedGiftsForRecipient,
    
    // Utils
    clearStorage
  };
} 