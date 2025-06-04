// Enhanced AI Gift Recommendation Function with Improved Reliability
// Handles intermittent OpenAI API issues with retry logic and circuit breaker

import { Handler } from '@netlify/functions';

// Dynamic import of OpenAI to handle module loading issues
let OpenAI: any = null;
let openai: any = null;

// Circuit breaker state
let circuitBreakerState = {
  failureCount: 0,
  lastFailureTime: 0,
  state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN'
};

const CIRCUIT_BREAKER_THRESHOLD = 3; // failures before opening circuit
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute before trying again
const REQUEST_TIMEOUT = 12000; // 12 seconds timeout (increased)
const MAX_RETRIES = 2; // retry failed requests

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
    
    openai = new OpenAI({ 
      apiKey,
      timeout: REQUEST_TIMEOUT,
      maxRetries: 0 // We handle retries manually
    });
    
    console.log('OpenAI initialized successfully');
    return openai;
  } catch (error) {
    console.error('Failed to initialize OpenAI:', error);
    return null;
  }
}

// Circuit breaker logic
function checkCircuitBreaker(): boolean {
  const now = Date.now();
  
  switch (circuitBreakerState.state) {
    case 'OPEN':
      if (now - circuitBreakerState.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
        circuitBreakerState.state = 'HALF_OPEN';
        console.log('Circuit breaker moved to HALF_OPEN state');
        return true;
      }
      console.log('Circuit breaker is OPEN, blocking request');
      return false;
      
    case 'HALF_OPEN':
    case 'CLOSED':
      return true;
      
    default:
      return true;
  }
}

function recordSuccess() {
  circuitBreakerState.failureCount = 0;
  circuitBreakerState.state = 'CLOSED';
  console.log('Circuit breaker reset to CLOSED state');
}

function recordFailure() {
  circuitBreakerState.failureCount++;
  circuitBreakerState.lastFailureTime = Date.now();
  
  if (circuitBreakerState.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerState.state = 'OPEN';
    console.log(`Circuit breaker OPENED after ${circuitBreakerState.failureCount} failures`);
  } else {
    console.log(`Circuit breaker failure count: ${circuitBreakerState.failureCount}`);
  }
}

// Enhanced prompt engineering with retry-friendly structure
function createPersonalizedPrompt(data: any): string {
  const { recipient, budget, occasion } = data;
  
  return `You are an expert gift consultant. Respond with ONLY a valid JSON array of exactly 5 gift recommendations.

RECIPIENT PROFILE:
- Name: ${recipient.name}
- Interests: ${(recipient.interests || []).join(', ') || 'general'}
- Age: ${recipient.age || 'adult'}
- Relationship: ${recipient.relationship || 'friend'}
- Gender: ${recipient.gender || 'unspecified'}

REQUIREMENTS:
- Occasion: ${occasion}
- Budget: Maximum $${budget} per gift
- Format: JSON array only, no markdown, no explanations

RESPONSE FORMAT (copy exactly):
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

Generate exactly 5 recommendations. All prices must be under $${budget}. Return ONLY the JSON array.`;
}

// Enhanced retry logic with exponential backoff
async function makeOpenAIRequestWithRetry(openaiClient: any, prompt: string, retryCount = 0): Promise<any> {
  try {
    console.log(`Making OpenAI request (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    const startTime = Date.now();
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
    );
    
    // Create API call promise
    const apiPromise = openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional gift consultant. Always respond with valid JSON arrays containing exactly 5 gift suggestions. Never include markdown formatting or explanations outside the JSON.' 
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.1,
    });
    
    // Race between API call and timeout
    const completion = await Promise.race([apiPromise, timeoutPromise]);
    
    const endTime = Date.now();
    console.log(`OpenAI API call completed in ${endTime - startTime}ms`);
    
    recordSuccess(); // Mark circuit breaker as successful
    return completion;
    
  } catch (error: any) {
    console.error(`OpenAI request failed (attempt ${retryCount + 1}):`, error?.message || error);
    
    // Check if we should retry
    if (retryCount < MAX_RETRIES) {
      const isRetryableError = 
        error?.message?.includes('timeout') ||
        error?.status === 429 || // Rate limit
        error?.status === 502 || // Bad gateway
        error?.status === 503 || // Service unavailable
        error?.status === 504 || // Gateway timeout
        !error?.status; // Network errors
      
      if (isRetryableError) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeOpenAIRequestWithRetry(openaiClient, prompt, retryCount + 1);
      }
    }
    
    recordFailure(); // Mark circuit breaker failure
    throw error;
  }
}

const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Request-ID',
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

  const requestId = event.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`=== ENHANCED GIFT RECOMMENDATIONS START (${requestId}) ===`);
    
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
      requestId
    });

    // Basic validation
    if (!data.recipient?.name) {
      throw new Error('Recipient name is required');
    }
    
    if (!data.budget || data.budget <= 0) {
      throw new Error('Valid budget is required');
    }

    console.log(`Generating recommendations for ${data.recipient.name} (${data.occasion}, $${data.budget} budget)`);

    // Check circuit breaker before attempting API call
    let giftSuggestions;
    const openaiClient = await initializeOpenAI();
    
    if (openaiClient && checkCircuitBreaker()) {
      try {
        console.log('Using OpenAI for recommendations...');
        
        const prompt = createPersonalizedPrompt(data);
        const completion = await makeOpenAIRequestWithRetry(openaiClient, prompt);

        const responseText = completion.choices[0]?.message?.content?.trim();
        console.log('OpenAI response received, length:', responseText?.length);
        
        if (!responseText) {
          throw new Error('No response from OpenAI');
        }

        // Enhanced JSON parsing with multiple fallback strategies
        try {
          let parsedResponse;
          
          // Strategy 1: Direct JSON parse
          try {
            parsedResponse = JSON.parse(responseText);
          } catch (directParseError) {
            console.log('Direct JSON parse failed, trying cleanup...');
            
            // Strategy 2: Clean up common formatting issues
            let cleanedText = responseText
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .replace(/^\s*[\w\s]*?(\[)/g, '$1') // Remove text before array
              .replace(/(\])\s*[\w\s]*?$/g, '$1') // Remove text after array
              .trim();
            
            try {
              parsedResponse = JSON.parse(cleanedText);
            } catch (cleanupParseError) {
              console.log('Cleanup parse failed, trying array extraction...');
              
              // Strategy 3: Extract JSON array pattern
              const arrayMatch = cleanedText.match(/\[[\s\S]*?\]/);
              if (arrayMatch) {
                parsedResponse = JSON.parse(arrayMatch[0]);
              } else {
                throw new Error('No valid JSON array found in response');
              }
            }
          }
          
          giftSuggestions = Array.isArray(parsedResponse) ? parsedResponse : [parsedResponse];
          
          // Validation and enhancement
          if (giftSuggestions.length === 0) {
            throw new Error('Empty suggestions array');
          }

          // Clean and validate each suggestion
          giftSuggestions = giftSuggestions
            .map((suggestion: any, index: number) => ({
              id: suggestion.id || `ai-enhanced-${Date.now()}-${index}`,
              name: String(suggestion.name || `Gift Option ${index + 1}`),
              description: String(suggestion.description || 'A thoughtful gift choice'),
              category: String(suggestion.category || 'AI Recommended'),
              price: Math.min(Number(suggestion.price || data.budget * 0.7), data.budget),
              reasoning: String(suggestion.reasoning || 'AI-recommended based on profile'),
              confidence: Number(suggestion.confidence || 0.8),
              tags: Array.isArray(suggestion.tags) ? suggestion.tags : ['ai-recommended'],
              imageUrl: suggestion.imageUrl || generatePlaceholderImage(suggestion.category || 'gift')
            }))
            .filter(gift => gift.price > 0 && gift.price <= data.budget)
            .slice(0, 5);

          // Ensure we have exactly 5 suggestions
          while (giftSuggestions.length < 5) {
            const index = giftSuggestions.length;
            giftSuggestions.push({
              id: `ai-supplement-${Date.now()}-${index}`,
              name: `Curated Gift Option ${index + 1}`,
              description: `A carefully selected gift within your $${data.budget} budget`,
              category: 'Curated',
              price: Math.floor(data.budget * (0.5 + Math.random() * 0.4)),
              reasoning: 'Professional recommendation to complete your options',
              confidence: 0.75,
              tags: ['curated', 'quality'],
              imageUrl: generatePlaceholderImage('gift')
            });
          }
          
          console.log(`✅ Successfully generated ${giftSuggestions.length} AI recommendations`);

        } catch (parseError) {
          console.error('JSON parsing failed with all strategies:', parseError);
          throw new Error(`Failed to parse AI response: ${parseError.message}`);
        }
        
      } catch (openaiError: any) {
        console.error('OpenAI API error:', openaiError);
        throw new Error(`OpenAI API failed: ${openaiError.message}`);
      }
      
    } else {
      const reason = !openaiClient ? 'OpenAI not available' : 'Circuit breaker open';
      console.log(`${reason}, using enhanced fallback recommendations`);
      throw new Error(reason);
    }

    // Successful response
    const response = {
      suggestions: giftSuggestions,
      metadata: {
        model: 'gpt-4o-mini',
        generated_at: new Date().toISOString(),
        recipient_name: data.recipient.name,
        occasion: data.occasion,
        budget: data.budget,
        request_id: requestId,
        circuit_breaker_state: circuitBreakerState.state,
        fallback_used: false
      }
    };

    console.log(`✅ Successfully completed request ${requestId}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error(`❌ Request ${requestId} failed:`, error);
    
    // Enhanced fallback recommendations
    try {
      const data = JSON.parse(event.body || '{}');
      const fallbackSuggestions = createEnhancedFallbackSuggestions(data);
      
      const fallbackResponse = {
        suggestions: fallbackSuggestions,
        metadata: {
          model: 'enhanced-fallback',
          generated_at: new Date().toISOString(),
          recipient_name: data.recipient?.name || 'Unknown',
          occasion: data.occasion || 'birthday',
          budget: data.budget || 50,
          request_id: requestId,
          circuit_breaker_state: circuitBreakerState.state,
          fallback_used: true,
          fallback_reason: error instanceof Error ? error.message : 'Unknown error',
        }
      };

      console.log(`✅ Fallback response generated for request ${requestId}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(fallbackResponse),
      };
      
    } catch (fallbackError) {
      console.error('Fallback generation failed:', fallbackError);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Service temporarily unavailable',
          request_id: requestId,
          timestamp: new Date().toISOString(),
        }),
      };
    }
  }
};

// Enhanced fallback suggestions with better personalization
function createEnhancedFallbackSuggestions(data: any) {
  const budget = data.budget || 50;
  const interests = data.recipient?.interests || [];
  const relationship = data.recipient?.relationship || 'friend';
  const occasion = data.occasion || 'birthday';
  
  // Interest-based suggestions
  const interestGifts = {
    'gaming': [
      { name: 'Gaming Mouse Pad', category: 'Gaming', price: 25, description: 'Large RGB gaming mouse pad' },
      { name: 'Gaming Headset Stand', category: 'Gaming', price: 35, description: 'Stylish headset stand with USB hub' }
    ],
    'books': [
      { name: 'Book Light', category: 'Reading', price: 20, description: 'Rechargeable LED book reading light' },
      { name: 'Bookmarks Set', category: 'Reading', price: 15, description: 'Beautiful magnetic bookmarks set' }
    ],
    'cooking': [
      { name: 'Spice Rack', category: 'Kitchen', price: 45, description: 'Rotating bamboo spice organizer' },
      { name: 'Measuring Cups Set', category: 'Kitchen', price: 25, description: 'Stainless steel measuring cups' }
    ],
    'fitness': [
      { name: 'Water Bottle', category: 'Fitness', price: 30, description: 'Insulated stainless steel water bottle' },
      { name: 'Resistance Bands', category: 'Fitness', price: 20, description: 'Set of exercise resistance bands' }
    ]
  };
  
  const baseGifts = [
    {
      name: 'Premium Gift Card',
      description: `${budget <= 50 ? '$25' : '$50'} gift card to a popular retailer`,
      category: 'Gift Cards',
      price: Math.min(budget * 0.5, 50),
      reasoning: 'Gift cards ensure the recipient gets exactly what they want',
      confidence: 0.9,
      tags: ['versatile', 'safe-choice']
    },
    {
      name: 'Artisan Candle Collection',
      description: 'Set of 3 beautifully scented soy candles',
      category: 'Home & Wellness',
      price: Math.min(budget * 0.6, 45),
      reasoning: 'Candles create ambiance and are universally appreciated',
      confidence: 0.8,
      tags: ['relaxing', 'home-decor']
    },
    {
      name: 'Gourmet Coffee/Tea Set',
      description: 'Premium coffee or tea tasting collection',
      category: 'Food & Beverage',
      price: Math.min(budget * 0.7, 40),
      reasoning: 'Quality beverages are enjoyed daily and show thoughtfulness',
      confidence: 0.8,
      tags: ['consumable', 'daily-use']
    },
    {
      name: 'Luxury Hand Cream Set',
      description: 'Moisturizing hand creams in elegant packaging',
      category: 'Personal Care',
      price: Math.min(budget * 0.4, 30),
      reasoning: 'Self-care items are practical and show you care about their wellbeing',
      confidence: 0.7,
      tags: ['self-care', 'practical']
    },
    {
      name: 'Photo Frame with Custom Engraving',
      description: 'Elegant frame that can be personalized with names or dates',
      category: 'Home Decor',
      price: Math.min(budget * 0.5, 35),
      reasoning: 'Personalized items create lasting memories and show extra thought',
      confidence: 0.8,
      tags: ['personalized', 'memorable']
    }
  ];
  
  // Add interest-specific gifts if applicable
  const relevantInterestGifts = interests.flatMap((interest: string) => 
    interestGifts[interest.toLowerCase()] || []
  ).slice(0, 2);
  
  const allGifts = [...baseGifts, ...relevantInterestGifts]
    .filter(gift => gift.price <= budget)
    .slice(0, 5)
    .map((gift, index) => ({
      id: `fallback-enhanced-${Date.now()}-${index}`,
      ...gift,
      imageUrl: generatePlaceholderImage(gift.category)
    }));
  
  // Ensure we have exactly 5 gifts
  while (allGifts.length < 5) {
    const index = allGifts.length;
    allGifts.push({
      id: `fallback-generic-${Date.now()}-${index}`,
      name: `Quality Gift Option ${index + 1}`,
      description: `A thoughtfully selected gift for ${occasion}`,
      category: 'General',
      price: Math.floor(budget * (0.4 + Math.random() * 0.4)),
      reasoning: `A reliable choice for ${relationship} on ${occasion}`,
      confidence: 0.7,
      tags: ['quality', 'reliable'],
      imageUrl: generatePlaceholderImage('gift')
    });
  }
  
  return allGifts;
}

// Generate placeholder images
function generatePlaceholderImage(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'gaming': 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Gaming',
    'books': 'https://via.placeholder.com/300x200/DC2626/FFFFFF?text=Books',
    'kitchen': 'https://via.placeholder.com/300x200/059669/FFFFFF?text=Kitchen',
    'fitness': 'https://via.placeholder.com/300x200/7C2D12/FFFFFF?text=Fitness',
    'home-decor': 'https://via.placeholder.com/300x200/7C3AED/FFFFFF?text=Home',
    'gift': 'https://via.placeholder.com/300x200/6B7280/FFFFFF?text=Gift'
  };
  
  return categoryMap[category.toLowerCase()] || categoryMap['gift'];
}

export { handler }; 