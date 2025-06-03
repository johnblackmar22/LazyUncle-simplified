// Debug version of gift recommendations function
import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
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
    console.log('=== DEBUG FUNCTION START ===');
    console.log('Environment check:');
    console.log('- Node version:', process.version);
    console.log('- OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('- Event body:', event.body);

    // Simple response without OpenAI for now
    const mockResponse = {
      suggestions: [
        {
          id: 'debug-1',
          name: 'Debug Gift 1',
          description: 'This is a test gift from the debug function',
          category: 'Test',
          price: 25,
          reasoning: 'This is a debug response to test function deployment',
          confidence: 0.9,
          tags: ['debug', 'test']
        }
      ],
      metadata: {
        model: 'debug',
        generated_at: new Date().toISOString(),
        recipient_name: 'Debug User',
        occasion: 'test',
        budget: 50,
        request_id: 'debug-' + Math.random().toString(36).substring(7),
      }
    };

    console.log('=== DEBUG FUNCTION SUCCESS ===');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockResponse),
    };

  } catch (error) {
    console.error('=== DEBUG FUNCTION ERROR ===');
    console.error('Error details:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: true,
        timestamp: new Date().toISOString()
      }),
    };
  }
};

export { handler }; 