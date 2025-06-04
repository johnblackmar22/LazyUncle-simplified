// Test script for lazyuncle-dev production debugging
console.log('🔍 Testing lazyuncle-dev Production Environment...');

async function testProductionEnvironment() {
  const baseUrl = 'https://lazyuncle-dev.netlify.app';
  
  console.log('\n=== TESTING OPENAI API STATUS ===');
  
  try {
    // Test the detailed debug endpoint first
    const debugUrl = `${baseUrl}/.netlify/functions/gift-recommendations-detailed-debug`;
    console.log('🔧 Testing debug endpoint:', debugUrl);
    
    const debugResponse = await fetch(debugUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'production-debug' })
    });
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug endpoint successful');
      console.log('📊 Environment Info:', {
        openai_key_present: debugData.environment?.openai_key_present,
        openai_key_length: debugData.environment?.openai_key_length,
        api_test_success: debugData.openai_status?.api_test_success,
        api_test_error: debugData.openai_status?.api_test_error?.message
      });
      
      if (debugData.openai_status?.api_test_error) {
        console.log('❌ OpenAI API Test Failed:', debugData.openai_status.api_test_error);
      } else if (debugData.openai_status?.api_test_success) {
        console.log('🎉 OpenAI API Test Successful!');
      }
    } else {
      console.log('❌ Debug endpoint failed:', debugResponse.status);
    }
    
    console.log('\n=== TESTING GIFT RECOMMENDATIONS ===');
    
    // Test actual gift recommendations
    const giftUrl = `${baseUrl}/.netlify/functions/gift-recommendations-enhanced`;
    console.log('🎁 Testing gift recommendations:', giftUrl);
    
    const testRecipient = {
      name: "Production Test",
      interests: ["technology", "books"],
      relationship: "friend",
      description: "Tech enthusiast who loves reading"
    };
    
    const giftResponse = await fetch(giftUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        recipient: testRecipient,
        budget: 75,
        occasion: "birthday",
        pastGifts: [],
        timestamp: Date.now()
      })
    });
    
    console.log('📊 Gift Response Status:', giftResponse.status);
    
    if (giftResponse.ok) {
      const giftData = await giftResponse.json();
      console.log('✅ Gift recommendations successful');
      console.log('🤖 AI Model Used:', giftData.metadata?.model || 'unknown');
      console.log('📦 Suggestions Count:', giftData.suggestions?.length || 0);
      
      if (giftData.metadata?.model === 'gpt-4o-mini') {
        console.log('🎉 REAL AI WORKING! Sample suggestion:', giftData.suggestions?.[0]?.name);
      } else if (giftData.metadata?.model === 'fallback') {
        console.log('⚠️  Using fallback recommendations');
        console.log('🔍 Fallback reason:', giftData.metadata?.fallback_reason);
      }
      
      // Test a sample suggestion
      if (giftData.suggestions?.length > 0) {
        const sample = giftData.suggestions[0];
        console.log('📋 Sample suggestion:', {
          name: sample.name,
          price: sample.price,
          reasoning: sample.reasoning?.substring(0, 100) + '...'
        });
      }
    } else {
      const errorText = await giftResponse.text();
      console.log('❌ Gift recommendations failed:', errorText.substring(0, 300));
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.log('\n🔧 Check:');
    console.log('- Is lazyuncle-dev.netlify.app accessible?');
    console.log('- Are the Netlify functions deployed?');
    console.log('- Is your internet connection working?');
  }
}

// Run the test
testProductionEnvironment().then(() => {
  console.log('\n✅ Production debugging complete!');
}).catch(error => {
  console.error('💥 Unexpected error:', error);
}); 