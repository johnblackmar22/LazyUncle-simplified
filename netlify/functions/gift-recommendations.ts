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
  const { recipient, budget, occasion } = data;
  
  // Extremely explicit prompt for JSON generation
  return `You must respond with ONLY a valid JSON array. No explanations, no markdown, no text before or after.

Generate exactly 5 gift recommendations for:
- Name: ${recipient.name}
- Interests: ${(recipient.interests || []).join(', ')}
- Age: ${recipient.age || 'adult'}
- Relationship: ${recipient.relationship || 'friend'}
- Occasion: ${occasion}
- Budget: $${budget}

Respond with ONLY this JSON array format:
[
  {
    "name": "specific product name",
    "description": "brief description under 80 chars",
    "category": "product category",
    "price": 25,
    "reasoning": "why this fits their interests",
    "confidence": 0.9,
    "tags": ["tag1", "tag2"]
  }
]

All prices must be under $${budget}. Return ONLY the JSON array, nothing else.`;
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
    
    // Add a small delay to prevent rapid-fire requests
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Validate request body
    if (!event.body) {
      throw new Error('Request body is required');
    }

    const data = JSON.parse(event.body);
    console.log('Request data received:', {
      recipientName: data.recipient?.name,
      budget: data.budget,
      occasion: data.occasion,
      interests: data.recipient?.interests,
      relationship: data.recipient?.relationship,
      age: data.recipient?.age,
      description: data.recipient?.description,
      gender: data.recipient?.gender,
      pastGifts: data.pastGifts?.length || 0
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

        // Call OpenAI with enhanced parameters and timeout
        console.log('Calling OpenAI API...');
        const startTime = Date.now();
        
        // Add timeout wrapper for OpenAI call
        const openaiPromise = openaiClient.chat.completions.create({
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
        
        console.log('OpenAI promise created, waiting for response...');

        // Timeout after 8 seconds (faster prompt should complete quicker)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI API timeout after 8 seconds')), 8000)
        );

        const completion = await Promise.race([openaiPromise, timeoutPromise]) as any;
        const endTime = Date.now();
        console.log(`OpenAI API call completed in ${endTime - startTime}ms`);

        const responseText = completion.choices[0]?.message?.content?.trim();
        console.log('OpenAI response received, length:', responseText?.length);
        console.log('Raw OpenAI response:', responseText?.substring(0, 500) + '...');
        
        if (!responseText) {
          throw new Error('No response from OpenAI');
        }

        // Parse and validate AI response with robust error handling
        try {
          let parsedResponse;
          
          // Method 1: Try direct JSON parse
          try {
            parsedResponse = JSON.parse(responseText);
          } catch (directParseError) {
            console.log('Direct JSON parse failed, trying markdown extraction...');
            
            // Method 2: Extract JSON from markdown code blocks
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              try {
                parsedResponse = JSON.parse(jsonMatch[1]);
                console.log('Successfully parsed JSON from markdown');
              } catch (markdownParseError) {
                console.log('Markdown JSON parse failed, trying array extraction...');
                
                // Method 3: Look for array pattern
                const arrayMatch = responseText.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                  parsedResponse = JSON.parse(arrayMatch[0]);
                  console.log('Successfully parsed JSON array');
                } else {
                  throw new Error('No valid JSON found in response');
                }
              }
            } else {
              throw new Error('No JSON or markdown code blocks found');
            }
          }
          
          giftSuggestions = Array.isArray(parsedResponse) ? parsedResponse : [parsedResponse];
          
          // Basic validation and cleanup
          if (giftSuggestions.length === 0) {
            throw new Error('Empty suggestions array');
          }

          // Ensure price is within budget and add required fields
          giftSuggestions = giftSuggestions.map((suggestion: any, index: number) => {
            // Clean up the suggestion object
            const cleanSuggestion = {
              id: suggestion.id || `ai-${Date.now()}-${index}`,
              name: String(suggestion.name || `Gift Suggestion ${index + 1}`),
              description: String(suggestion.description || 'A thoughtful gift choice'),
              category: String(suggestion.category || 'General'),
              price: Math.min(Number(suggestion.price || data.budget * 0.5), data.budget),
              reasoning: String(suggestion.reasoning || 'Recommended based on interests'),
              confidence: Number(suggestion.confidence || 0.8),
              tags: Array.isArray(suggestion.tags) ? suggestion.tags : ['thoughtful']
            };
            
            return cleanSuggestion;
          });

          // Ensure we have exactly 5 suggestions
          giftSuggestions = giftSuggestions.slice(0, 5);
          
          // Add more suggestions if we don't have enough
          while (giftSuggestions.length < 5) {
            const index = giftSuggestions.length;
            giftSuggestions.push({
              id: `ai-supplement-${Date.now()}-${index}`,
              name: `Additional Gift Option ${index + 1}`,
              description: `A carefully selected gift option within your $${data.budget} budget`,
              category: 'General',
              price: Math.floor(data.budget * 0.7),
              reasoning: 'AI-assisted recommendation to complete your options',
              confidence: 0.75,
              tags: ['ai-recommended']
            });
          }
          
          console.log(`Successfully generated ${giftSuggestions.length} AI recommendations`);

        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          console.error('Raw response that failed to parse:', responseText);
          
          // Log the exact error for debugging
          console.error('Parse error details:', {
            error: parseError.message,
            responseLength: responseText?.length,
            responseStart: responseText?.substring(0, 200),
            responseEnd: responseText?.substring(-200)
          });
          
          throw new Error(`Failed to parse AI response: ${parseError.message}`);
        }
        
      } catch (openaiError: any) {
        console.error('OpenAI API error:', openaiError);
        
        // Handle specific error types
        if (openaiError?.message?.includes('timeout')) {
          console.log('OpenAI API timeout - using fallback recommendations');
          throw new Error('OpenAI timeout - using fallback');
        }
        
        if (openaiError?.status === 429) {
          console.log('Rate limit hit, using fallback recommendations');
          throw new Error('OpenAI rate limit - using fallback');
        }
        
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