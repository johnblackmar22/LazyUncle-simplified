// Test gift recommendations function directly
console.log('🧪 Testing Gift Recommendations Function...');

const testData = {
  recipient: {
    name: "Test User",
    age: 25,
    relationship: "friend",
    interests: ["books", "technology"],
    description: "Loves reading sci-fi novels and gadgets",
    gender: "non-binary"
  },
  budget: 75,
  occasion: "birthday",
  pastGifts: [],
  preferences: {
    giftWrap: true,
    personalNote: true,
    deliverySpeed: "standard"
  }
};

async function testFunction() {
  try {
    console.log('📤 Sending request to function...');
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:8888/.netlify/functions/gift-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📝 Raw response:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Function succeeded!');
        console.log('📋 Suggestions count:', data.suggestions?.length || 0);
        console.log('📋 Model used:', data.metadata?.model || 'unknown');
        console.log('📋 Sample suggestion:', data.suggestions?.[0]?.name || 'none');
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError.message);
      }
    } else {
      console.error('❌ Function failed with status:', response.status);
      console.error('❌ Error response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Full error:', error);
  }
}

// Run test after a brief delay to ensure dev server is ready
setTimeout(testFunction, 2000); 