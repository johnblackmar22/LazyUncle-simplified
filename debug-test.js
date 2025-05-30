// Debug Test Script for LazyUncle-Simplified
console.log('🔍 LazyUncle Debug Test Starting...');

// Test 1: Check localStorage for demo mode
console.log('\n=== Test 1: Demo Mode Check ===');
const demoMode = localStorage.getItem('lazyuncle_demoMode');
const demoUser = localStorage.getItem('lazyuncle_demoUser');
console.log('Demo mode flag:', demoMode);
console.log('Demo user exists:', !!demoUser);

if (demoUser) {
  try {
    const user = JSON.parse(demoUser);
    console.log('Demo user:', user.email, user.displayName);
  } catch (e) {
    console.log('Error parsing demo user:', e);
  }
}

// Test 2: Check recipients data
console.log('\n=== Test 2: Recipients Data ===');
const recipients = localStorage.getItem('lazyuncle_recipients');
console.log('Recipients exist:', !!recipients);

if (recipients) {
  try {
    const recipientData = JSON.parse(recipients);
    console.log('Number of recipients:', recipientData.length);
    recipientData.forEach((r, i) => {
      console.log(`Recipient ${i + 1}:`, r.name, 'Address:', !!r.deliveryAddress);
    });
  } catch (e) {
    console.log('Error parsing recipients:', e);
  }
}

// Test 3: Check occasions data
console.log('\n=== Test 3: Occasions Data ===');
const occasionKeys = Object.keys(localStorage).filter(key => key.startsWith('lazyuncle_occasions_'));
console.log('Occasion keys found:', occasionKeys.length);
occasionKeys.forEach(key => {
  const occasions = localStorage.getItem(key);
  if (occasions) {
    try {
      const occasionData = JSON.parse(occasions);
      console.log(`${key}:`, occasionData.length, 'occasions');
    } catch (e) {
      console.log(`Error parsing ${key}:`, e);
    }
  }
});

// Test 4: Current URL and auth state
console.log('\n=== Test 4: Page State ===');
console.log('Current URL:', window.location.href);
console.log('Current pathname:', window.location.pathname);

// Simple demo mode setup function
window.setupDemoMode = function() {
  console.log('🎯 Setting up demo mode...');
  
  const demoUser = {
    id: 'demo-user',
    email: 'demo@example.com',
    displayName: 'Demo User',
    photoURL: '',
    createdAt: Date.now(),
    planId: 'free',
  };
  
  localStorage.setItem('lazyuncle_demoMode', 'true');
  localStorage.setItem('lazyuncle_demoUser', JSON.stringify(demoUser));
  
  console.log('✅ Demo mode setup complete! Reload the page.');
  return 'Demo mode activated!';
};

// Function to clear all data
window.clearAllData = function() {
  console.log('🧹 Clearing all LazyUncle data...');
  
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('lazyuncle_')) {
      localStorage.removeItem(key);
      console.log('Removed:', key);
    }
  });
  
  console.log('✅ All data cleared! Reload the page.');
  return 'Data cleared!';
};

// Test address form functionality
window.testAddressForm = function() {
  console.log('🏠 Testing address functionality...');
  
  // Simulate address form onChange
  const testAddress = {
    line1: '123 Test Street',
    line2: 'Apt 4B',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345',
    country: 'US'
  };
  
  console.log('Test address:', testAddress);
  
  // Check if we can save a recipient with this address
  const testRecipient = {
    id: 'test-recipient',
    userId: 'demo-user',
    name: 'Test User',
    relationship: 'Friend',
    interests: ['Testing'],
    deliveryAddress: testAddress,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  const recipients = JSON.parse(localStorage.getItem('lazyuncle_recipients') || '[]');
  recipients.push(testRecipient);
  localStorage.setItem('lazyuncle_recipients', JSON.stringify(recipients));
  
  console.log('✅ Test recipient with address added to localStorage');
  return 'Address test complete!';
};

console.log('\n🎮 Available test functions:');
console.log('- setupDemoMode() - Set up demo mode');
console.log('- clearAllData() - Clear all stored data');
console.log('- testAddressForm() - Test address functionality');
console.log('\n✅ Debug script loaded!'); 