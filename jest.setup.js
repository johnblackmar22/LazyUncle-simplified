require('@testing-library/jest-dom'); 

// Mock static assets for Jest
defineJestAssetMocks();

function defineJestAssetMocks() {
  const assetExtensions = ['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp'];
  assetExtensions.forEach(ext => {
    jest.mock(`*.${ext}`, () => 'test-file-stub');
  });
} 