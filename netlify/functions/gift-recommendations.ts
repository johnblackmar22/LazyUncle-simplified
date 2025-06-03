// Enhanced AI Gift Recommendation Function
// To use this function locally, run:
// npm install @netlify/functions openai

import { Handler } from '@netlify/functions';

// Dynamic import of OpenAI to handle module loading issues
let OpenAI: any = null;
let openai: any = null;

// Initialize OpenAI only if needed and available
async function initializeOpenAI() {
  if (openai) return openai;
  
  try {
    console.log('Attempting to load OpenAI module...');
    const OpenAIModule = await import('openai');
    OpenAI = OpenAIModule.default;
    
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_PROD;
    if (!apiKey) {
      console.warn('No OpenAI API key found - will use fallback recommendations');
      return null;
    }
    
    openai = new OpenAI({ apiKey });
    console.log('OpenAI initialized successfully');
    return openai;
  } catch (error) {
    console.error('Failed to initialize OpenAI:', error);
    return null;
  }
}

// Enhanced prompt engineering
function createPersonalizedPrompt(data: any): string {
  const { recipient, budget, occasion, pastGifts, preferences } = data;
  
  const ageContext = recipient.age ? `${recipient.age} years old` : 'adult';
  const genderContext = recipient.gender ? `who identifies as ${recipient.gender}` : '';
  const pastGiftContext = pastGifts && pastGifts.length > 0 
    ? `Past gifts: ${pastGifts.map((g: any) => `${g.name} (${g.category})`).join(', ')}`
    : 'No past gift history available';
  
  return `You are an expert gift consultant with 20+ years of experience. Your task is to recommend personalized gifts that will genuinely delight the recipient.

RECIPIENT PROFILE:
• Name: ${recipient.name}
• Relationship: ${recipient.relationship}
• Age: ${ageContext} ${genderContext}
• Interests: ${(recipient.interests || []).join(', ')}
• Personality: ${recipient.description || 'No additional details provided'}

OCCASION DETAILS:
• Event: ${occasion}
• Budget: $${budget} (strict limit)
• Gift preferences: ${preferences?.giftWrap ? 'Gift wrapping preferred' : 'No gift wrapping needed'}

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
    console.log('=== GIFT RECOMMENDATIONS FUNCTION START ===');
    
    // Validate request body
    if (!event.body) {
      throw new Error('Request body is required');
    }

    const data = JSON.parse(event.body);
    console.log('Request data received:', {
      recipientName: data.recipient?.name,
      budget: data.budget,
      occasion: data.occasion
    });

    // Basic validation
    if (!data.recipient?.name) {
      throw new Error('Recipient name is required');
    }
    
    if (!data.budget || data.budget <= 0) {
      throw new Error('Valid budget is required');
    }

    console.log(`Generating gift recommendations for ${data.recipient.name} (${data.occasion}, $${data.budget} budget)`);

    // Try to use OpenAI
    let giftSuggestions;
    const openaiClient = await initializeOpenAI();
    
    if (openaiClient) {
      try {
        console.log('Using OpenAI for recommendations...');
        
        // Create personalized prompt
        const prompt = createPersonalizedPrompt(data);

        // Call OpenAI with enhanced parameters
        console.log('Calling OpenAI API...');
        const completion = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a world-class gift consultant specializing in personalized recommendations. Always respond with valid JSON arrays containing exactly 5 gift suggestions.' 
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1500,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.1,
        });

        const responseText = completion.choices[0]?.message?.content?.trim();
        console.log('OpenAI response received, length:', responseText?.length);
        
        if (!responseText) {
          throw new Error('No response from OpenAI');
        }

        // Parse and validate AI response
        try {
          // Try to extract JSON if it's wrapped in markdown
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          const jsonString = jsonMatch ? jsonMatch[1] : responseText;
          
          giftSuggestions = JSON.parse(jsonString);
          
          // Basic validation
          if (!Array.isArray(giftSuggestions)) {
            throw new Error('Response is not an array');
          }

          // Ensure price is within budget and add required fields
          giftSuggestions = giftSuggestions.map((suggestion: any) => {
            if (suggestion.price > data.budget) {
              suggestion.price = Math.floor(data.budget * 0.9);
            }
            
            // Add missing fields if needed
            suggestion.id = suggestion.id || `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            return suggestion;
          });

          // Ensure we have exactly 5 suggestions
          if (giftSuggestions.length < 5) {
            console.warn(`Only received ${giftSuggestions.length} suggestions, expected 5`);
          }
          
          giftSuggestions = giftSuggestions.slice(0, 5);
          console.log(`Successfully generated ${giftSuggestions.length} AI recommendations`);

        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          console.error('Raw response:', responseText);
          throw parseError;
        }
        
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        throw openaiError;
      }
      
    } else {
      console.log('OpenAI not available, using fallback recommendations');
      throw new Error('OpenAI not available');
    }

    // Add metadata
    const response = {
      suggestions: giftSuggestions,
      metadata: {
        model: 'gpt-4o-mini',
        generated_at: new Date().toISOString(),
        recipient_name: data.recipient.name,
        occasion: data.occasion,
        budget: data.budget,
        request_id: Math.random().toString(36).substring(7),
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Gift recommendation error:', error);
    
    // Fallback to sophisticated mock recommendations
    console.log('Falling back to enhanced mock recommendations');
    
    try {
      const data = JSON.parse(event.body || '{}');
      const fallbackSuggestions = createFallbackSuggestions(data);
      
      const fallbackResponse = {
        suggestions: fallbackSuggestions,
        metadata: {
          model: 'fallback',
          generated_at: new Date().toISOString(),
          recipient_name: data.recipient?.name || 'Unknown',
          occasion: data.occasion || 'birthday',
          budget: data.budget || 50,
          request_id: Math.random().toString(36).substring(7),
          fallback_reason: error instanceof Error ? error.message : 'Unknown error',
        }
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(fallbackResponse),
      };
      
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      
      // Return structured error response
      const errorResponse = {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        type: 'system_error',
        timestamp: new Date().toISOString(),
      };

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify(errorResponse),
      };
    }
  }
};

// Fallback suggestions when AI fails
function createFallbackSuggestions(data: any) {
  const budget = data.budget || 50;
  const interests = data.recipient?.interests || [];
  
  return [
    {
      id: `fallback-${Date.now()}-1`,
      name: 'Premium Gift Card',
      description: `A ${budget <= 50 ? '$25' : '$50'} gift card to a popular retailer, giving them the freedom to choose exactly what they want.`,
      category: 'Gift Cards',
      price: Math.min(budget * 0.5, 50),
      reasoning: 'Gift cards are always appreciated and ensure the recipient gets something they truly want.',
      confidence: 0.8,
      tags: ['safe', 'versatile', 'freedom-of-choice'],
    },
    {
      id: `fallback-${Date.now()}-2`,
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
      id: `fallback-${Date.now()}-3`,
      name: 'Personalized Photo Frame',
      description: 'A high-quality frame that can be customized with their name or a special message.',
      category: 'Home Decor',
      price: Math.min(budget * 0.4, 35),
      reasoning: 'Personalized items show thoughtfulness and create lasting memories.',
      confidence: 0.75,
      tags: ['personalized', 'memorable', 'home-decor'],
    },
    {
      id: `fallback-${Date.now()}-4`,
      name: 'Luxury Candle Set',
      description: 'A set of beautifully scented candles in elegant packaging.',
      category: 'Home & Wellness',
      price: Math.min(budget * 0.5, 45),
      reasoning: 'Candles create ambiance and provide relaxation, suitable for most recipients.',
      confidence: 0.7,
      tags: ['relaxing', 'home-ambiance', 'luxury'],
    },
    {
      id: `fallback-${Date.now()}-5`,
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