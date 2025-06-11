import { useState, useEffect } from 'react';
import { useRecipientStore } from '../store/recipientStore';
import { useOccasionStore } from '../store/occasionStore';
import { useAuthStore } from '../store/authStore';
import AdminService from '../services/adminService';
import type { AdminOrder } from '../types';

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
  }, [storage, isLoaded]);

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
    console.log('🎁 Gift selected:', {
      giftId: gift.id,
      giftName: gift.name,
      recipientId,
      occasionId
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

    setStorage(prev => ({
      ...prev,
      selectedGifts: [...prev.selectedGifts.filter(g => g.id !== gift.id), storedGift]
    }));

    // Create admin order for the selected gift
    try {
      const { user } = useAuthStore.getState();
      
      if (user) {
        // Find real recipient and occasion data
        const recipient = recipients.find(r => r.id === recipientId);
        const recipientOccasions = occasions[recipientId] || [];
        const occasion = recipientOccasions.find(o => o.id === occasionId);

        // Create admin order with all required fields
        const adminOrder: Omit<AdminOrder, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: user.id,
          userEmail: user.email || '',
          userName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
          recipientName: recipient?.name || `Recipient ${recipientId}`,
          recipientRelationship: recipient?.relationship || 'Unknown',
          occasion: occasion?.name || `Occasion ${occasionId}`,
          giftTitle: gift.name,
          giftDescription: gift.description || '',
          giftPrice: gift.price,
          giftImageUrl: gift.imageUrl || '',
          asin: gift.asin,
          status: 'pending',
          priority: 'normal',
          notes: gift.reasoning || 'User selected gift',
          shippingAddress: {
            name: recipient?.name || 'Unknown',
            street: recipient?.deliveryAddress?.line1 || 'Address TBD',
            city: recipient?.deliveryAddress?.city || 'City TBD',
            state: recipient?.deliveryAddress?.state || 'State TBD',
            zipCode: recipient?.deliveryAddress?.postalCode || 'ZIP TBD',
            country: recipient?.deliveryAddress?.country || 'US'
          },
          giftUrl: gift.purchaseUrl,
          occasionDate: occasion?.date,
          source: 'gift_selection',
          giftWrap: occasion?.giftWrap || false,
          personalNote: occasion?.noteText
        };

        // Add to admin orders via AdminService
        await AdminService.addOrder(adminOrder);
        console.log('✅ Admin order created for selected gift');
      } else {
        console.warn('⚠️ No authenticated user - cannot create admin order');
      }
    } catch (error) {
      console.error('❌ Error creating admin order:', error);
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
        gift.id === giftId ? { ...gift, status: 'purchased' as const } : gift
      )
    }));
  };

  const saveRecommendations = (recommendations: any[], recipientId: string, occasionId: string) => {
    const key = `${recipientId}-${occasionId}`;
    setStorage(prev => ({
      ...prev,
      recentRecommendations: {
        ...prev.recentRecommendations,
        [key]: recommendations
      }
    }));
  };

  const getRecommendations = (recipientId: string, occasionId: string) => {
    const key = `${recipientId}-${occasionId}`;
    return storage.recentRecommendations[key] || [];
  };

  const getSelectedGiftsForOccasion = (recipientId: string, occasionId: string) => {
    return storage.selectedGifts.filter(gift => 
      gift.recipientId === recipientId && gift.occasionId === occasionId
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
  };

  return {
    storage,
    selectGift,
    saveForLater,
    removeGift,
    markAsPurchased,
    saveRecommendations,
    getRecommendations,
    getSelectedGiftsForOccasion,
    getSavedGiftsForRecipient,
    clearStorage,
    isLoaded
  };
} 