import type { Recipient, Occasion } from '../types';

export interface GiftRecommendationRequest {
  recipient: Recipient;
  occasion: Occasion;
  budget: {
    min: number;
    max: number;
  };
  excludeCategories?: string[];
  preferredCategories?: string[];
}

export interface GiftRecommendation {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  confidence: number; // 0-1 score
  reasoning: string;
  tags: string[];
  imageUrl?: string;
  purchaseUrl?: string;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  estimatedDelivery: string;
  metadata: {
    model: string;
    promptVersion: string;
    generatedAt: number;
  };
}

export interface RecommendationResponse {
  recommendations: GiftRecommendation[];
  totalFound: number;
  searchMetadata: {
    processingTime: number;
    confidence: number;
    fallbackUsed: boolean;
  };
}

class GiftRecommendationEngine {
  private baseUrl = '/.netlify/functions';
  
  /**
   * Get AI-powered gift recommendations
   */
  async getRecommendations(request: GiftRecommendationRequest): Promise<RecommendationResponse> {
    try {
      console.log('🤖 Requesting gift recommendations:', {
        recipientName: request.recipient.name,
        occasion: request.occasion.name,
        budget: request.budget,
        interests: request.recipient.interests
      });

      const response = await fetch(`${this.baseUrl}/gift-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: {
            name: request.recipient.name,
            age: this.calculateAge(request.recipient.birthdate),
            interests: request.recipient.interests,
            relationship: request.recipient.relationship,
            location: request.recipient.deliveryAddress?.state || 'US'
          },
          occasion: {
            type: request.occasion.name,
            date: request.occasion.date,
            significance: request.occasion.notes || 'regular'
          },
          budget: request.budget,
          preferences: {
            excludeCategories: request.excludeCategories || [],
            preferredCategories: request.preferredCategories || []
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Recommendation API failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('🤖 Received recommendations:', {
        count: data.recommendations?.length || 0,
        confidence: data.searchMetadata?.confidence
      });

      return data;
    } catch (error) {
      console.error('❌ Gift recommendation error:', error);
      
      // Fallback to local recommendations if API fails
      return this.getFallbackRecommendations(request);
    }
  }

  /**
   * Regenerate recommendations with different parameters
   */
  async regenerateRecommendations(
    originalRequest: GiftRecommendationRequest,
    excludeIds: string[]
  ): Promise<RecommendationResponse> {
    const newRequest = {
      ...originalRequest,
      excludeIds
    };

    return this.getRecommendations(newRequest);
  }

  /**
   * Get trending gift categories for the current season/time
   */
  async getTrendingCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/gift-trends`);
      const data = await response.json();
      return data.categories || this.getSeasonalCategories();
    } catch (error) {
      console.warn('Could not fetch trending categories, using seasonal defaults');
      return this.getSeasonalCategories();
    }
  }

  /**
   * Validate gift availability before finalizing selection
   */
  async validateGift(giftId: string): Promise<{
    available: boolean;
    currentPrice: number;
    estimatedDelivery: string;
    alternatives?: GiftRecommendation[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/gift-validation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftId })
      });

      return await response.json();
    } catch (error) {
      console.error('Gift validation error:', error);
      return {
        available: true, // Assume available if validation fails
        currentPrice: 0,
        estimatedDelivery: '5-7 business days'
      };
    }
  }

  private calculateAge(birthdate?: string): number | undefined {
    if (!birthdate) return undefined;
    
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  private getSeasonalCategories(): string[] {
    const month = new Date().getMonth();
    
    // Spring (Mar-May)
    if (month >= 2 && month <= 4) {
      return ['gardening', 'outdoor', 'fitness', 'home_decor'];
    }
    // Summer (Jun-Aug)
    if (month >= 5 && month <= 7) {
      return ['outdoor', 'travel', 'sports', 'beach', 'grilling'];
    }
    // Fall (Sep-Nov)
    if (month >= 8 && month <= 10) {
      return ['cozy_home', 'books', 'cooking', 'warm_clothing'];
    }
    // Winter (Dec-Feb)
    return ['cozy_home', 'indoor_hobbies', 'warm_clothing', 'tech'];
  }

  private getFallbackRecommendations(request: GiftRecommendationRequest): RecommendationResponse {
    console.log('🔄 Using fallback recommendations');
    
    const fallbackGifts: GiftRecommendation[] = [
      {
        id: 'fallback-1',
        name: 'Amazon Gift Card',
        description: 'Let them choose exactly what they want',
        price: Math.min(request.budget.max, 50),
        category: 'gift_cards',
        confidence: 0.8,
        reasoning: 'A safe choice that allows the recipient to select their preferred gift',
        tags: ['versatile', 'safe_choice', 'always_appreciated'],
        availability: 'in_stock',
        estimatedDelivery: 'Digital delivery - instant',
        metadata: {
          model: 'fallback',
          promptVersion: '1.0',
          generatedAt: Date.now()
        }
      },
      {
        id: 'fallback-2', 
        name: 'Experience Gift Box',
        description: 'Curated local experiences and activities',
        price: Math.min(request.budget.max * 0.8, 100),
        category: 'experiences',
        confidence: 0.7,
        reasoning: 'Experience gifts create lasting memories and work for most people',
        tags: ['memorable', 'experiential', 'unique'],
        availability: 'in_stock',
        estimatedDelivery: '3-5 business days',
        metadata: {
          model: 'fallback',
          promptVersion: '1.0',
          generatedAt: Date.now()
        }
      }
    ];

    return {
      recommendations: fallbackGifts,
      totalFound: fallbackGifts.length,
      searchMetadata: {
        processingTime: 0,
        confidence: 0.75,
        fallbackUsed: true
      }
    };
  }
}

export const giftRecommendationEngine = new GiftRecommendationEngine(); 