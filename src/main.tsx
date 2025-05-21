import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import theme from './theme'
import { initializeDemoData } from './services/demoData'
import { DEMO_MODE } from './services/firebase'

// Add console output for debugging
console.log('LazyUncle app starting...')

// Initialize demo data if in demo mode
if (DEMO_MODE) {
  console.log('Demo mode detected, initializing demo data...')
  initializeDemoData()
}

// Error boundary for the entire app
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Create a visible error display
  const errorDisplay = document.createElement('div');
  errorDisplay.style.position = 'fixed';
  errorDisplay.style.top = '0';
  errorDisplay.style.left = '0';
  errorDisplay.style.right = '0';
  errorDisplay.style.padding = '20px';
  errorDisplay.style.backgroundColor = 'rgba(255,0,0,0.9)';
  errorDisplay.style.color = 'white';
  errorDisplay.style.zIndex = '10000';
  errorDisplay.textContent = `Application Error: ${event.error?.message || 'Unknown error'}`;
  document.body.appendChild(errorDisplay);
});

// Ensure the root element exists
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found!')
  
  // Create root element if missing
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  
  console.log('Created missing root element');
} else {
  console.log('Root element found, mounting app')
}

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ChakraProvider theme={theme}>
          <App />
        </ChakraProvider>
      </BrowserRouter>
    </StrictMode>,
  )
  console.log('App successfully rendered');
} catch (error) {
  console.error('Failed to render app:', error);
  
  // Fallback rendering - create a simple UI if React fails
  const fallbackRoot = document.getElementById('root');
  if (fallbackRoot) {
    fallbackRoot.innerHTML = `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #03449E;">LazyUncle</h1>
        <p>Something went wrong loading the application. Here's what we know:</p>
        <pre style="background: #f5f5f5; padding: 10px; white-space: pre-wrap;">${error?.toString() || 'Unknown error'}</pre>
        
        <h2>Try these troubleshooting steps:</h2>
        <ul>
          <li>Clear your browser cache and refresh</li>
          <li>Try using an incognito/private browsing window</li>
          <li>Check your browser console for specific errors</li>
          <li>Ensure JavaScript is enabled in your browser</li>
        </ul>
        
        <div>
          <button onclick="window.location.reload()" style="background: #03449E; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
}
