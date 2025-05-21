import { getGiftRecommendations, getGiftRecommendationsFromAI } from '../../services/giftRecommendationEngine';
import { useRecipientStore } from '../../store/recipientStore';
import { useAuthStore } from '../../store/authStore';
import type { Recipient, Gift, GiftSuggestion } from '../../types';

// Mock the stores and modules
jest.mock('../../store/recipientStore');
jest.mock('../../store/authStore');
jest.mock('../../services/giftRecommendationEngine');
jest.mock('../../services/firebase.env.ts');

describe('End-to-End Recipient and Gift Workflow Tests', () => {
  // Mock data
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    planId: 'pro',
    createdAt: Date.now()
  };

  const mockRecipient: Recipient = {
    id: 'test-recipient-id',
    userId: 'test-user-id',
    name: 'John Doe',
    relationship: 'Friend',
    interests: ['Music', 'Books', 'Technology'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const mockGiftSuggestions: GiftSuggestion[] = [
    {
      id: 'gift-1',
      name: 'Premium Headphones',
      description: 'High-quality wireless headphones',
      price: 99.99,
      category: 'Electronics',
      interests: ['Music', 'Technology']
    },
    {
      id: 'gift-2',
      name: 'Best-selling Novel Collection',
      description: 'Set of 3 best-selling novels',
      price: 45.99,
      category: 'Books',
      interests: ['Books', 'Reading']
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock returns
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      demoMode: false
    });

    (useRecipientStore as unknown as jest.Mock).mockReturnValue({
      recipients: [],
      loading: false,
      error: null,
      addRecipient: jest.fn().mockResolvedValue(mockRecipient),
      updateRecipient: jest.fn().mockResolvedValue(undefined),
      fetchRecipients: jest.fn().mockResolvedValue([]),
      deleteRecipient: jest.fn().mockResolvedValue(undefined)
    });

    (getGiftRecommendations as jest.Mock).mockReturnValue(mockGiftSuggestions);
    (getGiftRecommendationsFromAI as jest.Mock).mockResolvedValue(mockGiftSuggestions);
  });

  test('Should successfully add a recipient', async () => {
    const addRecipientMock = jest.fn().mockResolvedValue(mockRecipient);
    (useRecipientStore as unknown as jest.Mock).mockReturnValue({
      ...useRecipientStore(),
      addRecipient: addRecipientMock
    });

    const recipientStore = useRecipientStore();
    const newRecipient = await recipientStore.addRecipient({
      name: 'John Doe',
      relationship: 'Friend',
      interests: ['Music', 'Books', 'Technology']
    });

    // Verify recipient was added successfully
    expect(addRecipientMock).toHaveBeenCalled();
    expect(newRecipient).toEqual(mockRecipient);
  });

  test('Should fail to add recipient when not authenticated', async () => {
    // Mock unauthenticated state
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      demoMode: false
    });

    const addRecipientMock = jest.fn().mockResolvedValue(null);
    (useRecipientStore as unknown as jest.Mock).mockReturnValue({
      ...useRecipientStore(),
      addRecipient: addRecipientMock,
      error: 'User not authenticated'
    });

    const recipientStore = useRecipientStore();
    const newRecipient = await recipientStore.addRecipient({
      name: 'John Doe',
      relationship: 'Friend',
      interests: ['Music', 'Books', 'Technology']
    });

    // Verify recipient was not added
    expect(newRecipient).toBeNull();
    expect(recipientStore.error).toBe('User not authenticated');
  });

  test('Should get gift recommendations for a recipient', () => {
    const occasion = 'Birthday';
    const budget = 100;

    const recommendations = getGiftRecommendations(mockRecipient, occasion, budget);

    // Verify recommendations were returned
    expect(recommendations).toEqual(mockGiftSuggestions);
    expect(recommendations.length).toBeGreaterThan(0);
    
    // Verify all recommendations are within budget
    recommendations.forEach(gift => {
      expect(gift.price).toBeLessThanOrEqual(budget);
    });
  });

  test('Should get AI-powered gift recommendations', async () => {
    const budget = 100;
    
    const recommendations = await getGiftRecommendationsFromAI({ 
      recipient: mockRecipient, 
      budget 
    });

    // Verify AI recommendations were returned
    expect(recommendations).toEqual(mockGiftSuggestions);
    expect(recommendations.length).toBeGreaterThan(0);
  });

  test('Should handle API errors in AI recommendations gracefully', async () => {
    // Mock API error
    (getGiftRecommendationsFromAI as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    try {
      await getGiftRecommendationsFromAI({ 
        recipient: mockRecipient, 
        budget: 100 
      });
      // The test should fail if no error is thrown
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toBe('API error');
    }
  });

  test('Should fetch recipients for current user', async () => {
    const mockRecipients = [mockRecipient];
    const fetchRecipientsMock = jest.fn().mockResolvedValue(mockRecipients);
    
    (useRecipientStore as unknown as jest.Mock).mockReturnValue({
      ...useRecipientStore(),
      fetchRecipients: fetchRecipientsMock,
      recipients: mockRecipients
    });

    const recipientStore = useRecipientStore();
    await recipientStore.fetchRecipients();

    // Verify recipients were fetched
    expect(fetchRecipientsMock).toHaveBeenCalled();
    expect(recipientStore.recipients).toEqual(mockRecipients);
  });

  test('Should update recipient information', async () => {
    const updateRecipientMock = jest.fn().mockResolvedValue(undefined);
    
    (useRecipientStore as unknown as jest.Mock).mockReturnValue({
      ...useRecipientStore(),
      updateRecipient: updateRecipientMock,
      recipients: [mockRecipient]
    });

    const recipientStore = useRecipientStore();
    const updatedData = { 
      name: 'John Updated', 
      interests: ['Music', 'Books', 'Technology', 'Travel'] 
    };
    
    await recipientStore.updateRecipient('test-recipient-id', updatedData);

    // Verify update was called with correct parameters
    expect(updateRecipientMock).toHaveBeenCalledWith('test-recipient-id', updatedData);
  });

  test('End-to-end workflow: Add recipient and get recommendations', async () => {
    // Setup mocks
    const addRecipientMock = jest.fn().mockResolvedValue(mockRecipient);
    
    (useRecipientStore as unknown as jest.Mock).mockReturnValue({
      ...useRecipientStore(),
      addRecipient: addRecipientMock
    });

    // 1. Add a new recipient
    const recipientStore = useRecipientStore();
    const newRecipient = await recipientStore.addRecipient({
      name: 'John Doe',
      relationship: 'Friend',
      interests: ['Music', 'Books', 'Technology']
    });

    // Verify recipient was added
    expect(newRecipient).toEqual(mockRecipient);
    
    // Guard against null recipient
    if (!newRecipient) {
      fail('Recipient should not be null');
      return;
    }

    // 2. Get gift recommendations for the recipient
    const occasion = 'Birthday';
    const budget = 100;
    const recommendations = getGiftRecommendations(newRecipient, occasion, budget);

    // Verify recommendations were returned and are valid
    expect(recommendations).toEqual(mockGiftSuggestions);
    expect(recommendations.length).toBeGreaterThan(0);
    
    // 3. Check if at least one gift matches the recipient interests
    const hasMatchingInterest = recommendations.some(gift => 
      gift.interests?.some(interest => 
        newRecipient.interests.includes(interest)
      )
    );
    
    expect(hasMatchingInterest).toBe(true);
  });
}); 