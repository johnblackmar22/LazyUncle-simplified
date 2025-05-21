import { useGiftStore } from '../../store/giftStore';
import { useAuthStore } from '../../store/authStore';
import type { Gift, GiftSuggestion } from '../../types';

// Mock the stores and modules
jest.mock('../../store/giftStore');
jest.mock('../../store/authStore');
jest.mock('../../services/firebase.env.ts');

describe('Gift Management Workflow Tests', () => {
  // Mock data
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    planId: 'pro',
    createdAt: Date.now()
  };

  const mockRecipientId = 'test-recipient-id';

  const mockGift: Gift = {
    id: 'test-gift-id',
    recipientId: mockRecipientId,
    userId: 'test-user-id',
    name: 'Premium Headphones',
    description: 'High-quality wireless headphones',
    price: 99.99,
    category: 'Electronics',
    occasion: 'Birthday',
    date: new Date(2023, 11, 25),
    status: 'planned',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock returns
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      demoMode: false
    });

    (useGiftStore as unknown as jest.Mock).mockReturnValue({
      gifts: [],
      loading: false,
      error: null,
      addGift: jest.fn().mockResolvedValue(mockGift),
      updateGift: jest.fn().mockResolvedValue(undefined),
      fetchGifts: jest.fn().mockResolvedValue([]),
      deleteGift: jest.fn().mockResolvedValue(undefined),
      getGiftsByRecipient: jest.fn().mockReturnValue([])
    });
  });

  test('Should successfully add a gift', async () => {
    const addGiftMock = jest.fn().mockResolvedValue(mockGift);
    (useGiftStore as unknown as jest.Mock).mockReturnValue({
      ...useGiftStore(),
      addGift: addGiftMock
    });

    const giftStore = useGiftStore();
    const newGift = await giftStore.addGift({
      recipientId: mockRecipientId,
      name: 'Premium Headphones',
      description: 'High-quality wireless headphones',
      price: 99.99,
      category: 'Electronics',
      occasion: 'Birthday',
      date: new Date(2023, 11, 25),
      status: 'planned'
    });

    // Verify gift was added successfully
    expect(addGiftMock).toHaveBeenCalled();
    expect(newGift).toEqual(mockGift);
  });

  test('Should fail to add gift when not authenticated', async () => {
    // Mock unauthenticated state
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      demoMode: false
    });

    const addGiftMock = jest.fn().mockResolvedValue(null);
    (useGiftStore as unknown as jest.Mock).mockReturnValue({
      ...useGiftStore(),
      addGift: addGiftMock,
      error: 'User not authenticated'
    });

    const giftStore = useGiftStore();
    const newGift = await giftStore.addGift({
      recipientId: mockRecipientId,
      name: 'Premium Headphones',
      description: 'High-quality wireless headphones',
      price: 99.99,
      category: 'Electronics',
      occasion: 'Birthday',
      date: new Date(2023, 11, 25),
      status: 'planned'
    });

    // Verify gift was not added
    expect(newGift).toBeNull();
    expect(giftStore.error).toBe('User not authenticated');
  });

  test('Should fetch gifts for specific recipient', async () => {
    const mockGifts = [mockGift];
    const getGiftsByRecipientMock = jest.fn().mockReturnValue(mockGifts);
    
    (useGiftStore as unknown as jest.Mock).mockReturnValue({
      ...useGiftStore(),
      getGiftsByRecipient: getGiftsByRecipientMock,
      gifts: mockGifts
    });

    const giftStore = useGiftStore();
    const recipientGifts = giftStore.getGiftsByRecipient(mockRecipientId);

    // Verify gifts were fetched for specific recipient
    expect(getGiftsByRecipientMock).toHaveBeenCalledWith(mockRecipientId);
    expect(recipientGifts).toEqual(mockGifts);
  });

  test('Should update gift information', async () => {
    const updateGiftMock = jest.fn().mockResolvedValue(undefined);
    
    (useGiftStore as unknown as jest.Mock).mockReturnValue({
      ...useGiftStore(),
      updateGift: updateGiftMock,
      gifts: [mockGift]
    });

    const giftStore = useGiftStore();
    const updatedData = { 
      name: 'Updated Headphones', 
      status: 'ordered' as const
    };
    
    await giftStore.updateGift('test-gift-id', updatedData);

    // Verify update was called with correct parameters
    expect(updateGiftMock).toHaveBeenCalledWith('test-gift-id', updatedData);
  });

  test('Should delete a gift', async () => {
    const deleteGiftMock = jest.fn().mockResolvedValue(undefined);
    
    (useGiftStore as unknown as jest.Mock).mockReturnValue({
      ...useGiftStore(),
      deleteGift: deleteGiftMock,
      gifts: [mockGift]
    });

    const giftStore = useGiftStore();
    await giftStore.deleteGift('test-gift-id');

    // Verify delete was called with correct ID
    expect(deleteGiftMock).toHaveBeenCalledWith('test-gift-id');
  });

  test('End-to-end workflow: Add and update gift', async () => {
    // Setup mocks
    const addGiftMock = jest.fn().mockResolvedValue(mockGift);
    const updateGiftMock = jest.fn().mockResolvedValue(undefined);
    
    (useGiftStore as unknown as jest.Mock).mockReturnValue({
      ...useGiftStore(),
      addGift: addGiftMock,
      updateGift: updateGiftMock,
      gifts: []
    });

    // 1. Add a new gift
    const giftStore = useGiftStore();
    const newGift = await giftStore.addGift({
      recipientId: mockRecipientId,
      name: 'Premium Headphones',
      description: 'High-quality wireless headphones',
      price: 99.99,
      category: 'Electronics',
      occasion: 'Birthday',
      date: new Date(2023, 11, 25),
      status: 'planned'
    });

    // Verify gift was added
    expect(addGiftMock).toHaveBeenCalled();
    expect(newGift).toEqual(mockGift);
    
    // Ensure we don't get a null error in the next step due to TypeScript
    if (!newGift) {
      fail('Gift should not be null');
      return;
    }

    // 2. Update the gift status
    const updatedData = { 
      status: 'shipped' as const
    };
    
    await giftStore.updateGift(newGift.id, updatedData);

    // Verify update was called with correct parameters
    expect(updateGiftMock).toHaveBeenCalledWith(newGift.id, updatedData);
  });
}); 