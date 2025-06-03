// Enhanced AI Gift Recommendation Function
// To use this function locally, run:
// npm install @netlify/functions openai zod

import { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_PROD
});

// Validation schemas
const RecipientSchema = z.object({
  name: z.string(),
  age: z.number().optional(),
  relationship: z.string(),
  interests: z.array(z.string()),
  description: z.string().optional(),
  gender: z.string().optional(),
});

const RequestSchema = z.object({
  recipient: RecipientSchema,
  budget: z.number().min(10).max(1000),
  occasion: z.string().optional().default('birthday'),
  pastGifts: z.array(z.object({
    name: z.string(),
    category: z.string(),
    price: z.number().optional(),
  })).optional().default([]),
  preferences: z.object({
    giftWrap: z.boolean().optional().default(true),
    personalNote: z.boolean().optional().default(true),
    deliverySpeed: z.enum(['standard', 'express', 'priority']).optional().default('standard'),
  }).optional().default({}),
});

const GiftSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  price: z.number(),
  reasoning: z.string(),
  purchaseUrl: z.string().optional(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()).optional(),
});

// Enhanced prompt engineering
function createPersonalizedPrompt(data: z.infer<typeof RequestSchema>): string {
  const { recipient, budget, occasion, pastGifts, preferences } = data;
  
  const ageContext = recipient.age ? `${recipient.age} years old` : 'adult';
  const genderContext = recipient.gender ? `who identifies as ${recipient.gender}` : '';
  const pastGiftContext = pastGifts.length > 0 
    ? `Past gifts: ${pastGifts.map(g => `${g.name} (${g.category})`).join(', ')}`
    : 'No past gift history available';
  
  return `You are an expert gift consultant with 20+ years of experience. Your task is to recommend personalized gifts that will genuinely delight the recipient.

RECIPIENT PROFILE:
• Name: ${recipient.name}
• Relationship: ${recipient.relationship}
• Age: ${ageContext} ${genderContext}
• Interests: ${recipient.interests.join(', ')}
• Personality: ${recipient.description || 'No additional details provided'}

OCCASION DETAILS:
• Event: ${occasion}
• Budget: $${budget} (strict limit)
• Gift preferences: ${preferences.giftWrap ? 'Gift wrapping preferred' : 'No gift wrapping needed'}

GIFT HISTORY:
${pastGiftContext}

INSTRUCTIONS:
1. Suggest 5 thoughtful, unique gifts that match the recipient's personality
2. Avoid duplicating past gifts or similar items
3. Focus on emotional impact and personal connection
4. Include specific product names when possible (not generic categories)
5. Ensure all suggestions are under $${budget}
6. Provide clear reasoning for each recommendation
7. Consider the relationship context (${recipient.relationship}) for appropriateness

RESPONSE FORMAT:
Return a JSON array of exactly 5 gift objects with this structure:
{
  "name": "Specific product name",
  "description": "Detailed description (2-3 sentences)",
  "category": "Product category",
  "price": estimated_price_number,
  "reasoning": "Why this gift is perfect for them (1-2 sentences)",
  "confidence": confidence_score_0_to_1,
  "tags": ["relevant", "tags"]
}

Focus on gifts that show thoughtfulness and understanding of who they are as a person.`;
}

const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  try {
    // Validate request body
    if (!event.body) {
      throw new Error('Request body is required');
    }

    const rawData = JSON.parse(event.body);
    const data = RequestSchema.parse(rawData);

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY_PROD) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Generating gift recommendations for ${data.recipient.name} (${data.occasion}, $${data.budget} budget)`);

    // Create personalized prompt
    const prompt = createPersonalizedPrompt(data);

    // Call OpenAI with enhanced parameters
    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // Upgrade to GPT-4 for better reasoning
      messages: [
        { 
          role: 'system', 
          content: 'You are a world-class gift consultant specializing in personalized recommendations. Always respond with valid JSON arrays containing exactly 5 gift suggestions.' 
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.7, // Balanced creativity and consistency
      top_p: 0.9,
      frequency_penalty: 0.3, // Avoid repetitive suggestions
      presence_penalty: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate AI response
    let giftSuggestions;
    try {
      // Try to extract JSON if it's wrapped in markdown
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : responseText;
      
      giftSuggestions = JSON.parse(jsonString);
      
      // Validate each suggestion
      if (!Array.isArray(giftSuggestions)) {
        throw new Error('Response is not an array');
      }

      giftSuggestions = giftSuggestions.map((suggestion: any) => {
        const validated = GiftSuggestionSchema.parse(suggestion);
        
        // Ensure price is within budget
        if (validated.price > data.budget) {
          validated.price = Math.floor(data.budget * 0.9);
        }
        
        return validated;
      });

      // Ensure we have exactly 5 suggestions
      if (giftSuggestions.length < 5) {
        console.warn(`Only received ${giftSuggestions.length} suggestions, expected 5`);
      }
      
      giftSuggestions = giftSuggestions.slice(0, 5);

    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', responseText);
      
      // Fallback to generic suggestions
      giftSuggestions = createFallbackSuggestions(data);
    }

    // Add metadata
    const response = {
      suggestions: giftSuggestions,
      metadata: {
        model: 'gpt-4',
        generated_at: new Date().toISOString(),
        recipient_name: data.recipient.name,
        occasion: data.occasion,
        budget: data.budget,
        request_id: Math.random().toString(36).substring(7),
      }
    };

    console.log(`Successfully generated ${giftSuggestions.length} recommendations for ${data.recipient.name}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Gift recommendation error:', error);
    
    // Return structured error response
    const errorResponse = {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      type: error instanceof z.ZodError ? 'validation_error' : 'system_error',
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: error instanceof z.ZodError ? 400 : 500,
      headers,
      body: JSON.stringify(errorResponse),
    };
  }
};

// Fallback suggestions when AI fails
function createFallbackSuggestions(data: z.infer<typeof RequestSchema>) {
  const budget = data.budget;
  const interests = data.recipient.interests;
  
  return [
    {
      name: 'Premium Gift Card',
      description: `A ${budget <= 50 ? '$25' : '$50'} gift card to a popular retailer, giving them the freedom to choose exactly what they want.`,
      category: 'Gift Cards',
      price: Math.min(budget * 0.5, 50),
      reasoning: 'Gift cards are always appreciated and ensure the recipient gets something they truly want.',
      confidence: 0.8,
      tags: ['safe', 'versatile', 'freedom-of-choice'],
    },
    {
      name: interests.includes('Books') ? 'Bestseller Book Collection' : 'Gourmet Snack Box',
      description: interests.includes('Books') 
        ? 'A curated set of current bestsellers in their favorite genres.'
        : 'An assortment of premium snacks and treats from around the world.',
      category: interests.includes('Books') ? 'Books' : 'Food & Beverage',
      price: Math.min(budget * 0.6, 40),
      reasoning: interests.includes('Books') 
        ? 'Books provide lasting enjoyment and align with their reading interests.'
        : 'Gourmet treats offer a delightful tasting experience.',
      confidence: 0.7,
      tags: interests.includes('Books') ? ['educational', 'entertainment'] : ['delicious', 'variety'],
    },
    {
      name: 'Personalized Photo Frame',
      description: 'A high-quality frame that can be customized with their name or a special message.',
      category: 'Home Decor',
      price: Math.min(budget * 0.4, 35),
      reasoning: 'Personalized items show thoughtfulness and create lasting memories.',
      confidence: 0.75,
      tags: ['personalized', 'memorable', 'home-decor'],
    },
    {
      name: 'Luxury Candle Set',
      description: 'A set of beautifully scented candles in elegant packaging.',
      category: 'Home & Wellness',
      price: Math.min(budget * 0.5, 45),
      reasoning: 'Candles create ambiance and provide relaxation, suitable for most recipients.',
      confidence: 0.7,
      tags: ['relaxing', 'home-ambiance', 'luxury'],
    },
    {
      name: 'Cozy Throw Blanket',
      description: 'A soft, warm throw blanket perfect for relaxing at home.',
      category: 'Home Comfort',
      price: Math.min(budget * 0.7, 60),
      reasoning: 'Comfort items are universally appreciated and provide lasting utility.',
      confidence: 0.8,
      tags: ['comfort', 'practical', 'cozy'],
    },
  ].filter(gift => gift.price <= budget);
}

export { handler }; 