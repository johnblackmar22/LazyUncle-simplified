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

    // Build a dynamic prompt for the AI
    const prompt = `\nYou are a creative gift recommendation expert with a knack for finding unique, thoughtful, and surprisingly perfect gifts. Think outside the box and be creative while staying practical.\n\nTHE MOST IMPORTANT RULES:\n- Do not exceed the budget for any gift. The goal is to get as close as possible to the budget for each gift. If a gift is much cheaper than the budget, do NOT recommend it unless there is no better option. At least one gift must be within $1 of the budget, if possible.\n- CRITICALLY IMPORTANT: Pay close attention to the recipient's AGE. This should heavily influence your recommendations:\n  * Consider their generation, life stage, and age-appropriate interests\n  * Think about what someone of THIS SPECIFIC AGE would actually use and appreciate\n  * Factor in generational preferences (Gen Z vs Millennials vs Gen X vs Boomers)\n  * Consider their likely lifestyle, responsibilities, and priorities at this age\n- Read and use all recipient information, interests, and instructions. Each recommendation must feel personal and directly relevant.\n- Do NOT recommend any of the following previous gifts: ${previousGiftNames && previousGiftNames.length > 0 ? previousGiftNames.join(', ') : 'none'}\n- Be CREATIVE and UNIQUE! Avoid generic gifts like basic gift cards unless they're truly the best option.\n- Think about the recipient's personality, hobbies, and lifestyle to find unexpected gems.\n\nRequirements:\n- Recommend up to 2 creative, unique, and thoughtful gifts that are real products available on Amazon.com\n- Use the exact product name as listed on Amazon\n- Think creatively about how the recipient's interests AND AGE could translate into unexpected gift categories\n- Consider trending, innovative, or niche products that align with their interests AND age group\n- For each gift, include:\n  * name (exact Amazon product name)\n  * description (what makes this gift special and creative)\n  * price (USD)\n  * why this gift is a perfect creative fit for the recipient, specifically referencing their AGE, interests, and personality\n- Gifts must be age-appropriate and safe\n- Prioritize unique, memorable, and conversation-starting gifts over obvious choices\n- Only use information provided\n- Respond with ONLY valid JSON, no extra text\n\nRecipient info:\n${JSON.stringify(recipient, null, 2)}\nOccasion info:\n${JSON.stringify({ ...occasion, budget: budget.total, instructions: instructions || '' }, null, 2)}\n\nJSON response format:\n{\n  "recommendations": [\n    {\n      "name": "...",\n      "description": "...",\n      "price": ...,\n      "reasoning": "... (explain the creative connection to their AGE, interests and why this is unexpectedly perfect for someone their age)"\n    },\n    ...\n  ]\n}\n`;

    // OpenAI API call using GPT-3.5-turbo (known working model)
    console.log('🤖 Using GPT-3.5-turbo...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a creative gift recommendation assistant who thinks outside the box. Find unique, memorable gifts that perfectly match the recipient. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.9,
    });
    console.log('✅ GPT-3.5-turbo API call successful');

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

    // Ensure at least two recommendations
    const fallbackGifts = [
      {
        id: 'fallback-2',
        name: 'Experience Gift Box',
        description: 'Create lasting memories',
        price: 35,
        category: 'experiences',
        confidence: 0.7
      }
    ];
    while (recommendations.length < 2) {
      recommendations.push(fallbackGifts[recommendations.length - 1] || fallbackGifts[0]);
    }
    // Only keep a maximum of 2 recommendations
    recommendations = recommendations.slice(0, 2);

    // Ensure every recommendation has a category
    recommendations = recommendations.map((gift) => ({
      ...gift,
      category: gift.category || 'other'
    }));

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
          modelUsed: 'gpt-3.5-turbo',
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
          modelUsed: 'fallback',
          timestamp: new Date().toISOString()
        }
      }),
    };
  }
};

module.exports = { handler };
