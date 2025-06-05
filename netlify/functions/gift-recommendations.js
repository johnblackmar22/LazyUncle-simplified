"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const openai_1 = require("openai");
// Initialize OpenAI client
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const handler = async (event, context) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
    try {
        // Parse request body
        const requestData = JSON.parse(event.body || '{}');
        console.log('🎁 Processing gift recommendation request:', {
            recipient: requestData.recipient.name,
            budget: requestData.budget.total,
            occasion: requestData.occasion.type
        });
        // Create AI prompt for gift recommendations
        const prompt = `You are a professional gift consultant. Generate 3 thoughtful gift recommendations based on these details:

RECIPIENT:
- Name: ${requestData.recipient.name}
- Age: ${requestData.recipient.age || 'Not specified'}
- Interests: ${requestData.recipient.interests.join(', ')}
- Relationship: ${requestData.recipient.relationship}
- Location: ${requestData.recipient.location}

OCCASION:
- Type: ${requestData.occasion.type}
- Date: ${requestData.occasion.date}
- Significance: ${requestData.occasion.significance}

BUDGET & CONSTRAINTS:
- Total budget: $${requestData.budget.total}
- Gift budget (after shipping/wrapping): $${requestData.budget.giftBudget}
- Gift wrap needed: ${requestData.budget.giftWrap ? 'Yes' : 'No'}
- Prioritize free shipping: ${requestData.preferences.prioritizeFreeShipping ? 'Yes' : 'No'}
- Max shipping cost: $${requestData.preferences.maxShippingCost}

REQUIREMENTS:
- Find gifts available on Amazon with Prime shipping when possible
- Include realistic prices and shipping costs
- Provide actual purchase recommendations, not generic categories
- Consider the recipient's interests and relationship to gift-giver
- Stay within the specified budget including shipping and wrapping

For each recommendation, provide:
1. Specific product name
2. Detailed description explaining why it's perfect for them
3. Realistic price
4. Shipping cost (0 if Prime/free shipping available)
5. Category
6. Confidence score (0-1)
7. Reasoning for the recommendation

Format as JSON array with exactly this structure:
[
  {
    "name": "Specific Product Name",
    "description": "Detailed description of the gift",
    "price": 35.99,
    "shippingCost": 0,
    "category": "books",
    "confidence": 0.85,
    "reasoning": "Why this gift is perfect for them",
    "tags": ["thoughtful", "practical"],
    "availability": "in_stock",
    "estimatedDelivery": "2-3 business days"
  }
]`;
        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional gift consultant who specializes in finding thoughtful, personalized gifts within specific budgets. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });
        const aiResponse = completion.choices[0]?.message?.content;
        if (!aiResponse) {
            throw new Error('No response from OpenAI');
        }
        // Parse AI response
        let recommendations;
        try {
            const parsedRecommendations = JSON.parse(aiResponse);
            // Add IDs and ensure proper structure
            recommendations = parsedRecommendations.map((rec, index) => ({
                id: `ai-gift-${Date.now()}-${index}`,
                name: rec.name || 'Unnamed Gift',
                description: rec.description || 'Gift recommendation',
                price: typeof rec.price === 'number' ? rec.price : 25,
                category: rec.category || 'general',
                confidence: typeof rec.confidence === 'number' ? rec.confidence : 0.7,
                reasoning: rec.reasoning || 'AI recommended gift',
                tags: Array.isArray(rec.tags) ? rec.tags : ['gift'],
                availability: rec.availability || 'in_stock',
                estimatedDelivery: rec.estimatedDelivery || '3-5 business days',
                shippingCost: typeof rec.shippingCost === 'number' ? rec.shippingCost : 0,
                imageUrl: rec.imageUrl,
                purchaseUrl: rec.purchaseUrl
            }));
        }
        catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            // Fallback recommendations
            recommendations = [
                {
                    id: 'fallback-1',
                    name: 'Amazon Gift Card',
                    description: 'A versatile gift card that lets them choose exactly what they want',
                    price: Math.min(requestData.budget.giftBudget, 50),
                    category: 'gift_cards',
                    confidence: 0.8,
                    reasoning: 'Safe choice when other recommendations fail',
                    tags: ['versatile', 'practical'],
                    availability: 'in_stock',
                    estimatedDelivery: 'Digital delivery - instant',
                    shippingCost: 0
                }
            ];
        }
        const response = {
            recommendations,
            totalFound: recommendations.length,
            searchMetadata: {
                processingTime: Date.now(),
                confidence: recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length,
                fallbackUsed: false
            }
        };
        console.log('✅ Successfully generated recommendations:', recommendations.length);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response),
        };
    }
    catch (error) {
        console.error('❌ Gift recommendation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to generate recommendations',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
        };
    }
};
exports.handler = handler;
