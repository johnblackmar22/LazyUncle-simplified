"use strict";
const { OpenAI } = require('openai');

const handler = async (event) => {
  console.log('🚀 Function starting...');
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('📝 Parsing request body...');
    const requestData = JSON.parse(event.body || '{}');
    const { recipient, occasion, budget, preferences, instructions } = requestData;
    
    if (!recipient || !occasion || !budget) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing recipient, occasion, or budget' }),
      };
    }

    // Check if OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ No OpenAI API key found');
      throw new Error('OpenAI API key not configured');
    }
    
    console.log('🔑 OpenAI API key found, length:', process.env.OPENAI_API_KEY.length);

    // Initialize OpenAI client
    console.log('🤖 Initializing OpenAI client...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI client initialized');

    // Build a dynamic prompt for the AI
    const prompt = `You are a helpful gift recommendation assistant. Respond only with valid JSON.\n\nHere is the recipient's information:\n- Name: ${recipient.name}\n- Relationship: ${recipient.relationship}\n- Age: ${recipient.age || 'unknown'}\n- Interests: ${recipient.interests?.join(', ') || 'none'}\n- Location: ${recipient.location || 'unknown'}\n\nOccasion:\n- Type: ${occasion.type}\n- Date: ${occasion.date}\n- Significance: ${occasion.significance || 'regular'}\n\nBudget:\n- Total: $${budget.total}\n- Gift Budget: $${budget.giftBudget}\n- Gift Wrap: ${budget.giftWrap ? 'yes' : 'no'}\n\nPreferences:\n- Exclude Categories: ${(preferences?.excludeCategories || []).join(', ') || 'none'}\n- Preferred Categories: ${(preferences?.preferredCategories || []).join(', ') || 'none'}\n- Prioritize Free Shipping: ${preferences?.prioritizeFreeShipping ? 'yes' : 'no'}\n- Max Shipping Cost: $${preferences?.maxShippingCost || 0}\n\nInstructions: ${instructions || 'Find the best gifts for this recipient and occasion. Include actual shipping cost estimates in your response.'}\n\nRespond with JSON: {"recommendations": [{"name": "Gift Name", "price": 25, "description": "Why this gift", "category": "gift_category", "confidence": 0.8, "availability": "in_stock", "estimatedDelivery": "3-5 business days", "costBreakdown": {"giftPrice": 25, "estimatedShipping": 0, "giftWrapping": 0, "total": 25}}]}`;

    // OpenAI API call
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful gift recommendation assistant. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 700,
      temperature: 0.7,
    });
    console.log('✅ OpenAI API call successful');

    const aiResponse = completion.choices[0]?.message?.content;
    console.log('📋 AI Response length:', aiResponse?.length || 0);

    // Try to parse AI response
    let recommendations = [];
    try {
      const parsed = JSON.parse(aiResponse || '{}');
      recommendations = parsed.recommendations || [];
      console.log('✅ AI response parsed, recommendations:', recommendations.length);
    } catch (parseError) {
      console.log('⚠️ Failed to parse AI response, using fallback');
      recommendations = [
        {
          id: 'fallback-1',
          name: 'Amazon Gift Card',
          description: 'Let them choose what they want',
          price: 25,
          category: 'gift_cards',
          confidence: 0.8
        }
      ];
    }

    // Simple success response
    console.log('🎉 Returning success response');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: true,
        recommendations: recommendations,
        debug: {
          functionWorking: true,
          openaiConnected: true,
          timestamp: new Date().toISOString()
        }
      }),
    };

  } catch (error) {
    console.error('💥 Function error:', error);
    console.error('💥 Error stack:', error.stack);

    // Always return success with fallback to avoid 502
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: true,
        recommendations: [
          {
            id: 'fallback-1',
            name: 'Amazon Gift Card',
            description: 'A safe choice when AI is unavailable',
            price: 25,
            category: 'gift_cards',
            confidence: 0.8,
            availability: 'in_stock',
            estimatedDelivery: 'Digital delivery - instant',
            costBreakdown: {
              giftPrice: 25,
              estimatedShipping: 0,
              giftWrapping: 0,
              total: 25
            }
          },
          {
            id: 'fallback-2',
            name: 'Experience Gift Box',
            description: 'Create lasting memories',
            price: 35,
            category: 'experiences',
            confidence: 0.7,
            availability: 'in_stock',
            estimatedDelivery: '3-5 business days',
            costBreakdown: {
              giftPrice: 35,
              estimatedShipping: 0,
              giftWrapping: 0,
              total: 35
            }
          }
        ],
        debug: {
          functionWorking: true,
          error: error.message,
          fallbackUsed: true,
          timestamp: new Date().toISOString()
        }
      }),
    };
  }
};

module.exports = { handler };
