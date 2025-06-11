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
    const { recipient, occasion, budget, preferences, instructions, previousGiftNames } = requestData;
    
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

    // Build a simple, focused prompt for gift ideas
    const prompt = `Generate exactly 2 gift recommendations for Amazon.

Recipient: ${recipient.age}-year-old ${recipient.relationship}${recipient.description ? `
About them: ${recipient.description}` : ''}${recipient.interests && recipient.interests.length > 0 ? `
Interests: ${recipient.interests.join(', ')}` : ''}

Occasion: ${occasion.name}
TOTAL BUDGET: $${budget.total} (includes ALL costs - gift + shipping + fees)

CRITICAL PRICING RULES:
- Maximum gift price: $${Math.round(budget.total * 0.9)} (to allow for shipping/fees)
- Recommend gifts in the $${Math.round(budget.total * 0.5)}-$${Math.round(budget.total * 0.9)} range
- Consider shipping costs will add $5-15 to each item

Requirements:
- Exactly 2 recommendations  
- Real products available on Amazon
- Include brand names when helpful
- STAY WELL UNDER the total budget of $${budget.total}

Respond in JSON format:
{"recommendations": [{"name": "Product Name", "description": "Why it's perfect", "price": 45, "category": "Books", "reasoning": "Explanation"}, {"name": "Second Product", "description": "Why it's great", "price": 38, "category": "Home", "reasoning": "Why this fits"}]}`;

    console.log('🤖 Getting gift ideas from AI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a creative gift recommendation assistant. Generate thoughtful gift ideas that can be found on Amazon. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.9,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    console.log('📋 AI Response length:', aiResponse?.length || 0);
    console.log('📋 Full AI Response:', aiResponse);

    // Try to parse AI response
    let recommendations = [];
    try {
      const parsed = JSON.parse(aiResponse || '{}');
      console.log('🔍 Parsed JSON from AI:', JSON.stringify(parsed, null, 2));
      recommendations = parsed.recommendations || [];
      console.log('✅ AI response parsed successfully');
      console.log('📊 Number of recommendations from AI:', recommendations.length);
      console.log('📝 Raw recommendations:', JSON.stringify(recommendations, null, 2));
      
      // Debug each recommendation
      recommendations.forEach((rec, index) => {
        console.log(`🎁 Recommendation ${index + 1}:`, {
          name: rec.name,
          price: rec.price,
          category: rec.category
        });
      });
      
    } catch (parseError) {
      console.log('⚠️ Failed to parse AI response, using fallback');
      console.log('💥 Parse error:', parseError.message);
      console.log('📋 Attempted to parse:', aiResponse);
      recommendations = [
        {
          name: 'Amazon Gift Card $25-50',
          description: 'Let them choose what they want',
          price: Math.min(budget.giftBudget, 50),
          category: 'Gift Cards',
          reasoning: 'A safe choice that allows the recipient to select their preferred gift'
        }
      ];
    }

    console.log('🔢 Recommendations before ensuring 2:', recommendations.length);

    // Ensure at least two recommendations
    while (recommendations.length < 2) {
      console.log('🔄 Adding fallback recommendation, current count:', recommendations.length);
      recommendations.push({
        name: 'Thoughtful Gift Selection',
        description: 'A carefully chosen gift for this special person',
        price: Math.min(budget.giftBudget * 0.8, 35),
        category: 'Popular Gifts',
        reasoning: 'A thoughtful option that shows you care'
      });
    }

    // Force exactly 2 recommendations (never more, never less)
    recommendations = recommendations.slice(0, 2);

    console.log('🔢 Final recommendations count:', recommendations.length);
    console.log('🎁 Final recommendations:', recommendations.map(r => ({ name: r.name, price: r.price })));

    // Only keep a maximum of 2 recommendations and add standard fields
    const finalRecommendations = recommendations.map((rec, index) => ({
      id: `ai-generated-${index + 1}`,
      name: rec.name,
      description: rec.description,
      price: rec.price,
      category: rec.category?.toLowerCase() || 'other',
      confidence: 0.8,
      reasoning: rec.reasoning,
      availability: 'pending_manual_review',
      estimatedDelivery: '2-3 business days',
      // Note: ASIN and purchase URL will be added manually by admin
      asin: null, // Will be filled in manually
      purchaseUrl: null, // Will be filled in manually
      imageUrl: null, // Will be filled in manually
      needsManualReview: true // Flag for admin to review and add real product links
    }));

    console.log('🚀 FINAL DEBUG - About to return:', {
      recommendationsCount: finalRecommendations.length,
      recommendations: finalRecommendations.map(r => ({ id: r.id, name: r.name, price: r.price }))
    });

    console.log('🎉 Returning gift ideas for manual review');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: true,
        recommendations: finalRecommendations,
        debug: {
          functionWorking: true,
          openaiConnected: true,
          manualReviewNeeded: true,
          modelUsed: 'gpt-3.5-turbo',
          adminNote: 'These are AI-generated gift ideas. Admin should manually find and add real Amazon ASINs and links.',
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
            name: 'Amazon Gift Card $25',
            description: 'A safe choice when AI is unavailable',
            price: 25,
            asin: 'B004LLIKVU', // This one we know works
            category: 'Gift Cards',
            confidence: 0.8,
            availability: 'in_stock',
            estimatedDelivery: 'Digital delivery - instant',
            purchaseUrl: 'https://amazon.com/dp/B004LLIKVU',
            needsManualReview: false
          }
        ],
        debug: {
          functionWorking: true,
          error: error.message,
          fallbackUsed: true,
          modelUsed: 'fallback',
          timestamp: new Date().toISOString()
        }
      }),
    };
  }
};

module.exports = { handler };
