// To use this function locally, run:
// npm install @netlify/functions openai
// If using TypeScript, you may also need:
// npm install --save-dev @types/node

// @ts-ignore: Netlify Functions types
import { Handler } from '@netlify/functions';
// @ts-ignore: OpenAI types
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

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

    const prompt = `
Suggest 5 unique gift ideas for the following recipient:
- Name: ${recipient.name}
- Age: ${recipient.age}
- Gender: ${recipient.gender}
- Interests: ${recipient.interests?.join(", ")}
- Relationship: ${recipient.relationship}
- Price range: $${budget.min}-$${budget.max}
- Past gifts: ${pastGifts?.join(", ") || "None"}
- Trending gifts: ${trendingGifts?.join(", ") || "None"}

Return the result as a JSON array of objects with keys: name, description, price, and why.
`;

    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    });

    let suggestions = [];
    try {
      suggestions = JSON.parse(response.data.choices[0].message?.content || '[]');
    } catch {
      suggestions = response.data.choices[0].message?.content;
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ suggestions }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};

export { handler }; 