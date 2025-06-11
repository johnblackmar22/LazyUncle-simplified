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

    // STEP 1: Get gift ideas from AI (without ASINs)
    const ideaPrompt = `\nYou are a creative gift recommendation expert. Your job is to suggest SEARCH TERMS for finding real products on Amazon.\n\nTHE MOST IMPORTANT RULES:\n- Consider the recipient's AGE: ${recipient.age} years old\n- Consider the RELATIONSHIP: ${recipient.relationship}\n- Budget range: $${budget.giftBudget - 5} - $${budget.giftBudget}\n- Do NOT recommend any of these previous gifts: ${previousGiftNames && previousGiftNames.length > 0 ? previousGiftNames.join(', ') : 'none'}\n- Be CREATIVE and UNIQUE! Think outside the box.\n\nRecipient info:\n${JSON.stringify(recipient, null, 2)}\nOccasion info:\n${JSON.stringify({ ...occasion, budget: budget.total, instructions: instructions || '' }, null, 2)}\n\nProvide 3-5 SEARCH TERMS that would find great gifts on Amazon. Each search term should be:\n- Specific enough to find real products\n- Creative and thoughtful for this person\n- Age and relationship appropriate\n- Within the budget range\n\nExamples:\n- "wireless noise canceling headphones under 100"\n- "funny coffee mug for dad"\n- "beginner yoga mat set"\n- "vintage style watch for men"\n\nRespond with ONLY valid JSON:\n{\n  "searchTerms": [\n    {\n      "query": "search term here",\n      "reason": "why this is perfect for them",\n      "category": "Electronics|Books|Sports|Home|Fashion|etc"\n    }\n  ]\n}\n`;

    console.log('🤖 Getting gift ideas from AI...');
    const ideaCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a creative gift recommendation assistant. Generate thoughtful search terms for finding real products on Amazon. Respond only with valid JSON.' },
        { role: 'user', content: ideaPrompt }
      ],
      max_tokens: 500,
      temperature: 0.9,
    });

    const aiIdeasResponse = ideaCompletion.choices[0]?.message?.content;
    console.log('📋 AI Ideas Response length:', aiIdeasResponse?.length || 0);

    let searchTerms = [];
    try {
      const parsed = JSON.parse(aiIdeasResponse || '{}');
      searchTerms = parsed.searchTerms || [];
      console.log('✅ AI ideas parsed, search terms:', searchTerms.length);
    } catch (parseError) {
      console.log('⚠️ Failed to parse AI ideas, using fallback search terms');
      searchTerms = [
        { query: "gift card", reason: "Safe fallback option", category: "Gift Cards" }
      ];
    }

    // STEP 2: Search Amazon for real products using the AI-generated search terms
    console.log('🔍 Searching Amazon for real products...');
    const recommendations = [];
    
    for (const term of searchTerms.slice(0, 3)) { // Limit to 3 searches to avoid rate limits
      try {
        // Try Amazon PA-API first
        let amazonResponse = await fetch('/.netlify/functions/amazon-product-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchTerms: term.query,
            category: term.category,
            maxPrice: budget.giftBudget,
            minPrice: Math.max(5, budget.giftBudget * 0.3)
          })
        });

        // If PA-API fails, try curated ASINs
        if (!amazonResponse.ok) {
          console.log('⚠️ Amazon PA-API failed, trying curated ASINs...');
          amazonResponse = await fetch('/.netlify/functions/curated-asins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              searchTerms: term.query,
              category: term.category,
              budget: budget.giftBudget,
              interests: recipient.interests
            })
          });
        }

        if (amazonResponse.ok) {
          const amazonData = await amazonResponse.json();
          if (amazonData.products && amazonData.products.length > 0) {
            const product = amazonData.products[0]; // Take the best match
            recommendations.push({
              id: `${amazonData.source === 'curated_database' ? 'curated' : 'amazon'}-${product.asin}`,
              name: product.title,
              description: product.features?.join('. ') || `Great ${term.category.toLowerCase()} option`,
              price: product.price,
              asin: product.asin, // REAL AMAZON ASIN!
              category: term.category.toLowerCase(),
              confidence: amazonData.source === 'curated_database' ? 0.9 : 0.8,
              reasoning: term.reason,
              availability: product.availability === 'Now' ? 'in_stock' : 'limited',
              estimatedDelivery: amazonData.source === 'curated_database' ? '1-2 business days' : '2-3 business days',
              imageUrl: product.imageUrl,
              purchaseUrl: product.detailPageURL,
              source: amazonData.source || 'amazon'
            });
          }
        }
      } catch (searchError) {
        console.error('Product search error for term:', term.query, searchError);
      }
    }

    // STEP 3: Fallback if no Amazon products found
    if (recommendations.length === 0) {
      console.log('⚠️ No Amazon products found, using fallback recommendations');
      recommendations.push({
        id: 'fallback-1',
        name: 'Amazon Gift Card',
        description: 'Let them choose what they want',
        price: Math.min(budget.giftBudget, 50),
        asin: 'B004LLIKVU', // Real Amazon Gift Card ASIN
        category: 'gift_cards',
        confidence: 0.8,
        reasoning: 'A safe choice that allows the recipient to select their preferred gift',
        availability: 'in_stock',
        estimatedDelivery: 'Digital delivery - instant'
      });
    }

    // Ensure at least two recommendations
    while (recommendations.length < 2 && recommendations.length < searchTerms.length) {
      recommendations.push({
        id: 'fallback-2',
        name: 'Starbucks Gift Card',
        description: 'Perfect for coffee lovers',
        price: 25,
        asin: 'B07C61C8RH', // Real Starbucks Gift Card ASIN
        category: 'gift_cards',
        confidence: 0.7,
        reasoning: 'A thoughtful choice for someone who enjoys coffee',
        availability: 'in_stock',
        estimatedDelivery: 'Digital delivery - instant'
      });
    }

    // Only keep a maximum of 2 recommendations
    const finalRecommendations = recommendations.slice(0, 2);

    console.log('🎉 Returning recommendations with REAL ASINs');
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
          amazonSearchUsed: recommendations.some(r => r.id.startsWith('amazon-')),
          curatedSearchUsed: recommendations.some(r => r.id.startsWith('curated-')),
          modelUsed: 'gpt-3.5-turbo + product-search',
          searchTermsGenerated: searchTerms.length,
          realProductsFound: recommendations.filter(r => r.id.startsWith('amazon-') || r.id.startsWith('curated-')).length,
          asinSources: recommendations.map(r => ({ id: r.id, source: r.source || 'unknown' })),
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
            asin: 'B004LLIKVU', // Real Amazon Gift Card ASIN
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
            name: 'Starbucks Gift Card',
            description: 'Perfect for coffee lovers',
            price: 25,
            asin: 'B07C61C8RH', // Real Starbucks Gift Card ASIN
            category: 'gift_cards',
            confidence: 0.7,
            availability: 'in_stock',
            estimatedDelivery: 'Digital delivery - instant',
            costBreakdown: {
              giftPrice: 25,
              estimatedShipping: 0,
              giftWrapping: 0,
              total: 25
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
