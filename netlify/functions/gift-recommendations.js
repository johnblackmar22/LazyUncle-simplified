"use strict";
const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const requestData = JSON.parse(event.body);
        console.log('🎁 Processing gift recommendation request:', {
            recipient: requestData.recipient?.name || 'Unknown',
            budget: requestData.budget?.total || 'Unknown',
            occasion: requestData.occasion?.type || 'Unknown'
        });

        // Calculate budget breakdown
        const totalBudget = requestData.budget?.total || 50;
        const giftWrapCost = requestData.budget?.giftWrap ? 4.99 : 0;
        const shippingBuffer = Math.min(15, totalBudget * 0.2); // Max $15 or 20% of budget
        const giftBudget = totalBudget - giftWrapCost - shippingBuffer;

        if (giftBudget <= 0) {
            throw new Error('Budget too low for gift recommendations');
        }

        // Create the AI prompt
        const prompt = `You are a gift recommendation expert. Based on the following information, suggest 3 personalized gifts:

RECIPIENT:
- Name: ${requestData.recipient?.name || 'Unknown'}
- Age: ${requestData.recipient?.age || 'Unknown'}
- Interests: ${requestData.recipient?.interests?.join(', ') || 'None specified'}
- Relationship: ${requestData.recipient?.relationship || 'Unknown'}
- Location: ${requestData.recipient?.location || 'US'}

OCCASION:
- Type: ${requestData.occasion?.type || 'Unknown'}
- Date: ${requestData.occasion?.date || 'Unknown'}
- Significance: ${requestData.occasion?.significance || 'regular'}

BUDGET CONSTRAINTS:
- Total Budget: $${totalBudget}
- Gift Budget: $${giftBudget.toFixed(2)} (after shipping and gift wrap)
- Gift Wrap: ${requestData.budget?.giftWrap ? 'Yes (+$4.99)' : 'No'}

PREFERENCES:
- Prioritize free shipping options (Amazon Prime, etc.)
- Exclude categories: ${requestData.preferences?.excludeCategories?.join(', ') || 'None'}
- Preferred categories: ${requestData.preferences?.preferredCategories?.join(', ') || 'None'}

Please respond with exactly 3 gift recommendations in this JSON format:
{
  "recommendations": [
    {
      "id": "gift-1",
      "name": "Gift Name",
      "description": "Brief description explaining why this gift is perfect",
      "price": 29.99,
      "category": "category_name",
      "confidence": 0.85,
      "reasoning": "Why this gift matches the recipient and occasion",
      "tags": ["tag1", "tag2", "tag3"],
      "availability": "in_stock",
      "estimatedDelivery": "2-3 business days",
      "shippingCost": 0,
      "purchaseUrl": "https://amazon.com/example"
    }
  ]
}

Focus on:
1. Gifts that match the recipient's interests and age
2. Appropriate for the occasion and relationship
3. Within the specified budget including shipping
4. Prioritize items with free shipping when possible
5. Include realistic pricing and purchase URLs`;

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful gift recommendation assistant. Always respond with valid JSON in the exact format requested.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.7,
        });

        const aiResponse = completion.choices[0]?.message?.content;
        
        if (!aiResponse) {
            throw new Error('No response from OpenAI');
        }

        // Parse the AI response
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(aiResponse);
        } catch (parseError) {
            console.warn('Failed to parse AI response as JSON:', aiResponse);
            throw new Error('Invalid AI response format');
        }

        // Validate and enhance the response
        const recommendations = parsedResponse.recommendations || [];
        const enhancedRecommendations = recommendations.map((gift, index) => ({
            id: gift.id || `ai-gift-${Date.now()}-${index}`,
            name: gift.name || 'AI Recommended Gift',
            description: gift.description || 'A personalized gift recommendation',
            price: gift.price || Math.min(giftBudget, 25),
            category: gift.category || 'general',
            confidence: gift.confidence || 0.8,
            reasoning: gift.reasoning || 'Selected based on recipient preferences',
            tags: gift.tags || ['ai_recommended'],
            imageUrl: gift.imageUrl || '',
            purchaseUrl: gift.purchaseUrl || '',
            availability: gift.availability || 'in_stock',
            estimatedDelivery: gift.estimatedDelivery || '3-5 business days',
            costBreakdown: {
                giftPrice: gift.price || Math.min(giftBudget, 25),
                estimatedShipping: gift.shippingCost || 0,
                giftWrapping: giftWrapCost,
                total: (gift.price || Math.min(giftBudget, 25)) + (gift.shippingCost || 0) + giftWrapCost
            },
            metadata: {
                model: 'gpt-4',
                promptVersion: '1.0',
                generatedAt: Date.now()
            }
        }));

        console.log(`✅ Generated ${enhancedRecommendations.length} AI recommendations`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({
                success: true,
                recommendations: enhancedRecommendations,
                metadata: {
                    requestId: `req-${Date.now()}`,
                    source: 'openai-gpt4',
                    generatedAt: new Date().toISOString()
                }
            }),
        };

    } catch (error) {
        console.error('❌ Gift recommendation error:', error);

        // Return fallback recommendations
        const fallbackRecommendations = [
            {
                id: 'fallback-1',
                name: 'Amazon Gift Card',
                description: 'Let them choose exactly what they want',
                price: Math.min(requestData.budget?.total || 50, 50),
                category: 'gift_cards',
                confidence: 0.8,
                reasoning: 'A safe choice that allows the recipient to select their preferred gift',
                tags: ['versatile', 'safe_choice', 'always_appreciated'],
                availability: 'in_stock',
                estimatedDelivery: 'Digital delivery - instant',
                costBreakdown: {
                    giftPrice: Math.min(requestData.budget?.total || 50, 50),
                    estimatedShipping: 0,
                    giftWrapping: 0,
                    total: Math.min(requestData.budget?.total || 50, 50)
                },
                metadata: {
                    model: 'fallback',
                    promptVersion: '1.0',
                    generatedAt: Date.now()
                }
            },
            {
                id: 'fallback-2',
                name: 'Experience Gift Box',
                description: 'A curated collection of local experiences',
                price: Math.min(requestData.budget?.total || 50, 35),
                category: 'experiences',
                confidence: 0.7,
                reasoning: 'Experience gifts create lasting memories and work for most occasions',
                tags: ['memorable', 'experiential', 'flexible'],
                availability: 'in_stock',
                estimatedDelivery: '3-5 business days',
                costBreakdown: {
                    giftPrice: Math.min(requestData.budget?.total || 50, 35),
                    estimatedShipping: 0,
                    giftWrapping: requestData.budget?.giftWrap ? 4.99 : 0,
                    total: Math.min(requestData.budget?.total || 50, 35) + (requestData.budget?.giftWrap ? 4.99 : 0)
                },
                metadata: {
                    model: 'fallback',
                    promptVersion: '1.0',
                    generatedAt: Date.now()
                }
            }
        ];

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({
                success: true,
                recommendations: fallbackRecommendations,
                metadata: {
                    requestId: `req-${Date.now()}`,
                    source: 'fallback',
                    error: error.message,
                    generatedAt: new Date().toISOString()
                }
            }),
        };
    }
};

module.exports = { handler };
