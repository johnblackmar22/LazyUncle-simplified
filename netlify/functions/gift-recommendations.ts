// To use this function locally, run:
// npm install @netlify/functions openai
// If using TypeScript, you may also need:
// npm install --save-dev @types/node

// @ts-ignore: Netlify Functions types
import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Loaded' : 'Missing');

const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { recipient, budget, pastGifts, trendingGifts } = JSON.parse(event.body || '{}');

    const prompt = `You are a gifting assistant. Based on the following recipient info, budget, past gifts, and trending gifts, recommend 5 unique gift ideas.\n\nRecipient: ${JSON.stringify(recipient)}\nBudget: $${budget}\nPast Gifts: ${JSON.stringify(pastGifts)}\nTrending Gifts: ${JSON.stringify(trendingGifts)}\n\nRespond with a JSON array of 5 gift ideas, each with a name, short description, and estimated price.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful gifting assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    const text = completion.choices[0]?.message?.content || '[]';
    let giftIdeas;
    try {
      giftIdeas = JSON.parse(text);
    } catch (e) {
      giftIdeas = [{ name: 'Gift parsing error', description: text, estimatedPrice: 0 }];
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(giftIdeas),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Unknown error' }),
    };
  }
};

export { handler }; 