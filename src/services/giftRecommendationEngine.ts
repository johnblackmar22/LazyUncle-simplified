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

// Add shipping and cost calculation utilities
export interface BudgetBreakdown {
  giftBudget: number;
  shippingCost: number;
  giftWrappingCost: number;
  totalBudget: number;
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
  // Add cost breakdown to recommendations
  costBreakdown?: {
    giftPrice: number;
    estimatedShipping: number;
    giftWrapping: number;
    total: number;
  };
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
  
  // Cost calculation - AI handles shipping optimization
  private readonly GIFT_WRAPPING_COST = 4.99;
  
  /**
   * Calculate budget breakdown - AI optimizes for shipping
   * The AI will try to find free shipping options when possible
   */
  private calculateBudgetBreakdown(occasion: Occasion): BudgetBreakdown {
    const totalBudget = occasion.budget || 50;
    
    // Calculate gift wrapping cost if enabled
    const giftWrappingCost = occasion.giftWrap ? this.GIFT_WRAPPING_COST : 0;
    
    // Reserve some budget for potential shipping, but let AI optimize
    const shippingBuffer = Math.min(15, totalBudget * 0.2); // Max $15 or 20% of budget
    const giftBudget = totalBudget - giftWrappingCost - shippingBuffer;
    
    return {
      giftBudget: Math.max(giftBudget, 10), // Minimum $10 for gift
      shippingCost: 0, // AI will optimize for free shipping when possible
      giftWrappingCost,
      totalBudget
    };
  }
  
  /**
   * Calculate estimated total cost - AI provides shipping estimates
   */
  private calculateTotalCost(giftPrice: number, occasion: Occasion, aiShippingEstimate: number = 0): {
    giftPrice: number;
    estimatedShipping: number;
    giftWrapping: number;
    total: number;
  } {
    const wrappingCost = occasion.giftWrap ? this.GIFT_WRAPPING_COST : 0;
    
    return {
      giftPrice,
      estimatedShipping: aiShippingEstimate, // From AI recommendation
      giftWrapping: wrappingCost,
      total: giftPrice + aiShippingEstimate + wrappingCost
    };
  }
  
  /**
   * Get AI-powered gift recommendations
   */
  async getRecommendations(request: GiftRecommendationRequest): Promise<RecommendationResponse> {
    try {
      // Calculate budget breakdown accounting for shipping and gift wrapping
      const budgetBreakdown = this.calculateBudgetBreakdown(request.occasion);
      
      console.log('🤖 Requesting gift recommendations:', {
        recipientName: request.recipient.name,
        occasion: request.occasion.name,
        originalBudget: request.budget,
        adjustedBudgetBreakdown: budgetBreakdown,
        interests: request.recipient.interests
      });

      // Adjust budget constraints for API call
      const adjustedBudget = {
        min: Math.max(5, budgetBreakdown.giftBudget * 0.8), // 80% of available gift budget as minimum
        max: budgetBreakdown.giftBudget // Maximum is just the gift portion
      };

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
          budget: {
            total: budgetBreakdown.totalBudget,
            giftBudget: adjustedBudget.max,
            giftWrap: request.occasion.giftWrap || false
          },
          preferences: {
            excludeCategories: request.excludeCategories || [],
            preferredCategories: request.preferredCategories || [],
            prioritizeFreeShipping: true, // AI should prioritize free shipping options
            maxShippingCost: 15 // Maximum acceptable shipping cost
          },
          instructions: "Find gifts that qualify for free shipping when possible (Amazon Prime, free shipping thresholds, etc.). Include actual shipping cost estimates in your response."
        })
      });

      if (!response.ok) {
        throw new Error(`Recommendation API failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Add cost breakdown to each recommendation using AI-provided shipping estimates
      if (data.recommendations) {
        data.recommendations = data.recommendations.map((rec: any) => ({
          ...rec,
          costBreakdown: this.calculateTotalCost(
            rec.price, 
            request.occasion,
            rec.shippingCost || 0 // Use AI-provided shipping cost, default to 0 (free)
          )
        }));
        
        // Filter out recommendations that exceed total budget
        data.recommendations = data.recommendations.filter((rec: GiftRecommendation) => {
          return rec.costBreakdown!.total <= budgetBreakdown.totalBudget;
        });
      }
      
      console.log('🤖 Received recommendations with cost breakdown:', {
        count: data.recommendations?.length || 0,
        confidence: data.searchMetadata?.confidence,
        budgetBreakdown
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
    
    // Calculate budget breakdown for fallback recommendations
    const budgetBreakdown = this.calculateBudgetBreakdown(request.occasion);
    
    const fallbackGifts: GiftRecommendation[] = [
      {
        id: 'fallback-1',
        name: 'Amazon Gift Card',
        description: 'Let them choose exactly what they want',
        price: Math.min(budgetBreakdown.giftBudget, 50),
        category: 'gift_cards',
        confidence: 0.8,
        reasoning: 'A safe choice that allows the recipient to select their preferred gift',
        tags: ['versatile', 'safe_choice', 'always_appreciated'],
        availability: 'in_stock' as const,
        estimatedDelivery: 'Digital delivery - instant',
        costBreakdown: this.calculateTotalCost(
          Math.min(budgetBreakdown.giftBudget, 50), 
          request.occasion,
          0 // Digital gift cards have no shipping cost
        ),
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
        price: Math.min(budgetBreakdown.giftBudget * 0.8, 100),
        category: 'experiences',
        confidence: 0.7,
        reasoning: 'Experience gifts create lasting memories and work for most people',
        tags: ['memorable', 'experiential', 'unique'],
        availability: 'in_stock' as const,
        estimatedDelivery: '3-5 business days',
        costBreakdown: this.calculateTotalCost(
          Math.min(budgetBreakdown.giftBudget * 0.8, 100), 
          request.occasion,
          0 // Assume free shipping for premium experience boxes
        ),
        metadata: {
          model: 'fallback',
          promptVersion: '1.0',
          generatedAt: Date.now()
        }
      }
    ].filter(gift => gift.costBreakdown.total <= budgetBreakdown.totalBudget);

    console.log('🔄 Fallback recommendations with AI-optimized shipping:', {
      count: fallbackGifts.length,
      budgetBreakdown
    });

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