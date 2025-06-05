// Test script for AI gift recommendations function
const testRequest = {
  recipient: {
    name: "Test User",
    age: 25,
    interests: ["books", "technology"],
    relationship: "friend",
    location: "US"
  },
  occasion: {
    type: "Birthday",
    date: "2024-02-15",
    significance: "regular"
  },
  budget: {
    total: 50,
    giftBudget: 40,
    giftWrap: true
  },
  preferences: {
    excludeCategories: [],
    preferredCategories: [],
    prioritizeFreeShipping: true,
    maxShippingCost: 15
  }
};

async function testFunction() {
  try {
    console.log('Testing gift recommendations function...');
    console.log('Request data:', JSON.stringify(testRequest, null, 2));
    
    const response = await fetch('http://localhost:8888/.netlify/functions/gift-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      console.error('Response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Success! Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  testFunction();
} 