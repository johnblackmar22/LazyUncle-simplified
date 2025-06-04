// Address debugging script
console.log('=== Address Debug Test ===');

// Test 1: Check if AddressForm is properly passing data to parent
const testAddressForm = () => {
  console.log('Testing AddressForm callback...');
  
  // Simulate address form data
  const testAddress = {
    line1: '123 Test Street',
    line2: 'Apt 4B',
    city: 'Test City',
    state: 'CA',
    postalCode: '90210',
    country: 'US'
  };
  
  console.log('Test address:', testAddress);
  return testAddress;
};

// Test 2: Check recipient data structure
const testRecipientData = () => {
  console.log('Testing recipient data structure...');
  
  const testRecipient = {
    name: 'Test Person',
    relationship: 'Friend',
    birthdate: '1990-01-01',
    interests: ['gaming', 'music'],
    description: 'Test description',
    deliveryAddress: {
      line1: '123 Test Street',
      line2: 'Apt 4B',
      city: 'Test City',
      state: 'CA',
      postalCode: '90210',
      country: 'US'
    }
  };
  
  console.log('Test recipient:', testRecipient);
  return testRecipient;
};

// Test 3: Check if address is being properly serialized for Firebase
const testFirebaseData = () => {
  console.log('Testing Firebase data structure...');
  
  const testData = testRecipientData();
  const firebaseData = {
    ...testData,
    userId: 'test-user-id',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  console.log('Firebase data:', firebaseData);
  console.log('Address in Firebase data:', firebaseData.deliveryAddress);
  
  return firebaseData;
};

// Run tests
testAddressForm();
testRecipientData();
testFirebaseData();

console.log('=== Address Debug Test Complete ==='); 