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

    // Build a thoughtful prompt for gift ideas (without ASINs)
    const prompt = `\nYou are a creative gift recommendation expert. Generate thoughtful, specific gift recommendations that can be found on Amazon.\n\nTHE MOST IMPORTANT RULES:\n- Consider the recipient's AGE: ${recipient.age} years old\n- Consider the RELATIONSHIP: ${recipient.relationship}\n- Budget range: $${budget.giftBudget - 10} - $${budget.giftBudget}\n- Do NOT recommend any of these previous gifts: ${previousGiftNames && previousGiftNames.length > 0 ? previousGiftNames.join(', ') : 'none'}\n- Be CREATIVE and UNIQUE! Think outside the box.\n- Focus on gifts that would be meaningful for this specific person\n\nPRODUCT NAMING GUIDELINES:\n- Use SPECIFIC but FLEXIBLE descriptions\n- Include brand names when there's a clear market leader\n- Include key distinguishing features (size, type, etc.)\n- Avoid overly generic names like "premium headphones"\n- Avoid full Amazon product titles with all specs\n\nEXAMPLES OF GOOD PRODUCT NAMES:\n✅ "Sony Noise-Canceling Headphones"\n✅ "Instant Pot 6-Quart Pressure Cooker"\n✅ "Apple AirPods Pro"\n✅ "Kindle Paperwhite E-Reader"\n✅ "Weighted Blanket 15-20 lbs"\n✅ "Atomic Habits by James Clear"\n✅ "Lodge Cast Iron Skillet 10-inch"\n\nEXAMPLES TO AVOID:\n❌ "Premium wireless headphones" (too generic)\n❌ "Sony WH-1000XM4 Wireless Premium Noise Canceling Overhead Headphones with 30 Hour Battery Life" (too specific)\n\nRecipient info:\n${JSON.stringify(recipient, null, 2)}\nOccasion info:\n${JSON.stringify({ ...occasion, budget: budget.total, instructions: instructions || '' }, null, 2)}\n\nProvide 2 creative, thoughtful gift recommendations. For each gift:\n- Give it a specific but flexible name that includes brand/key features\n- Explain why it's perfect for this person\n- Include an estimated price within budget\n- Suggest what category to search for on Amazon\n\nNote: These will be manually verified and potentially refined before showing to customers.\n\nRespond with ONLY valid JSON:\n{\n  "recommendations": [\n    {\n      "name": "Sony Noise-Canceling Headphones",\n      "description": "what makes this gift special and perfect for them",\n      "price": estimated_price_number,\n      "category": "Electronics",\n      "reasoning": "why this is perfect for them (age, relationship, interests)"\n    }\n  ]\n}\n`;

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
          name: 'Amazon Gift Card $25-50',
          description: 'Let them choose what they want',
          price: Math.min(budget.giftBudget, 50),
          category: 'Gift Cards',
          reasoning: 'A safe choice that allows the recipient to select their preferred gift'
        }
      ];
    }

    // Ensure at least two recommendations
    while (recommendations.length < 2) {
      recommendations.push({
        name: 'Thoughtful Gift Selection',
        description: 'A carefully chosen gift for this special person',
        price: Math.min(budget.giftBudget * 0.8, 35),
        category: 'Popular Gifts',
        reasoning: 'A thoughtful option that shows you care'
      });
    }

    // Only keep a maximum of 2 recommendations and add standard fields
    const finalRecommendations = recommendations.slice(0, 2).map((rec, index) => ({
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
