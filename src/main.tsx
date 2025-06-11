import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, PortalManager } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import theme from './theme'
import { initializeDemoData } from './services/demoData'
import { DEMO_MODE } from './services/firebase'
import { logger } from './utils/logger'

logger.info('LazyUncle app starting...')

// Initialize demo data if in demo mode
if (DEMO_MODE) {
  logger.debug('Demo mode detected, initializing demo data...')
  initializeDemoData()
}

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
});

// Get or create root element
const rootElement = document.getElementById('root') || (() => {
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  logger.warn('Root element was missing and has been created');
  return newRoot;
})();

try {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <ChakraProvider theme={theme}>
          <PortalManager>
            <App />
          </PortalManager>
        </ChakraProvider>
      </BrowserRouter>
    </StrictMode>,
  )
  logger.info('App rendered successfully');
} catch (error) {
  logger.error('Failed to render app:', error);
  
  // Simple fallback UI
  rootElement.innerHTML = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
      <h1 style="color: #03449E; margin-bottom: 20px;">LazyUncle</h1>
      <p style="margin-bottom: 20px;">We're having trouble loading the app. Please try refreshing the page.</p>
      <button onclick="window.location.reload()" style="background: #03449E; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
        Reload Page
      </button>
    </div>
  `;
}
