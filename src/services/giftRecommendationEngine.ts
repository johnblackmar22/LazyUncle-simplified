/**
 * Enhanced Gift Recommendation Engine
 * 
 * This service provides sophisticated AI-powered gift recommendations
 * using OpenAI GPT-4 with personalized prompting and structured output.
 */

import type { GiftSuggestion, Recipient, Occasion } from '../types';
import { DEMO_MODE } from './firebase';

// Enhanced gift suggestion interface
export interface EnhancedGiftSuggestion extends GiftSuggestion {
  reasoning?: string;
  purchaseUrl?: string;
  tags?: string[];
}

// AI request interface matching the Netlify function
interface AIRecommendationRequest {
  recipient: {
    name: string;
    age?: number;
    relationship: string;
    interests: string[];
    description?: string;
    gender?: string;
  };
  budget: number;
  occasion?: string;
  pastGifts?: Array<{
    name: string;
    category: string;
    price?: number;
  }>;
  preferences?: {
    giftWrap?: boolean;
    personalNote?: boolean;
    deliverySpeed?: 'standard' | 'express' | 'priority';
  };
}

// AI response interface
interface AIRecommendationResponse {
  suggestions: EnhancedGiftSuggestion[];
  metadata: {
    model: string;
    generated_at: string;
    recipient_name: string;
    occasion: string;
    budget: number;
    request_id: string;
  };
}

/**
 * Get AI-powered gift recommendations with enhanced personalization
 */
export async function getGiftRecommendationsFromAI({ 
  recipient, 
  budget, 
  occasion = 'birthday',
  pastGifts = [], 
  preferences = {} 
}: {
  recipient: Recipient | any;
  budget: number;
  occasion?: string;
  pastGifts?: any[];
  preferences?: any;
}): Promise<EnhancedGiftSuggestion[]> {
  try {
    // Validate inputs
    if (!recipient?.name) {
      throw new Error('Recipient name is required for gift recommendations');
    }
    
    if (!budget || budget <= 0) {
      throw new Error('Valid budget is required for gift recommendations');
    }

    // Use DEMO_MODE to determine if we should use real API
    if (DEMO_MODE) {
      console.log('Using enhanced mock AI recommendations in demo mode');
      return await generateMockRecommendations({ recipient, budget, occasion, pastGifts });
    }
    
    // Prepare request data
    const requestData: AIRecommendationRequest = {
      recipient: {
        name: recipient.name,
        age: recipient.birthdate ? calculateAge(recipient.birthdate) : undefined,
        relationship: recipient.relationship,
        interests: recipient.interests || [],
        description: recipient.description,
        gender: recipient.gender,
      },
      budget,
      occasion,
      pastGifts: pastGifts.map(gift => ({
        name: gift.name,
        category: gift.category,
        price: gift.price,
      })),
      preferences: {
        giftWrap: preferences.giftWrap ?? true,
        personalNote: preferences.personalNote ?? true,
        deliverySpeed: preferences.deliverySpeed ?? 'standard',
      },
    };

    // Debug logging to see what data we have
    console.log('Full recipient object:', {
      name: recipient.name,
      birthdate: recipient.birthdate,
      relationship: recipient.relationship,
      interests: recipient.interests,
      description: recipient.description,
      gender: recipient.gender,
      deliveryAddress: recipient.deliveryAddress,
      anniversary: recipient.anniversary
    });

    console.log(`Requesting AI recommendations for ${recipient.name} (${occasion}, $${budget} budget)`);
    
    // Call the enhanced Netlify function
    const response = await fetch('/.netlify/functions/gift-recommendations-enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Request-ID': `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch gift recommendations`);
    }
    
    const data: AIRecommendationResponse = await response.json();
    
    // Validate response structure
    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid response format from API');
    }
    
    // Additional validation and enhancement
    const validRecommendations = data.suggestions
      .filter(gift => gift.price <= budget)
      .map(gift => ({
        ...gift,
        id: gift.id || `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl: gift.imageUrl || generatePlaceholderImage(gift.category),
        affiliateLink: gift.purchaseUrl,
      }));
    
    if (validRecommendations.length === 0) {
      console.warn('No valid recommendations within budget, falling back to mock data');
      return await generateMockRecommendations({ recipient, budget, occasion, pastGifts });
    }
    
    console.log(`Successfully received ${validRecommendations.length} AI recommendations`);
    return validRecommendations;
    
  } catch (error) {
    console.error('AI gift recommendation error:', error);
    
    // Graceful fallback to mock recommendations
    console.log('Falling back to enhanced mock recommendations');
    return await generateMockRecommendations({ recipient, budget, occasion, pastGifts });
  }
}

/**
 * Generate sophisticated mock recommendations for demo mode
 */
async function generateMockRecommendations({ 
  recipient, 
  budget, 
  occasion, 
  pastGifts 
}: {
  recipient: any;
  budget: number;
  occasion: string;
  pastGifts: any[];
}): Promise<EnhancedGiftSuggestion[]> {
  
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  const interests = recipient.interests || [];
  const relationship = recipient.relationship || 'friend';
  const age = recipient.birthdate ? calculateAge(recipient.birthdate) : 30;
  
  // Avoid past gifts
  const pastGiftNames = pastGifts.map(g => g.name.toLowerCase());
  
  // Create contextual recommendations based on interests and relationship
  const recommendationPool = [
    // Tech & Gadgets
    ...(interests.some((i: string) => ['technology', 'tech', 'gadgets'].includes(i.toLowerCase())) ? [
      {
        name: 'Wireless Charging Station',
        description: 'A sleek 3-in-1 wireless charging station for phone, watch, and earbuds. Perfect for keeping all devices organized and powered up.',
        category: 'Electronics',
        price: Math.min(budget * 0.8, 79),
        reasoning: 'Matches their tech interests and provides daily utility.',
        confidence: 0.9,
        tags: ['practical', 'tech', 'organization'],
      },
      {
        name: 'Smart Home Assistant',
        description: 'Voice-controlled assistant with premium sound quality for music, smart home control, and daily assistance.',
        category: 'Smart Home',
        price: Math.min(budget * 0.9, 99),
        reasoning: 'Great for tech enthusiasts who enjoy automation and convenience.',
        confidence: 0.85,
        tags: ['smart-home', 'voice-control', 'music'],
      }
    ] : []),
    
    // Books & Reading
    ...(interests.some((i: string) => ['books', 'reading', 'literature'].includes(i.toLowerCase())) ? [
      {
        name: 'Premium Book Subscription Box',
        description: 'A 3-month subscription to a curated book box featuring bestsellers, exclusive editions, and bookish goodies.',
        category: 'Subscription',
        price: Math.min(budget * 0.7, 89),
        reasoning: 'Perfect for book lovers who enjoy discovering new titles and authors.',
        confidence: 0.95,
        tags: ['books', 'discovery', 'ongoing-gift'],
      },
      {
        name: 'Personalized Leather Book Journal',
        description: 'A handcrafted leather journal with their name embossed on the cover, perfect for notes, thoughts, and creative writing.',
        category: 'Stationery',
        price: Math.min(budget * 0.6, 65),
        reasoning: 'Combines their love of books with personal expression and creativity.',
        confidence: 0.88,
        tags: ['personalized', 'writing', 'leather-craft'],
      }
    ] : []),
    
    // Food & Cooking
    ...(interests.some((i: string) => ['cooking', 'food', 'culinary', 'baking'].includes(i.toLowerCase())) ? [
      {
        name: 'Artisan Spice Collection',
        description: 'A premium collection of 12 rare and exotic spices from around the world, each with recipe suggestions and origin stories.',
        category: 'Culinary',
        price: Math.min(budget * 0.65, 75),
        reasoning: 'Enhances their cooking adventures with authentic international flavors.',
        confidence: 0.92,
        tags: ['culinary', 'international', 'cooking-enhancement'],
      },
      {
        name: 'Professional Chef\'s Knife',
        description: 'A high-carbon steel chef\'s knife with ergonomic handle, professionally sharpened and ready for serious cooking.',
        category: 'Kitchen Tools',
        price: Math.min(budget * 0.85, 120),
        reasoning: 'Essential tool that any cooking enthusiast would appreciate and use daily.',
        confidence: 0.9,
        tags: ['professional', 'daily-use', 'cooking-essential'],
      }
    ] : []),
    
    // Fitness & Wellness
    ...(interests.some((i: string) => ['fitness', 'yoga', 'health', 'wellness', 'exercise'].includes(i.toLowerCase())) ? [
      {
        name: 'Smart Fitness Tracker',
        description: 'Advanced fitness tracker with heart rate monitoring, sleep tracking, and workout recognition. Waterproof with 7-day battery.',
        category: 'Fitness Tech',
        price: Math.min(budget * 0.9, 149),
        reasoning: 'Perfect for tracking their fitness goals and maintaining an active lifestyle.',
        confidence: 0.87,
        tags: ['health-tracking', 'motivation', 'waterproof'],
      },
      {
        name: 'Premium Yoga Mat Set',
        description: 'Eco-friendly yoga mat with alignment guides, plus matching yoga blocks and strap in a beautiful carrying case.',
        category: 'Fitness Equipment',
        price: Math.min(budget * 0.7, 95),
        reasoning: 'Supports their yoga practice with high-quality, sustainable equipment.',
        confidence: 0.9,
        tags: ['eco-friendly', 'yoga', 'complete-set'],
      }
    ] : []),
    
    // Universal options for any relationship/interest
    {
      name: 'Luxury Candle Collection',
      description: 'A set of 4 premium soy candles with unique scents inspired by different seasons. Burns for 40+ hours each.',
      category: 'Home Fragrance',
      price: Math.min(budget * 0.5, 68),
      reasoning: 'Creates a relaxing atmosphere and works for any home or personal space.',
      confidence: 0.8,
      tags: ['relaxation', 'home-ambiance', 'long-lasting'],
    },
    {
      name: 'Artisan Coffee Subscription',
      description: 'A 3-month subscription to single-origin, freshly roasted coffee beans from small-batch roasters worldwide.',
      category: 'Beverage',
      price: Math.min(budget * 0.8, 95),
      reasoning: 'Perfect for coffee lovers who enjoy trying new flavors and supporting small businesses.',
      confidence: 0.83,
      tags: ['coffee', 'artisan', 'monthly-delivery'],
    },
    {
      name: 'Personalized Star Map',
      description: 'A custom star map showing the exact alignment of stars on a meaningful date, beautifully framed and personalized.',
      category: 'Personalized Art',
      price: Math.min(budget * 0.6, 85),
      reasoning: 'A unique, sentimental gift that captures a special moment in time.',
      confidence: 0.85,
      tags: ['personalized', 'sentimental', 'unique'],
    },
    {
      name: 'Premium Skincare Set',
      description: 'A luxurious skincare collection with cleanser, serum, and moisturizer made from natural, organic ingredients.',
      category: 'Beauty & Wellness',
      price: Math.min(budget * 0.75, 110),
      reasoning: 'Self-care items that promote wellness and show you care about their well-being.',
      confidence: 0.78,
      tags: ['self-care', 'organic', 'daily-luxury'],
    },
    {
      name: 'Cozy Weighted Blanket',
      description: 'A soft, breathable weighted blanket designed to reduce stress and improve sleep quality. Available in multiple weights.',
      category: 'Sleep & Comfort',
      price: Math.min(budget * 0.8, 89),
      reasoning: 'Promotes better sleep and relaxation, beneficial for anyone dealing with stress.',
      confidence: 0.82,
      tags: ['sleep-improvement', 'stress-relief', 'comfort'],
    }
  ];
  
  // Filter by budget and avoid past gifts
  const filteredRecommendations = recommendationPool
    .filter(item => 
      item.price <= budget && 
      !pastGiftNames.some(pastName => 
        item.name.toLowerCase().includes(pastName) || 
        pastName.includes(item.name.toLowerCase())
      )
    )
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  
  // Select top 5 recommendations
  const selectedRecommendations = filteredRecommendations.slice(0, 5);
  
  // If we don't have enough recommendations, add generic fallbacks
  while (selectedRecommendations.length < 5) {
    const fallbackGifts = [
      {
        name: 'Premium Gift Card Bundle',
        description: `A collection of gift cards totaling $${Math.floor(budget * 0.8)} to popular retailers, giving them maximum choice and flexibility.`,
        category: 'Gift Cards',
        price: Math.floor(budget * 0.8),
        reasoning: 'Provides complete freedom to choose exactly what they want.',
        confidence: 0.75,
        tags: ['flexible', 'choice', 'popular-retailers'],
      },
      {
        name: 'Gourmet Food & Wine Pairing',
        description: 'A curated selection of artisanal cheeses, chocolates, and a bottle of wine, beautifully packaged for a special tasting experience.',
        category: 'Gourmet Food',
        price: Math.floor(budget * 0.9),
        reasoning: 'A sophisticated gift that creates a memorable tasting experience.',
        confidence: 0.7,
        tags: ['gourmet', 'experience', 'sophisticated'],
      }
    ];
    
    const nextFallback = fallbackGifts.find(gift => 
      !selectedRecommendations.some(selected => selected.name === gift.name) &&
      gift.price <= budget
    );
    
    if (nextFallback) {
      selectedRecommendations.push(nextFallback);
    } else {
      break;
    }
  }
  
  // Add IDs and image URLs
  return selectedRecommendations.map((gift, index) => ({
    ...gift,
    id: `mock-ai-${Date.now()}-${index}`,
    imageUrl: generatePlaceholderImage(gift.category),
    affiliateLink: `https://example.com/buy/${encodeURIComponent(gift.name)}`,
  }));
}

/**
 * Calculate age from birthdate string
 */
function calculateAge(birthdate?: string): number {
  if (!birthdate) return 30; // Default age
  
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return Math.max(1, age); // Ensure positive age
}

/**
 * Generate placeholder image URL based on category
 */
function generatePlaceholderImage(category: string): string {
  const categoryImages: { [key: string]: string } = {
    'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
    'Books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    'Kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    'Fitness': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    'Home': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    'Fashion': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    'Art': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
    'Food': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
    'Gift Cards': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
  };
  
  return categoryImages[category] || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400';
}

/**
 * Generate a personal message for the gift
 */
export const generateGiftMessage = (recipientName: string, occasion: string, relationship: string): string => {
  const occasions = {
    'birthday': [
      `Happy Birthday, ${recipientName}! Hope this gift brings a smile to your special day.`,
      `Wishing you an amazing birthday, ${recipientName}! Enjoy your gift!`,
      `Happy Birthday to the best ${relationship}! Hope you love this gift.`
    ],
    'christmas': [
      `Merry Christmas, ${recipientName}! Wishing you joy and happiness this holiday season.`,
      `Happy Holidays, ${recipientName}! Hope this gift brings you joy.`,
      `Warmest wishes to you, ${recipientName}, during this festive season!`
    ],
    'anniversary': [
      `Happy Anniversary, ${recipientName}! Here's to many more wonderful years.`,
      `Celebrating another year of love and happiness with you, ${recipientName}.`,
      `Cheers to us, ${recipientName}! Happy Anniversary!`
    ],
    'graduation': [
      `Congratulations on your graduation, ${recipientName}! So proud of your accomplishment.`,
      `Well done, ${recipientName}! Celebrating your hard work and achievement.`,
      `Here's to new beginnings, ${recipientName}! Congrats on your graduation!`
    ]
  };
  
  // Get the appropriate message array based on the occasion
  const occasionKey = Object.keys(occasions).find(key => 
    occasion.toLowerCase().includes(key.toLowerCase())
  ) || 'birthday';
  
  const messages = occasions[occasionKey as keyof typeof occasions];
  
  // Return a random message from the array
  return messages[Math.floor(Math.random() * messages.length)];
}; 