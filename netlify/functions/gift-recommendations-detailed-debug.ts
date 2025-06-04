// Detailed debug version to diagnose OpenAI integration issues
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

  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    openai_status: {},
    error: null
  };

  try {
    console.log('=== DETAILED DEBUG START ===');
    
    // Environment debugging
    debugInfo.environment = {
      node_version: process.version,
      platform: process.platform,
      openai_key_present: !!process.env.OPENAI_API_KEY,
      openai_key_prod_present: !!process.env.OPENAI_API_KEY_PROD,
      openai_key_length: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
      all_env_keys: Object.keys(process.env).filter(key => key.includes('OPENAI')),
      netlify_context: process.env.CONTEXT || 'unknown',
      deploy_context: process.env.NETLIFY_ENV || 'unknown',
    };

    console.log('Environment info:', debugInfo.environment);

    // Test OpenAI import and initialization
    let OpenAI: any = null;
    let openai: any = null;
    
    try {
      console.log('Attempting to import OpenAI...');
      const OpenAIModule = await import('openai');
      OpenAI = OpenAIModule.default;
      debugInfo.openai_status.import_success = true;
      console.log('OpenAI module imported successfully');
      
      const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_PROD;
      debugInfo.openai_status.api_key_source = process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY' : 
                                                process.env.OPENAI_API_KEY_PROD ? 'OPENAI_API_KEY_PROD' : 'none';
      
      if (!apiKey) {
        debugInfo.openai_status.initialization_error = 'No API key found';
        console.log('No OpenAI API key found');
      } else {
        console.log('API key found, initializing OpenAI client...');
        debugInfo.openai_status.api_key_masked = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
        
        openai = new OpenAI({ apiKey });
        debugInfo.openai_status.client_created = true;
        console.log('OpenAI client created successfully');
        
        // Test a simple API call
        try {
          console.log('Testing OpenAI API call...');
          const testResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say "test successful"' }],
            max_tokens: 10,
          });
          
          debugInfo.openai_status.api_test_success = true;
          debugInfo.openai_status.api_response = testResponse.choices[0]?.message?.content;
          console.log('OpenAI API test successful:', testResponse.choices[0]?.message?.content);
          
        } catch (apiError: any) {
          debugInfo.openai_status.api_test_error = {
            message: apiError.message,
            status: apiError.status,
            code: apiError.code,
            type: apiError.type
          };
          console.error('OpenAI API test failed:', apiError);
        }
      }
      
    } catch (importError: any) {
      debugInfo.openai_status.import_error = {
        message: importError.message,
        stack: importError.stack
      };
      console.error('OpenAI import failed:', importError);
    }

    // Test request parsing
    if (event.body) {
      try {
        const requestData = JSON.parse(event.body);
        debugInfo.request_data = {
          has_recipient: !!requestData.recipient,
          recipient_name: requestData.recipient?.name,
          has_budget: !!requestData.budget,
          budget: requestData.budget,
          occasion: requestData.occasion,
          interests_count: requestData.recipient?.interests?.length || 0
        };
      } catch (parseError: any) {
        debugInfo.request_parse_error = parseError.message;
      }
    }

    console.log('=== DETAILED DEBUG END ===');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Detailed debug information',
        debug_info: debugInfo,
        recommendations: 'Debug mode - no real recommendations generated'
      }),
    };

  } catch (error: any) {
    console.error('=== DEBUG FUNCTION ERROR ===');
    console.error('Error details:', error);
    
    debugInfo.error = {
      message: error.message,
      stack: error.stack,
      name: error.name
    };
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Debug function failed',
        debug_info: debugInfo,
        timestamp: new Date().toISOString()
      }),
    };
  }
};

export { handler }; 