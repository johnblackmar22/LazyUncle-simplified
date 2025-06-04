#!/usr/bin/env node

/**
 * This script tests the production build of LazyUncle
 * Run it after building the application with `npm run build`
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const handler = require('serve-handler');

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Error: dist folder not found. Run `npm run build` first.');
  process.exit(1);
}

// Check for essential files
const requiredFiles = ['index.html', 'assets'];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(distPath, file))) {
    console.error(`❌ Error: Required file/directory "${file}" not found in dist folder.`);
    process.exit(1);
  }
}

console.log('✅ Production build files verified');

// Start a local server to serve the built files
const server = http.createServer((req, res) => {
  return handler(req, res, {
    public: distPath
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`✅ Test server running at http://localhost:${PORT}`);
  console.log('⚠️ Open the URL in your browser to manually test the production build');
  console.log('Press Ctrl+C to stop the server');
});

// Automatically open in browser
try {
  const url = `http://localhost:${PORT}`;
  const cmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  execSync(`${cmd} ${url}`);
} catch (error) {
  console.log('ℹ️ Could not open browser automatically. Please open manually.');
} 