// Test script to verify production OpenAI setup
console.log('🔍 Testing Production OpenAI Configuration...');

async function testProductionFunction() {
  console.log('\n📍 Testing your deployed Netlify function...');
  
  // Test data matching your real use case
  const testData = {
    recipient: {
      name: "Production Test User",
      age: 30,
      relationship: "friend",
      interests: ["technology", "books", "cooking"],
      description: "Tech-savvy friend who loves innovative gadgets and reading",
      gender: "female"
    },
    budget: 100,
    occasion: "birthday",
    pastGifts: [],
    preferences: {
      giftWrap: true,
      personalNote: true,
      deliverySpeed: "standard"
    }
  };

  try {
    // Replace with your actual Netlify URL
    const netlifyUrl = 'https://your-site-name.netlify.app/.netlify/functions/gift-recommendations';
    
    console.log('🌐 Making request to:', netlifyUrl);
    console.log('📦 Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(netlifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('\n📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ SUCCESS! Function working correctly');
        console.log('🤖 Model used:', data.metadata?.model || 'unknown');
        console.log('📈 Suggestions count:', data.suggestions?.length || 0);
        
        if (data.metadata?.model === 'gpt-4o-mini') {
          console.log('🎉 REAL AI RECOMMENDATIONS WORKING!');
          console.log('💡 Sample suggestion:', data.suggestions?.[0]?.name || 'none');
          console.log('🧠 AI reasoning:', data.suggestions?.[0]?.reasoning || 'none');
        } else if (data.metadata?.model === 'fallback') {
          console.log('⚠️  Using fallback - check OpenAI API key in Netlify');
          console.log('🔍 Fallback reason:', data.metadata?.fallback_reason || 'unknown');
        }
        
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError.message);
        console.log('📝 Raw response:', responseText.substring(0, 500));
      }
    } else {
      console.error('❌ Function failed with status:', response.status);
      console.error('📝 Error response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n🔧 Troubleshooting checklist:');
    console.log('- [ ] Netlify site is deployed');
    console.log('- [ ] Function is properly deployed');
    console.log('- [ ] OPENAI_API_KEY is set in Netlify environment variables');
    console.log('- [ ] API key is scoped to "Functions" only');
    console.log('- [ ] Site URL is correct in this test');
  }
}

// Instructions for user
console.log('📋 INSTRUCTIONS:');
console.log('1. Replace "your-site-name" with your actual Netlify site name');
console.log('2. Run this test against your deployed site');
console.log('3. Check the results to verify OpenAI integration');
console.log('\n🚀 Starting test in 3 seconds...\n');

setTimeout(testProductionFunction, 3000); 