import { useState, useEffect } from 'react';
import { useRecipientStore } from '../store/recipientStore';
import { useOccasionStore } from '../store/occasionStore';
import { AdminService, type AdminOrder } from '../services/adminService';

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

const STORAGE_KEY = 'lazyuncle_gift_storage';

export function useGiftStorage() {
  const [storage, setStorage] = useState<GiftStorage>({
    selectedGifts: [],
    savedGifts: [],
    recentRecommendations: {}
  });
  
  const [isLoaded, setIsLoaded] = useState(false);

  // Access to stores for getting real data
  const { recipients } = useRecipientStore();
  const { occasions } = useOccasionStore();

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStorage(parsed);
      } catch (error) {
        console.error('Error parsing stored gift data:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever storage changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    }
  }, [storage, isLoaded]); // Add isLoaded as dependency

  // Helper function to format address for admin orders
  const formatAddress = (address: any): string => {
    if (!address) return 'No address provided';
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const selectGift = async (gift: any, recipientId: string, occasionId: string) => {
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
      // Get user info from auth store
      const user = JSON.parse(localStorage.getItem('lazyuncle_auth') || '{}').user;
      
      if (user) {
        // Find real recipient and occasion data
        const recipient = recipients.find(r => r.id === recipientId);
        const recipientOccasions = occasions[recipientId] || [];
        const occasion = recipientOccasions.find(o => o.id === occasionId);

        // Create admin order for selected gift with real data
        const adminOrder: AdminOrder = {
          id: `selected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          // Customer Info (who pays)
          customerId: user.id,
          customerName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
          customerEmail: user.email || '',
          customerPlan: user.planId || 'free',
          // Recipient Info (who receives) - use real data if available
          recipientName: recipient?.name || `Recipient ${recipientId}`,
          recipientAddress: recipient?.deliveryAddress ? formatAddress(recipient.deliveryAddress) : 'Address to be confirmed',
          // Order Details - use real data if available
          occasionName: occasion?.name || `Occasion ${occasionId}`,
          occasionDate: occasion?.date || new Date().toISOString().split('T')[0],
          giftName: gift.name,
          giftPrice: gift.price,
          giftUrl: gift.purchaseUrl,
          giftASIN: gift.asin,
          status: 'pending' as const,
          orderDate: Date.now(),
          amazonOrderId: undefined,
          trackingNumber: undefined,
          notes: `User selected gift: ${gift.reasoning || 'No reasoning provided'}${occasion?.notes ? ` | Occasion notes: ${occasion.notes}` : ''}`,
          giftWrap: occasion?.giftWrap || false,
          personalNote: occasion?.noteText || undefined,
          // Billing
          billingStatus: 'pending' as const,
          chargeAmount: gift.price,
          // Additional tracking fields
          source: 'gift_selection',
          recipientId: recipientId,
          occasionId: occasionId
        };

        // Use AdminService to add the order to Firebase/global admin queue
        await AdminService.addOrder(adminOrder); // Now async
        console.log('📋 Added admin order via Firebase/AdminService:', adminOrder.id);
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