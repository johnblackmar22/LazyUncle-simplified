const http = require('http');
const fs = require('fs');

// Try to load each of the SVG files from the website
const imageUrls = [
  'http://localhost:5174/Logos/Small-logo.svg',
  'http://localhost:5174/Logos/Small%20logo.jpeg',
  'http://localhost:5174/Logos/converted_1747771169_5314%20(1).svg'
];

imageUrls.forEach(url => {
  http.get(url, (res) => {
    console.log(`${url} - Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`Successfully loaded image, size: ${data.length} bytes`);
      } else {
        console.log(`Failed to load image: ${data.substring(0, 100)}...`);
      }
    });
  }).on('error', (err) => {
    console.error(`Error loading ${url}: ${err.message}`);
  });
}); 