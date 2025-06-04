import { getGiftRecommendations } from '../../services/giftRecommendationEngine';
import type { Recipient } from '../../types/index';
import { getGiftRecommendationsFromAI } from '../../services/giftRecommendationEngine';

// Mock fetch globally
global.fetch = jest.fn();

describe('Gift Recommendation Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  const mockRecipient = {
    id: 'test-recipient-1',
    name: 'Test User',
    relationship: 'friend',
    interests: ['gaming', 'books'],
    birthdate: '1990-05-15',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  describe('AI Recommendations', () => {
    it('should handle successful AI API response', async () => {
      const mockResponse = {
        suggestions: [
          {
            id: 'ai-suggestion-1',
            name: 'Gaming Headset',
            description: 'High-quality wireless gaming headset',
            price: 150,
            category: 'gaming',
            reasoning: 'Perfect for gaming enthusiast',
            confidence: 0.9,
            tags: ['gaming', 'electronics']
          }
        ],
        metadata: {
          model: 'gpt-4o-mini',
          generated_at: new Date().toISOString(),
          recipient_name: 'Test User',
          occasion: 'birthday',
          budget: 200,
          request_id: 'test-123'
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const recommendations = await getGiftRecommendationsFromAI({
        recipient: mockRecipient,
        budget: 200,
        occasion: 'birthday'
      });

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].name).toBe('Gaming Headset');
      expect(recommendations[0].reasoning).toBe('Perfect for gaming enthusiast');
    });

    it('should handle AI API timeout gracefully', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 100)
        )
      );

      const recommendations = await getGiftRecommendationsFromAI({
        recipient: mockRecipient,
        budget: 200,
        occasion: 'birthday'
      });

      // Should fall back to mock recommendations
      expect(recommendations).toHaveLength(5);
      expect(recommendations[0]).toHaveProperty('name');
      expect(recommendations[0]).toHaveProperty('price');
    });

    it('should handle API rate limiting (429 error)', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      });

      const recommendations = await getGiftRecommendationsFromAI({
        recipient: mockRecipient,
        budget: 200,
        occasion: 'birthday'
      });

      // Should fall back to mock recommendations
      expect(recommendations).toHaveLength(5);
      expect(recommendations[0]).toHaveProperty('name');
    });

    it('should handle malformed AI response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' })
      });

      const recommendations = await getGiftRecommendationsFromAI({
        recipient: mockRecipient,
        budget: 200,
        occasion: 'birthday'
      });

      // Should fall back to mock recommendations
      expect(recommendations).toHaveLength(5);
    });

    it('should respect budget constraints', async () => {
      const budget = 50;
      const recommendations = await getGiftRecommendationsFromAI({
        recipient: mockRecipient,
        budget,
        occasion: 'birthday'
      });

      recommendations.forEach(gift => {
        expect(gift.price).toBeLessThanOrEqual(budget);
      });
    });

    it('should include required fields in each recommendation', async () => {
      const recommendations = await getGiftRecommendationsFromAI({
        recipient: mockRecipient,
        budget: 200,
        occasion: 'birthday'
      });

      recommendations.forEach(gift => {
        expect(gift).toHaveProperty('id');
        expect(gift).toHaveProperty('name');
        expect(gift).toHaveProperty('description');
        expect(gift).toHaveProperty('price');
        expect(gift).toHaveProperty('category');
        expect(typeof gift.price).toBe('number');
        expect(gift.price).toBeGreaterThan(0);
      });
    });
  });

  describe('Mock Recommendations (Fallback)', () => {
    it('should generate different recommendations based on interests', async () => {
      const gamerRecipient = { ...mockRecipient, interests: ['gaming'] };
      const bookRecipient = { ...mockRecipient, interests: ['books'] };

      // Force fallback by using invalid fetch
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const gamerRecs = await getGiftRecommendationsFromAI({
        recipient: gamerRecipient,
        budget: 200,
        occasion: 'birthday'
      });

      const bookRecs = await getGiftRecommendationsFromAI({
        recipient: bookRecipient,
        budget: 200,
        occasion: 'birthday'
      });

      // Should have different recommendations based on interests
      expect(gamerRecs).not.toEqual(bookRecs);
    });
  });
});

describe('Gift Recommendation Engine', () => {
  test('should provide recommendations based on recipient interests', () => {
    // Arrange
    const recipient: Partial<Recipient> = {
      id: '1',
      userId: 'test-user',
      name: 'John Doe',
      relationship: 'Friend',
      interests: ['Music', 'Technology', 'Sports'],
      giftPreferences: {
        priceRange: {
          min: 20,
          max: 100
        },
        categories: ['Electronics', 'Accessories']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const budget = 50;
    const occasion = 'Birthday';

    // Act
    const recommendations = getGiftRecommendations(recipient, occasion, budget);

    // Assert
    expect(recommendations).toBeDefined();
    expect(recommendations.length).toBeGreaterThan(0);
    
    // Verify recommendations match recipient interests
    recommendations.forEach(gift => {
      expect(gift).toHaveProperty('id');
      expect(gift).toHaveProperty('name');
      expect(gift).toHaveProperty('description');
      expect(gift).toHaveProperty('price');
      expect(gift.price).toBeLessThanOrEqual(budget);
      
      // Check if this gift matches at least one interest or category preference
      const matchesInterest = !gift.interests || gift.interests.some(interest => 
        recipient.interests?.includes(interest)
      );
      
      const matchesCategory = !gift.category || 
        !recipient.giftPreferences?.categories ||
        recipient.giftPreferences.categories.includes(gift.category);
      
      expect(matchesInterest || matchesCategory).toBeTruthy();
    });
  });

  test('should respect gift price range', () => {
    // Arrange
    const recipient: Partial<Recipient> = {
      id: '2',
      userId: 'test-user',
      name: 'Jane Doe',
      relationship: 'Sister',
      interests: ['Books', 'Cooking', 'Travel'],
      giftPreferences: {
        priceRange: {
          min: 30,
          max: 75
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const budget = 75;
    const occasion = 'Birthday';

    // Act
    const recommendations = getGiftRecommendations(recipient, occasion, budget);

    // Assert
    expect(recommendations).toBeDefined();
    
    // Verify all recommendations are within budget
    recommendations.forEach(gift => {
      expect(gift.price).toBeLessThanOrEqual(budget);
    });
  });
}); 