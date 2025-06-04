// Test script that exactly simulates the frontend behavior
console.log('🔍 Testing Frontend AI Gift Simulation on lazyuncle-dev...');

async function testFrontendSimulation() {
  const baseUrl = 'https://lazyuncle-dev.netlify.app';
  
  console.log('\n=== SIMULATING FRONTEND AI REQUEST ===');
  
  try {
    // This exactly matches what AIGiftRecommendations.tsx sends
    const timestamp = Date.now();
    const requestData = {
      recipient: {
        name: "John Test",
        interests: ["technology", "books", "gaming"],
        relationship: "friend",
        description: "Tech enthusiast who loves sci-fi and gaming"
      },
      budget: 100,
      occasion: "birthday",
      pastGifts: [],
      timestamp: timestamp // Cache buster
    };
    
    const url = `${baseUrl}/.netlify/functions/gift-recommendations-enhanced`;
    console.log('🎯 Frontend URL:', url);
    console.log('📦 Frontend Request:', JSON.stringify(requestData, null, 2));
    
    // Exact headers from frontend
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Request-ID': `req-${timestamp}-${Math.random().toString(36).substr(2, 9)}`
      },
      body: JSON.stringify(requestData),
    });
    
    console.log('\n📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Success! Response received');
      console.log('🤖 Model Used:', data.metadata?.model || 'unknown');
      console.log('📦 Suggestions Count:', data.suggestions?.length || 0);
      console.log('🔍 Request ID:', data.metadata?.request_id || 'none');
      
      if (data.metadata?.model === 'gpt-4o-mini') {
        console.log('🎉 REAL AI WORKING IN FRONTEND FLOW!');
        if (data.suggestions?.[0]) {
          console.log('💡 Sample AI suggestion:', {
            name: data.suggestions[0].name,
            price: data.suggestions[0].price,
            reasoning: data.suggestions[0].reasoning?.substring(0, 100) + '...'
          });
        }
      } else if (data.metadata?.model === 'fallback') {
        console.log('❌ FRONTEND GETTING FALLBACKS');
        console.log('🔍 Fallback reason:', data.metadata?.fallback_reason || 'unknown');
        
        // Check if there are any errors in the response
        if (data.error) {
          console.log('💥 Error in response:', data.error);
        }
      }
      
    } else {
      const errorText = await response.text();
      console.log('\n❌ Frontend request failed');
      console.log('📝 Error response:', errorText);
    }
    
    console.log('\n=== TESTING GIFT PERSISTENCE ENDPOINT ===');
    
    // Test if the gift persistence is using the right store
    console.log('🎁 Note: Gift persistence uses Firebase giftStore in production');
    console.log('📝 Expected behavior:');
    console.log('  1. AI gift selection calls createGift() via useGiftStore');
    console.log('  2. Gift saved to Firebase gifts collection');
    console.log('  3. Page refresh loads gifts from Firebase');
    console.log('  4. Selected gifts show as selected in UI');
    
    console.log('\n🔧 To test gift persistence:');
    console.log('  1. Go to lazyuncle-dev.netlify.app');
    console.log('  2. Navigate to a recipient with occasions');
    console.log('  3. Click "Select Gift" on an AI recommendation');
    console.log('  4. Refresh the page');
    console.log('  5. Check if gift shows as selected');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Also test the debug endpoint to see environment
async function testDebugEndpoint() {
  console.log('\n=== CHECKING PRODUCTION ENVIRONMENT ===');
  
  try {
    const debugUrl = 'https://lazyuncle-dev.netlify.app/.netlify/functions/gift-recommendations-detailed-debug';
    const response = await fetch(debugUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'frontend-debug' })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Production Environment:');
      console.log('  - OpenAI Key Present:', data.environment?.openai_key_present);
      console.log('  - Key Length:', data.environment?.openai_key_length);
      console.log('  - Node Version:', data.environment?.node_version);
      console.log('  - Netlify Context:', data.environment?.netlify_context);
      
      if (data.openai_status?.api_test_error) {
        console.log('❌ OpenAI API Error:', data.openai_status.api_test_error.message);
      } else if (data.openai_status?.api_test_success) {
        console.log('✅ OpenAI API Test: SUCCESS');
      } else {
        console.log('⚠️  OpenAI API: Not tested');
      }
    }
  } catch (error) {
    console.log('❌ Debug test failed:', error.message);
  }
}

// Run tests
testDebugEndpoint()
  .then(() => testFrontendSimulation())
  .then(() => console.log('\n✅ All tests complete!'))
  .catch(error => console.error('💥 Test suite failed:', error)); 