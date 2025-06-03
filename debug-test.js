// Debug Test Script for LazyUncle-Simplified
console.log('🔍 LazyUncle Debug Test Starting...');

// Test 1: Check localStorage for demo mode
console.log('=== DEMO MODE TEST ===');
const demoMode = localStorage.getItem('lazyuncle_demoMode');
const demoUser = localStorage.getItem('lazyuncle_demoUser');

console.log('Demo mode flag:', demoMode);
console.log('Demo user:', demoUser ? JSON.parse(demoUser) : 'None');

if (demoMode === 'true' && demoUser) {
  console.log('✅ Demo mode persistence working');
} else {
  console.log('❌ Demo mode persistence not working');
}

// Test 2: Check recipients data
console.log('\n=== RECIPIENTS DATA TEST ===');
const recipients = localStorage.getItem('lazyuncle_recipients');

if (recipients) {
  const recipientData = JSON.parse(recipients);
  console.log('Found recipients:', recipientData.length);
  recipientData.forEach(r => {
    console.log(`- ${r.name} (${r.relationship})`);
    if (r.deliveryAddress) {
      console.log(`  ✅ Has delivery address: ${r.deliveryAddress.line1}, ${r.deliveryAddress.city}`);
    } else {
      console.log(`  ❌ No delivery address`);
    }
  });
  console.log('✅ Recipients data found');
} else {
  console.log('❌ No recipients data found');
}

// Test 3: Check occasions data
console.log('\n=== OCCASIONS DATA TEST ===');
const occasionKeys = Object.keys(localStorage).filter(key => key.startsWith('lazyuncle_occasions_'));

if (occasionKeys.length > 0) {
  console.log('Found occasion keys:', occasionKeys.length);
  occasionKeys.forEach(key => {
    const occasions = localStorage.getItem(key);
    if (occasions) {
      const occasionData = JSON.parse(occasions);
      const recipientId = key.replace('lazyuncle_occasions_', '');
      console.log(`- ${key}: ${occasionData.length} occasions for recipient ${recipientId}`);
      occasionData.forEach(occ => {
        console.log(`  * ${occ.name} on ${occ.date} (${occ.type})`);
      });
    }
  });
  console.log('✅ Occasions data found');
} else {
  console.log('❌ No occasions data found');
}

// Test 4: Test address persistence
console.log('\n=== ADDRESS PERSISTENCE TEST ===');
if (recipients) {
  const recipientData = JSON.parse(recipients);
  const recipientsWithAddresses = recipientData.filter(r => r.deliveryAddress);
  
  if (recipientsWithAddresses.length > 0) {
    console.log(`✅ Found ${recipientsWithAddresses.length} recipients with addresses:`);
    recipientsWithAddresses.forEach(r => {
      console.log(`- ${r.name}: ${r.deliveryAddress.line1}, ${r.deliveryAddress.city}, ${r.deliveryAddress.state} ${r.deliveryAddress.postalCode}`);
    });
  } else {
    console.log('❌ No recipients with addresses found');
  }
}

// Test 5: Occasion loading after refresh simulation
console.log('\n=== OCCASION REFRESH TEST ===');
console.log('Simulating occasion loading after page refresh...');

const testOccasionLoading = () => {
  const recipients = JSON.parse(localStorage.getItem('lazyuncle_recipients') || '[]');
  console.log('Recipients available for occasion loading:', recipients.length);
  
  recipients.forEach(recipient => {
    const occasionKey = `lazyuncle_occasions_${recipient.id}`;
    const occasions = localStorage.getItem(occasionKey);
    if (occasions) {
      const occasionData = JSON.parse(occasions);
      console.log(`✅ Recipient ${recipient.name}: ${occasionData.length} occasions available`);
    } else {
      console.log(`❌ Recipient ${recipient.name}: no occasions found`);
    }
  });
};

testOccasionLoading();

// Test 4: Firebase Auth Persistence Test
console.log('\n=== FIREBASE AUTH PERSISTENCE TEST ===');
console.log('This test checks if Firebase auth state would persist properly.');
console.log('Run this in browser console after signing in and refreshing the page.');

// Test function to verify auth persistence
window.testAuthPersistence = function() {
  console.log('Testing auth persistence...');
  
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    console.log('❌ Firebase not loaded');
    return;
  }
  
  console.log('✅ Firebase loaded');
  console.log('Current auth state:', firebase.auth().currentUser ? 'Logged in' : 'Logged out');
  
  // Set up auth state listener
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      console.log('✅ Auth persistence working - user:', user.email);
    } else {
      console.log('❌ Auth persistence not working - no user found');
    }
  });
};

// Test 5: Test creating demo data
console.log('\n=== DEMO DATA CREATION TEST ===');
function createTestDemoData() {
  localStorage.setItem('lazyuncle_demoMode', 'true');
  localStorage.setItem('lazyuncle_demoUser', JSON.stringify(demoUser));
  
  // Create test recipient
  const testRecipient = {
    id: 'test-recipient-' + Date.now(),
    name: 'Test Recipient',
    relationship: 'Friend',
    interests: ['Testing'],
    createdAt: Date.now()
  };
  
  const recipients = JSON.parse(localStorage.getItem('lazyuncle_recipients') || '[]');
  recipients.push(testRecipient);
  localStorage.setItem('lazyuncle_recipients', JSON.stringify(recipients));
  
  console.log('✅ Test recipient with address added to localStorage');
  
  // Create test occasion
  const testOccasion = {
    id: 'test-occasion-' + Date.now(),
    recipientId: testRecipient.id,
    name: 'Test Birthday',
    date: new Date().toISOString().split('T')[0],
    type: 'birthday',
    notes: 'Test occasion',
    budget: 50,
    createdAt: Date.now()
  };
  
  const occasionKey = `lazyuncle_occasions_${testRecipient.id}`;
  localStorage.setItem(occasionKey, JSON.stringify([testOccasion]));
  
  console.log('✅ Test occasion added to localStorage');
  console.log('Reload the page and check if data persists');
}

// Expose test function globally
window.createTestDemoData = createTestDemoData;

console.log('\n=== PERSISTENCE VERIFICATION ===');
console.log('To test authentication persistence:');
console.log('1. Sign in to the app');
console.log('2. Add a recipient and occasion');
console.log('3. Refresh the page or close/reopen browser');
console.log('4. Check if you stay logged in and data is still there');
console.log('5. Run window.testAuthPersistence() in console to test Firebase auth');
console.log('6. Run window.createTestDemoData() to test demo data creation');

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