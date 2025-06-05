import { renderHook, act } from '@testing-library/react';
import { useGiftSelectionSync } from '../hooks/useGiftSelectionSync';
import { useGiftStorage } from '../hooks/useGiftStorage';

// Mock Firebase
jest.mock('../services/firebase', () => ({
  auth: {},
  db: {},
  isDemoMode: true
}));

// Mock the gift service
jest.mock('../services/giftService', () => ({
  getGiftsByRecipient: jest.fn().mockResolvedValue([]),
  addGift: jest.fn().mockImplementation((data) => Promise.resolve({
    id: `firebase-${Date.now()}`,
    ...data,
    userId: 'test-user',
    createdAt: Date.now(),
    updatedAt: Date.now()
  })),
  updateGift: jest.fn(),
  deleteGift: jest.fn()
}));

// Mock auth store
jest.mock('../store/authStore', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: 'test-user' } })
  }
}));

// Mock gift store
jest.mock('../store/giftStore', () => ({
  useGiftStore: jest.fn(() => ({
    recipientGifts: {},
    createGift: jest.fn().mockResolvedValue({ 
      id: 'firebase-gift-1', 
      name: 'Test Gift',
      recipientId: 'test-recipient-1',
      occasionId: 'test-occasion-1' 
    }),
    removeGift: jest.fn().mockResolvedValue(undefined),
    fetchGiftsByRecipient: jest.fn().mockResolvedValue([]),
    loading: false
  }))
}));

const STORAGE_KEY = 'lazyuncle_gifts';

describe('Gift Selection Integration Test', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  const mockGift = {
    id: 'test-gift-1',
    name: 'Test Gift',
    description: 'A test gift',
    price: 50,
    category: 'test',
    confidence: 0.9,
    reasoning: 'Test reasoning',
    tags: ['test'],
    imageUrl: 'test-image.jpg',
    purchaseUrl: 'https://example.com'
  };

  const recipientId = 'test-recipient-1';
  const occasionId = 'test-occasion-1';

  describe('Full Gift Selection Flow', () => {
    it('should handle complete gift selection and persistence flow', async () => {
      // Step 1: Initial state - no selections
      const { result: syncResult } = renderHook(() => 
        useGiftSelectionSync({ recipientId, occasionId, autoSync: true })
      );

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(syncResult.current.selectedGiftsCount).toBe(0);
      expect(syncResult.current.isGiftSelected(mockGift.name)).toBe(false);

      // Step 2: Select a gift
      await act(async () => {
        await syncResult.current.selectGift(mockGift);
      });

      // Should be selected in sync hook
      expect(syncResult.current.selectedGiftsCount).toBe(1);
      expect(syncResult.current.isGiftSelected(mockGift.name)).toBe(true);

      // Step 3: Verify localStorage persistence
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsedStorage = JSON.parse(stored!);
      expect(parsedStorage.selectedGifts).toHaveLength(1);
      expect(parsedStorage.selectedGifts[0].name).toBe(mockGift.name);

      // Step 4: Simulate new session - create new hook instances
      const { result: newSyncResult } = renderHook(() => 
        useGiftSelectionSync({ recipientId, occasionId, autoSync: true })
      );

      const { result: storageResult } = renderHook(() => useGiftStorage());

      // Wait for localStorage to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should maintain selections across sessions
      expect(storageResult.current.selectedGifts).toHaveLength(1);
      expect(storageResult.current.selectedGifts[0].name).toBe(mockGift.name);

      // Step 5: Test unselection
      await act(async () => {
        await newSyncResult.current.unselectGift(mockGift.name);
      });

      // Should be removed
      expect(newSyncResult.current.selectedGiftsCount).toBe(0);
      expect(newSyncResult.current.isGiftSelected(mockGift.name)).toBe(false);
    });

    it('should handle multiple gift selections for different occasions', async () => {
      const occasion1 = 'occasion-1';
      const occasion2 = 'occasion-2';

      const { result: sync1 } = renderHook(() => 
        useGiftSelectionSync({ recipientId, occasionId: occasion1, autoSync: true })
      );

      const { result: sync2 } = renderHook(() => 
        useGiftSelectionSync({ recipientId, occasionId: occasion2, autoSync: true })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Select gifts for different occasions
      await act(async () => {
        await sync1.current.selectGift({ ...mockGift, id: 'gift-1', name: 'Gift 1' });
        await sync2.current.selectGift({ ...mockGift, id: 'gift-2', name: 'Gift 2' });
      });

      // Each occasion should have its own selections
      expect(sync1.current.selectedGiftsCount).toBe(1);
      expect(sync2.current.selectedGiftsCount).toBe(1);
      expect(sync1.current.isGiftSelected('Gift 1')).toBe(true);
      expect(sync1.current.isGiftSelected('Gift 2')).toBe(false);
      expect(sync2.current.isGiftSelected('Gift 1')).toBe(false);
      expect(sync2.current.isGiftSelected('Gift 2')).toBe(true);

      // Verify localStorage contains both
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsedStorage = JSON.parse(stored!);
      expect(parsedStorage.selectedGifts).toHaveLength(2);
    });

    it('should handle budget tracking correctly', async () => {
      const { result: syncResult } = renderHook(() => 
        useGiftSelectionSync({ recipientId, occasionId, autoSync: true })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Select multiple gifts with different prices
      await act(async () => {
        await syncResult.current.selectGift({ ...mockGift, id: 'gift-1', name: 'Gift 1', price: 25 });
        await syncResult.current.selectGift({ ...mockGift, id: 'gift-2', name: 'Gift 2', price: 75 });
      });

      // Should track total budget used
      expect(syncResult.current.selectedGiftsCount).toBe(2);
      expect(syncResult.current.totalBudgetUsed).toBe(10000); // 100 * 100 (converted to cents)
    });

    it('should handle Firebase sync errors gracefully', async () => {
      // Mock Firebase failure
      const mockCreateGift = jest.fn().mockRejectedValue(new Error('Firebase error'));
      jest.doMock('../store/giftStore', () => ({
        useGiftStore: jest.fn(() => ({
          recipientGifts: {},
          createGift: mockCreateGift,
          removeGift: jest.fn().mockResolvedValue(undefined),
          fetchGiftsByRecipient: jest.fn().mockResolvedValue([]),
          loading: false
        }))
      }));

      const { result: syncResult } = renderHook(() => 
        useGiftSelectionSync({ recipientId, occasionId, autoSync: true })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should still save to localStorage even if Firebase fails
      try {
        await act(async () => {
          await syncResult.current.selectGift(mockGift);
        });
      } catch (error) {
        // Firebase error is expected
      }

      // LocalStorage should still work
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsedStorage = JSON.parse(stored!);
      expect(parsedStorage.selectedGifts).toHaveLength(1);
    });
  });
}); 