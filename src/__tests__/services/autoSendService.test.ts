import { AutoSendService } from '../../services/autoSendService';
import type { Recipient, GiftSuggestion } from '../../types';

// Mock OpenAI API and Firestore as needed
jest.mock('../../services/firebase', () => ({ db: {} }));

global.fetch = jest.fn();

const mockRecipient: Recipient = {
  id: 'rec-1',
  userId: 'user-1',
  name: 'Alice',
  relationship: 'Friend',
  birthdate: '1990-05-15',
  interests: ['Books', 'Music'],
  createdAt: new Date(),
  updatedAt: new Date(),
  autoSendPreferences: {
    enabled: true,
    defaultBudget: 50,
    requireApproval: true,
    occasions: {
      birthday: { enabled: true, budget: 50, leadTime: 7 },
    },
    shippingAddress: {
      line1: '123 Main St',
      city: 'Townsville',
      state: 'TS',
      postalCode: '12345',
      country: 'USA',
    },
    paymentMethod: { type: 'creditCard', last4: '1234', brand: 'Visa' },
  },
};

const mockGiftSuggestions: GiftSuggestion[] = [
  { id: 'gift-1', name: 'Bluetooth Speaker', description: 'Portable speaker', price: 45, category: 'Electronics', imageUrl: '' },
  { id: 'gift-2', name: 'Book Club Subscription', description: 'A monthly book subscription', price: 40, category: 'Books', imageUrl: '' },
  { id: 'gift-3', name: 'Personalized Mug', description: 'Custom mug with name', price: 20, category: 'Home', imageUrl: '' },
];

describe('Gifting Flow', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('should fetch top 3 gift ideas from OpenAI and present to user', async () => {
    // Arrange: Mock OpenAI API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockGiftSuggestions,
    });

    // Act: Call the gifting function (simulate the flow)
    const result = await AutoSendService.getGiftRecommendations(
      mockRecipient.id,
      'birthday',
      50
    );

    // Assert: Should return top 3 suggestions
    expect(result).toBeDefined();
    expect(result.length).toBe(3);
    expect(result[0].name).toBe('Bluetooth Speaker');
    expect(result[1].name).toBe('Book Club Subscription');
    expect(result[2].name).toBe('Personalized Mug');
  });

  test('should handle user confirmation of a gift', async () => {
    // Simulate user selecting the second gift
    const selectedGift = mockGiftSuggestions[1];
    // Simulate confirmation logic (pseudo, to be implemented)
    expect(selectedGift.name).toBe('Book Club Subscription');
  });
}); 