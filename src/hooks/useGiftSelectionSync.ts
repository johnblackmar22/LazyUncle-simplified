import { useEffect, useCallback, useState } from 'react';
import { useGiftStorage } from './useGiftStorage';
import { useGiftStore } from '../store/giftStore';
import type { Gift } from '../types';
import type { EnhancedGiftSuggestion } from '../services/giftRecommendationEngine';

interface SyncOptions {
  recipientId: string;
  occasionId: string;
  autoSync?: boolean;
}

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: number | null;
  conflicts: Array<{
    localGift: any;
    firebaseGift: Gift;
    resolved: boolean;
  }>;
}

/**
 * Hook to manage synchronization between localStorage gift storage and Firebase
 * Resolves conflicts and ensures persistence across sessions
 */
export function useGiftSelectionSync({ recipientId, occasionId, autoSync = true }: SyncOptions) {
  const giftStorage = useGiftStorage();
  const { 
    recipientGifts, 
    createGift, 
    removeGift, 
    fetchGiftsByRecipient,
    loading: firebaseLoading 
  } = useGiftStore();

  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncAt: null,
    conflicts: []
  });

  const firebaseGifts = recipientGifts[recipientId] || [];
  const localSelectedGifts = giftStorage.getSelectedGiftsForOccasion(recipientId, occasionId);

  // Get combined view of selections for this occasion
  const getUnifiedSelections = useCallback(() => {
    const firebaseSelections = firebaseGifts.filter(
      gift => gift.occasionId === occasionId && gift.isAIGenerated && gift.status === 'idea'
    );

    // Create a unified view, preferring Firebase data but including local-only selections
    const unifiedMap = new Map<string, any>();

    // Add Firebase gifts (authoritative source)
    firebaseSelections.forEach(gift => {
      unifiedMap.set(gift.name.toLowerCase(), {
        ...gift,
        source: 'firebase',
        isSelected: true
      });
    });

    // Add local-only gifts (not yet synced to Firebase)
    localSelectedGifts.forEach(localGift => {
      const key = localGift.name.toLowerCase();
      if (!unifiedMap.has(key)) {
        unifiedMap.set(key, {
          ...localGift,
          source: 'local',
          isSelected: true
        });
      }
    });

    return Array.from(unifiedMap.values());
  }, [firebaseGifts, localSelectedGifts, occasionId]);

  // Check if a gift is selected (either in Firebase or localStorage)
  const isGiftSelected = useCallback((giftName: string): boolean => {
    const selections = getUnifiedSelections();
    return selections.some(selection => 
      selection.name.toLowerCase() === giftName.toLowerCase()
    );
  }, [getUnifiedSelections]);

  // Select a gift with proper synchronization
  const selectGift = useCallback(async (gift: EnhancedGiftSuggestion): Promise<void> => {
    console.log('🔄 Selecting gift with sync:', gift.name);
    
    try {
      setSyncState(prev => ({ ...prev, isSyncing: true }));

      // 1. Immediately add to localStorage for UI responsiveness
      const localGift = giftStorage.selectGift(gift, recipientId, occasionId);
      console.log('✅ Gift added to localStorage:', localGift.id);

      // 2. Create in Firebase for persistence
      const firebaseGiftData = {
        recipientId,
        occasionId,
        name: gift.name,
        description: gift.description,
        price: Math.round((gift.price || 0) * 100), // Convert to cents
        category: gift.category || 'AI Recommended',
        date: Date.now(),
        status: 'idea' as const,
        imageUrl: gift.imageUrl,
        affiliateLink: gift.purchaseUrl || gift.affiliateLink,
        notes: `AI-recommended gift. ${gift.reasoning || ''}`.trim(),
        isAIGenerated: true,
        aiMetadata: {
          model: 'gpt-4o-mini',
          confidence: gift.confidence,
          reasoning: gift.reasoning,
          tags: gift.tags,
          generatedAt: Date.now(),
          originalId: gift.id
        }
      };

      const createdGift = await createGift(firebaseGiftData);
      console.log('✅ Gift created in Firebase:', createdGift.id);

      // 3. Update localStorage with Firebase ID for future reference
      giftStorage.updateGiftWithFirebaseId?.(localGift.id, createdGift.id);

      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSyncAt: Date.now() 
      }));

    } catch (error) {
      console.error('❌ Error selecting gift:', error);
      
      // If Firebase fails, at least we have localStorage
      setSyncState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [recipientId, occasionId, giftStorage, createGift]);

  // Unselect a gift with proper cleanup
  const unselectGift = useCallback(async (giftName: string): Promise<void> => {
    console.log('🔄 Unselecting gift with sync:', giftName);
    
    try {
      setSyncState(prev => ({ ...prev, isSyncing: true }));

      // Find the gift in our unified selections
      const selections = getUnifiedSelections();
      const giftToRemove = selections.find(
        selection => selection.name.toLowerCase() === giftName.toLowerCase()
      );

      if (!giftToRemove) {
        console.warn('Gift not found in selections:', giftName);
        return;
      }

      // Remove from Firebase if it exists there
      if (giftToRemove.source === 'firebase' && giftToRemove.id) {
        await removeGift(giftToRemove.id);
        console.log('✅ Gift removed from Firebase:', giftToRemove.id);
      }

      // Remove from localStorage (find by name since local ID might be different)
      const localGifts = giftStorage.getSelectedGiftsForOccasion(recipientId, occasionId);
      const localGift = localGifts.find(
        local => local.name.toLowerCase() === giftName.toLowerCase()
      );
      
      if (localGift) {
        giftStorage.removeGift(localGift.id, 'selected');
        console.log('✅ Gift removed from localStorage:', localGift.id);
      }

      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSyncAt: Date.now() 
      }));

    } catch (error) {
      console.error('❌ Error unselecting gift:', error);
      setSyncState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [getUnifiedSelections, removeGift, giftStorage, recipientId, occasionId]);

  // Sync localStorage with Firebase on load
  const syncSelections = useCallback(async () => {
    if (syncState.isSyncing) return;

    console.log('🔄 Syncing gift selections...');
    setSyncState(prev => ({ ...prev, isSyncing: true }));

    try {
      // Fetch latest Firebase data
      await fetchGiftsByRecipient(recipientId);

      // Detect conflicts between local and Firebase
      const conflicts: SyncState['conflicts'] = [];
      const localGifts = giftStorage.getSelectedGiftsForOccasion(recipientId, occasionId);
      const firebaseGiftsForOccasion = firebaseGifts.filter(
        gift => gift.occasionId === occasionId && gift.isAIGenerated
      );

      // Check for local gifts not in Firebase (need to be uploaded)
      for (const localGift of localGifts) {
        const matchingFirebase = firebaseGiftsForOccasion.find(
          fg => fg.name.toLowerCase() === localGift.name.toLowerCase()
        );

        if (!matchingFirebase) {
          console.log('📤 Local gift not in Firebase, uploading:', localGift.name);
          
          // Upload local gift to Firebase
          try {
            const firebaseGiftData = {
              recipientId,
              occasionId,
              name: localGift.name,
              description: localGift.description || 'AI-recommended gift',
              price: Math.round((localGift.price || 0) * 100),
              category: localGift.category || 'AI Recommended',
              date: Date.now(),
              status: 'idea' as const,
              isAIGenerated: true,
              aiMetadata: {
                model: 'local-storage',
                confidence: localGift.confidence || 0.8,
                reasoning: localGift.reasoning || 'Previously selected gift',
                tags: localGift.tags || ['restored'],
                generatedAt: localGift.selectedAt || Date.now(),
                originalId: localGift.id
              }
            };

            await createGift(firebaseGiftData);
            console.log('✅ Local gift uploaded to Firebase:', localGift.name);
          } catch (uploadError) {
            console.error('❌ Failed to upload local gift:', uploadError);
          }
        }
      }

      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSyncAt: Date.now(),
        conflicts 
      }));

      console.log('✅ Gift selections synced successfully');

    } catch (error) {
      console.error('❌ Error syncing selections:', error);
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [recipientId, occasionId, fetchGiftsByRecipient, giftStorage, firebaseGifts, createGift, syncState.isSyncing]);

  // Auto-sync on mount and when recipientId/occasionId changes
  useEffect(() => {
    if (autoSync && recipientId && occasionId) {
      syncSelections();
    }
  }, [recipientId, occasionId, autoSync, syncSelections]);

  // Get count of selected gifts
  const selectedGiftsCount = getUnifiedSelections().length;

  // Get total budget used
  const totalBudgetUsed = getUnifiedSelections().reduce(
    (sum, selection) => sum + (selection.price || 0), 
    0
  );

  return {
    // Selection state
    selectedGifts: getUnifiedSelections(),
    selectedGiftsCount,
    totalBudgetUsed,
    
    // Selection actions
    selectGift,
    unselectGift,
    isGiftSelected,
    
    // Sync state and actions
    syncState,
    syncSelections,
    
    // Loading states
    isLoading: firebaseLoading || syncState.isSyncing,
    isSyncing: syncState.isSyncing
  };
} 