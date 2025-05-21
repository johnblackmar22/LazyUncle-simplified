// This file is manually copied to public to be included in the HTML
window.onload = function() {
  console.log('Vite imports fix loaded');
  
  // Check if any images failed to load
  document.querySelectorAll('img').forEach(img => {
    img.onerror = function() {
      console.error('Failed to load image:', img.src);
      // Try to fix the path
      if (img.src.includes('/Logos/')) {
        // Try an alternative path
        const newSrc = img.src.replace('/Logos/', '/src/assets/');
        console.log('Trying alternative path:', newSrc);
        img.src = newSrc;
      }
    };
  });
}; 