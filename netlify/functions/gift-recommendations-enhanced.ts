// Enhanced AI Gift Recommendation Function - Production Ready
// Multiple strategies, comprehensive monitoring, fallback chains

import { Handler } from '@netlify/functions';

// Enhanced OpenAI client with retry logic
let OpenAI: any = null;
let openai: any = null;

async function initializeOpenAI() {
  if (openai) return openai;
  
  try {
    const OpenAIModule = await import('openai');
    OpenAI = OpenAIModule.default;
    
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_PROD;
    if (!apiKey) {
      console.warn('No OpenAI API key found');
      return null;
    }
    
    openai = new OpenAI({ 
      apiKey,
      timeout: 30000, // 30 second timeout
      maxRetries: 2   // Retry failed requests
    });
    
    console.log('OpenAI initialized with enhanced configuration');
    return openai;
  } catch (error) {
    console.error('Failed to initialize OpenAI:', error);
    return null;
  }
}

// Strategy 1: Simple and fast
function createSimplePrompt(data: any): string {
  const { recipient, budget, occasion } = data;
  return `JSON array of 5 gifts for ${recipient.name}, interests: ${(recipient.interests || []).join(', ')}, budget: $${budget}, occasion: ${occasion}. Format: [{"name":"","description":"","category":"","price":0,"reasoning":"","confidence":0.8,"tags":[]}]`;
}

// Strategy 2: Structured approach
function createStructuredPrompt(data: any): string {
  const { recipient, budget, occasion } = data;
  
  return `Task: Generate gift recommendations
Input: Name=${recipient.name}, Interests=${(recipient.interests || []).join(',')}, Budget=${budget}, Occasion=${occasion}
Output: JSON array only, 5 items, format: [{"name":"product","description":"brief","category":"type","price":number,"reasoning":"why","confidence":0.8,"tags":["tag"]}]
Constraints: price<${budget}, valid JSON only`;
}

// Strategy 3: Function calling (most reliable)
async function callOpenAIWithFunctionCalling(client: any, data: any) {
  const { recipient, budget, occasion } = data;
  
  const functions = [{
    name: "generate_gift_recommendations",
    description: "Generate personalized gift recommendations",
    parameters: {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              price: { type: "number" },
              reasoning: { type: "string" },
              confidence: { type: "number" },
              tags: { type: "array", items: { type: "string" } }
            },
            required: ["name", "description", "category", "price", "reasoning", "confidence", "tags"]
          },
          minItems: 5,
          maxItems: 5
        }
      },
      required: ["recommendations"]
    }
  }];

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Generate 5 gift recommendations for ${recipient.name} (age: ${recipient.age || 'adult'}, relationship: ${recipient.relationship || 'friend'}, interests: ${(recipient.interests || []).join(', ')}) for ${occasion} with budget $${budget}`
    }],
    functions: functions,
    function_call: { name: "generate_gift_recommendations" }
  });

  const functionCall = response.choices[0]?.message?.function_call;
  if (functionCall && functionCall.arguments) {
    const parsed = JSON.parse(functionCall.arguments);
    return parsed.recommendations;
  }
  
  throw new Error('No function call result');
}

// Multi-strategy AI call with fallbacks
async function getAIRecommendations(data: any) {
  const client = await initializeOpenAI();
  if (!client) throw new Error('OpenAI not available');

  const strategies = [
    {
      name: 'function_calling',
      call: () => callOpenAIWithFunctionCalling(client, data)
    },
    {
      name: 'simple_prompt',
      call: async () => {
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: createSimplePrompt(data) }],
          max_tokens: 1000,
          temperature: 0.7
        });
        return JSON.parse(response.choices[0]?.message?.content || '[]');
      }
    },
    {
      name: 'structured_prompt',
      call: async () => {
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: createStructuredPrompt(data) }],
          max_tokens: 1000,
          temperature: 0.7
        });
        return JSON.parse(response.choices[0]?.message?.content || '[]');
      }
    }
  ];

  for (const strategy of strategies) {
    try {
      console.log(`Trying strategy: ${strategy.name}`);
      const result = await Promise.race([
        strategy.call(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
      ]);
      
      if (Array.isArray(result) && result.length > 0) {
        console.log(`Strategy ${strategy.name} succeeded`);
        return { suggestions: result, strategy: strategy.name };
      }
    } catch (error) {
      console.log(`Strategy ${strategy.name} failed:`, error.message);
    }
  }
  
  throw new Error('All AI strategies failed');
}

const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('=== ENHANCED AI RECOMMENDATIONS START ===');
    const startTime = Date.now();
    
    const data = JSON.parse(event.body || '{}');
    console.log('Request data:', {
      recipient: data.recipient?.name,
      budget: data.budget,
      occasion: data.occasion,
      interests: data.recipient?.interests?.length || 0
    });

    // Get AI recommendations with multiple strategies
    const result = await getAIRecommendations(data);
    const endTime = Date.now();
    
    console.log(`AI recommendations generated in ${endTime - startTime}ms using ${result.strategy}`);

    // Clean and validate suggestions
    const cleanSuggestions = result.suggestions.slice(0, 5).map((suggestion: any, index: number) => ({
      id: suggestion.id || `ai-${Date.now()}-${index}`,
      name: String(suggestion.name || `Gift Option ${index + 1}`),
      description: String(suggestion.description || 'A thoughtful gift choice'),
      category: String(suggestion.category || 'General'),
      price: Math.min(Number(suggestion.price || data.budget * 0.5), data.budget),
      reasoning: String(suggestion.reasoning || 'AI recommended based on profile'),
      confidence: Number(suggestion.confidence || 0.8),
      tags: Array.isArray(suggestion.tags) ? suggestion.tags : ['ai-recommended']
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        suggestions: cleanSuggestions,
        metadata: {
          model: 'gpt-4o-mini',
          strategy: result.strategy,
          generated_at: new Date().toISOString(),
          recipient_name: data.recipient?.name,
          occasion: data.occasion,
          budget: data.budget,
          response_time_ms: endTime - startTime,
          request_id: Math.random().toString(36).substring(7),
        }
      }),
    };

  } catch (error) {
    console.error('Enhanced AI function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'ai_failure',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

export { handler }; 