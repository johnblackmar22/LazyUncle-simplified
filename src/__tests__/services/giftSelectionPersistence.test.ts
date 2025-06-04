import { renderHook, act } from '@testing-library/react';
import { useGiftStorage } from '../../hooks/useGiftStorage';
import { useGiftStore } from '../../store/giftStore';

// Mock Firebase
jest.mock('../../services/firebase', () => ({
  DEMO_MODE: true,
  db: {}
}));

// Mock the gift service
jest.mock('../../services/giftService', () => ({
  getGiftsByRecipient: jest.fn().mockResolvedValue([]),
  addGift: jest.fn().mockImplementation((data) => Promise.resolve({
    id: `gift-${Date.now()}`,
    ...data,
    userId: 'test-user',
    createdAt: Date.now(),
    updatedAt: Date.now()
  })),
  updateGift: jest.fn(),
  deleteGift: jest.fn()
}));

// Mock auth store
jest.mock('../../store/authStore', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: 'test-user' } })
  }
}));

describe('Gift Selection Persistence', () => {
  const mockGift = {
    id: 'test-gift-1',
    name: 'Test Gift',
    description: 'A test gift',
    price: 50,
    category: 'test',
    reasoning: 'Test reasoning',
    confidence: 0.9,
    tags: ['test'],
    imageUrl: 'test-image.jpg'
  };

  const recipientId = 'test-recipient-1';
  const occasionId = 'test-occasion-1';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset all stores
    jest.clearAllMocks();
  });

  describe('Local Storage Persistence', () => {
    it('should persist selected gifts in localStorage', () => {
      const { result } = renderHook(() => useGiftStorage());

      act(() => {
        result.current.selectGift(mockGift, recipientId, occasionId);
      });

      // Check that the gift is stored in localStorage
      const stored = localStorage.getItem('lazyuncle_gift_storage');
      expect(stored).toBeTruthy();
      
      const parsedStorage = JSON.parse(stored!);
      expect(parsedStorage.selectedGifts).toHaveLength(1);
      expect(parsedStorage.selectedGifts[0].name).toBe(mockGift.name);
    });

    it('should retrieve selected gifts from localStorage after page reload', () => {
      // Simulate existing data in localStorage
      const existingData = {
        selectedGifts: [{
          ...mockGift,
          recipientId,
          occasionId,
          status: 'selected',
          selectedAt: Date.now()
        }],
        savedGifts: [],
        recentRecommendations: {}
      };
      
      localStorage.setItem('lazyuncle_gift_storage', JSON.stringify(existingData));

      // Create new hook instance (simulating page reload)
      const { result } = renderHook(() => useGiftStorage());

      const selectedGifts = result.current.getSelectedGiftsForOccasion(recipientId, occasionId);
      expect(selectedGifts).toHaveLength(1);
      expect(selectedGifts[0].name).toBe(mockGift.name);
    });

    it('should persist gift removal', () => {
      const { result } = renderHook(() => useGiftStorage());

      act(() => {
        result.current.selectGift(mockGift, recipientId, occasionId);
      });

      act(() => {
        result.current.removeGift(mockGift.id, 'selected');
      });

      const selectedGifts = result.current.getSelectedGiftsForOccasion(recipientId, occasionId);
      expect(selectedGifts).toHaveLength(0);
    });
  });

  describe('Firebase Store Integration', () => {
    it('should create gift in Firebase when selected', async () => {
      const { result: giftStoreResult } = renderHook(() => useGiftStore());

      const giftData = {
        recipientId,
        occasionId,
        name: mockGift.name,
        description: mockGift.description,
        price: mockGift.price * 100, // Convert to cents
        category: mockGift.category,
        date: Date.now(),
        status: 'idea' as const,
        isAIGenerated: true
      };

      await act(async () => {
        await giftStoreResult.current.createGift(giftData);
      });

      // Verify the gift was created
      expect(giftStoreResult.current.gifts).toHaveLength(1);
      expect(giftStoreResult.current.gifts[0].name).toBe(mockGift.name);
    });

    it('should sync Firebase gifts with recipient gifts cache', async () => {
      const { result: giftStoreResult } = renderHook(() => useGiftStore());

      await act(async () => {
        await giftStoreResult.current.fetchGiftsByRecipient(recipientId);
      });

      // Check that recipient gifts are cached
      expect(giftStoreResult.current.recipientGifts[recipientId]).toBeDefined();
    });
  });

  describe('Cross-Session Persistence', () => {
    it('should maintain gift selections across browser sessions', () => {
      // First session - select a gift
      const { result: session1 } = renderHook(() => useGiftStorage());
      
      act(() => {
        session1.current.selectGift(mockGift, recipientId, occasionId);
      });

      // Simulate page reload - create new hook instance
      const { result: session2 } = renderHook(() => useGiftStorage());
      
      const persistedGifts = session2.current.getSelectedGiftsForOccasion(recipientId, occasionId);
      expect(persistedGifts).toHaveLength(1);
      expect(persistedGifts[0].name).toBe(mockGift.name);
    });

    it('should handle localStorage corruption gracefully', () => {
      // Corrupt the localStorage data
      localStorage.setItem('lazyuncle_gift_storage', 'invalid json');

      // Should not crash and should use default state
      const { result } = renderHook(() => useGiftStorage());
      
      expect(result.current.selectedGifts).toHaveLength(0);
      expect(result.current.savedGifts).toHaveLength(0);
    });
  });

  describe('State Synchronization', () => {
    it('should keep localStorage and Firebase in sync when selecting gifts', async () => {
      const { result: storageResult } = renderHook(() => useGiftStorage());
      const { result: storeResult } = renderHook(() => useGiftStore());

      // Select in localStorage
      act(() => {
        storageResult.current.selectGift(mockGift, recipientId, occasionId);
      });

      // Create in Firebase
      const giftData = {
        recipientId,
        occasionId,
        name: mockGift.name,
        description: mockGift.description,
        price: mockGift.price * 100,
        category: mockGift.category,
        date: Date.now(),
        status: 'idea' as const,
        isAIGenerated: true
      };

      await act(async () => {
        await storeResult.current.createGift(giftData);
      });

      // Verify both systems have the gift
      const localStorageGifts = storageResult.current.getSelectedGiftsForOccasion(recipientId, occasionId);
      const firebaseGifts = storeResult.current.gifts;

      expect(localStorageGifts).toHaveLength(1);
      expect(firebaseGifts).toHaveLength(1);
      expect(localStorageGifts[0].name).toBe(firebaseGifts[0].name);
    });

    it('should handle conflicts between localStorage and Firebase gracefully', async () => {
      // Pre-populate localStorage with a gift
      const localGift = { ...mockGift, id: 'local-gift-1' };
      const { result: storageResult } = renderHook(() => useGiftStorage());
      
      act(() => {
        storageResult.current.selectGift(localGift, recipientId, occasionId);
      });

      // Create a different gift in Firebase
      const { result: storeResult } = renderHook(() => useGiftStore());
      const firebaseGiftData = {
        recipientId,
        occasionId,
        name: 'Firebase Gift',
        description: 'Gift from Firebase',
        price: 7500, // $75 in cents
        category: 'test',
        date: Date.now(),
        status: 'idea' as const,
        isAIGenerated: true
      };

      await act(async () => {
        await storeResult.current.createGift(firebaseGiftData);
      });

      // Both should coexist
      const localGifts = storageResult.current.getSelectedGiftsForOccasion(recipientId, occasionId);
      const firebaseGifts = storeResult.current.gifts;

      expect(localGifts).toHaveLength(1);
      expect(firebaseGifts).toHaveLength(1);
      expect(localGifts[0].name).toBe('Test Gift');
      expect(firebaseGifts[0].name).toBe('Firebase Gift');
    });
  });
}); 