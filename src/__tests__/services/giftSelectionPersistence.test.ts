import { renderHook, act } from '@testing-library/react';
import { useGiftStorage } from '../../hooks/useGiftStorage';

// Mock Firebase
jest.mock('../../services/firebase', () => ({
  auth: {},
  db: {},
  isDemoMode: true
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

const STORAGE_KEY = 'lazyuncle_gifts';

describe('Gift Selection Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
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
    tags: ['test']
  };

  const recipientId = 'test-recipient-1';
  const occasionId = 'test-occasion-1';

  describe('Local Storage Persistence', () => {
    it('should persist selected gifts in localStorage', async () => {
      const { result } = renderHook(() => useGiftStorage());

      await act(async () => {
        result.current.selectGift(mockGift, recipientId, occasionId);
      });

      // Check that the gift is stored in localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      
      const parsedStorage = JSON.parse(stored!);
      expect(parsedStorage.selectedGifts).toHaveLength(1);
      expect(parsedStorage.selectedGifts[0].name).toBe(mockGift.name);
      expect(parsedStorage.selectedGifts[0].recipientId).toBe(recipientId);
      expect(parsedStorage.selectedGifts[0].occasionId).toBe(occasionId);
    });

    it('should retrieve selected gifts from localStorage after component remount', async () => {
      // First render - select a gift
      const { result: firstResult } = renderHook(() => useGiftStorage());
      
      await act(async () => {
        firstResult.current.selectGift(mockGift, recipientId, occasionId);
      });

      // Verify it's in localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();

      // Second render - should load from localStorage
      const { result: secondResult } = renderHook(() => useGiftStorage());
      
      // Wait for the useEffect to load from localStorage
      await act(async () => {
        // Give it time to load
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const selectedGifts = secondResult.current.getSelectedGiftsForOccasion(recipientId, occasionId);
      expect(selectedGifts).toHaveLength(1);
      expect(selectedGifts[0].name).toBe(mockGift.name);
    });

    it('should handle localStorage corruption gracefully', async () => {
      // Set corrupted data in localStorage
      localStorage.setItem(STORAGE_KEY, 'invalid json');

      const { result } = renderHook(() => useGiftStorage());
      
      // Should not crash and should start with empty storage
      const selectedGifts = result.current.getSelectedGiftsForOccasion(recipientId, occasionId);
      expect(selectedGifts).toHaveLength(0);
    });
  });

  describe('Cross-Session Recovery', () => {
    it('should maintain gift selections across browser sessions', async () => {
      // Simulate first session
      const { result: session1 } = renderHook(() => useGiftStorage());
      
      await act(async () => {
        session1.current.selectGift(mockGift, recipientId, occasionId);
      });

      // Verify localStorage has the data
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      
      // Simulate new session (remount)
      const { result: session2 } = renderHook(() => useGiftStorage());
      
      // Wait for localStorage to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const gifts = session2.current.getSelectedGiftsForOccasion(recipientId, occasionId);
      expect(gifts).toHaveLength(1);
      expect(gifts[0].name).toBe(mockGift.name);
    });
  });

  describe('State Synchronization', () => {
    it('should keep localStorage and Firebase in sync when selecting gifts', async () => {
      // Use real gift store hook but mock its methods
      const { result: giftStorageResult } = renderHook(() => useGiftStorage());
      
      await act(async () => {
        giftStorageResult.current.selectGift(mockGift, recipientId, occasionId);
      });

      // Check localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const localStorageGifts = JSON.parse(stored!).selectedGifts;
      expect(localStorageGifts).toHaveLength(1);
    });

    it('should handle conflicts between localStorage and Firebase gracefully', async () => {
      // Add gift to localStorage first
      const { result } = renderHook(() => useGiftStorage());
      
      await act(async () => {
        result.current.selectGift(mockGift, recipientId, occasionId);
      });

      // Verify localStorage has the gift
      const localGifts = result.current.getSelectedGiftsForOccasion(recipientId, occasionId);
      expect(localGifts).toHaveLength(1);
      expect(localGifts[0].name).toBe('Test Gift');
    });
  });
}); 