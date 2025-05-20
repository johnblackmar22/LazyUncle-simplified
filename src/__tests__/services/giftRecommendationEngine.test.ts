import { getGiftRecommendations } from '../../services/giftRecommendationEngine';
import type { Recipient } from '../../types/index';

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