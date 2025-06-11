import { useState, useEffect } from 'react';
import { useRecipientStore } from '../store/recipientStore';
import { useOccasionStore } from '../store/occasionStore';
import { useAuthStore } from '../store/authStore';
import { addGift } from '../services/giftService';
import AdminService from '../services/adminService';
import type { AdminOrder, Gift } from '../types';
import { useToast } from '@chakra-ui/react';

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

  const toast = useToast();

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
    console.log('🎁 Gift selected - Creating proper Gift entity first:', {
      giftId: gift.id,
      giftName: gift.name,
      recipientId,
      occasionId,
      userState: useAuthStore.getState()
    });
    
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        console.error('⚠️ CRITICAL: No authenticated user - cannot create gift');
        toast({
          title: 'Not Authenticated',
          description: 'You must be logged in to select a gift.',
          status: 'error',
          duration: 6000,
          isClosable: true,
        });
        throw new Error('User not authenticated');
      }

      console.log('✅ User authenticated:', {
        userId: user.id,
        userEmail: user.email,
        userDisplayName: user.displayName
      });

      // Find real recipient and occasion data
      const recipient = recipients.find(r => r.id === recipientId);
      const recipientOccasions = occasions[recipientId] || [];
      const occasion = recipientOccasions.find(o => o.id === occasionId);

      console.log('🔍 Found recipient and occasion data:', {
        recipient: recipient ? { id: recipient.id, name: recipient.name } : 'NOT FOUND',
        occasion: occasion ? { id: occasion.id, name: occasion.name } : 'NOT FOUND',
        availableRecipients: recipients.length,
        availableOccasions: recipientOccasions.length
      });

      // 1. FIRST: Create proper Gift entity in Firebase
      const giftData: Omit<Gift, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        recipientId,
        name: gift.name,
        description: gift.description || '',
        price: gift.price,
        category: gift.category,
        occasionId,
        date: occasion ? new Date(occasion.date).getTime() : Date.now(),
        status: 'selected',
        imageUrl: gift.imageUrl,
        purchaseUrl: gift.purchaseUrl,
        asin: gift.asin,
        notes: gift.reasoning || 'AI recommended gift',
        recurring: false
      };

      console.log('🎁 Creating Gift entity in Firebase with data:', giftData);
      const createdGift = await addGift(giftData);
      console.log('✅ Gift entity created successfully with ID:', createdGift.id);

      // 2. THEN: Create AdminOrder that references the Gift
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
        notes: `Gift ID: ${createdGift.id} | ${gift.reasoning || 'User selected gift'}`,
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

      console.log('📋 Attempting to create AdminOrder for user gift selection...');
      try {
        const orderId = await AdminService.addOrder(adminOrder);
        console.log('✅ AdminOrder created successfully with ID:', orderId);
        toast({
          title: 'Order Created',
          description: 'Your gift selection has been sent to the admin for processing.',
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      } catch (adminOrderError: any) {
        console.error('❌ CRITICAL: Failed to create AdminOrder:', adminOrderError);
        toast({
          title: 'Order Creation Failed',
          description: adminOrderError instanceof Error ? adminOrderError.message : String(adminOrderError),
          status: 'error',
          duration: 6000,
          isClosable: true,
        });
        throw adminOrderError;
      }

      // 3. Update localStorage tracking
      const storedGift: StoredGift = {
        id: createdGift.id, // Use the actual Gift ID from Firebase
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

      console.log('🎉 COMPLETE GIFT SELECTION SUCCESS!', {
        giftId: createdGift.id,
        giftName: gift.name,
        recipientName: recipient?.name,
        occasionName: occasion?.name
      });

      return storedGift;
    } catch (error) {
      console.error('❌ CRITICAL ERROR in complete gift selection workflow:', error);
      toast({
        title: 'Gift Selection Failed',
        description: error instanceof Error ? error.message : String(error),
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
      throw error;
    }
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