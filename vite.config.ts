import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    open: true,
    cors: true,
    hmr: {
      overlay: false
    }
  },
  build: {
    sourcemap: true
  },
  // Show more errors in the browser console
  logLevel: 'info',
  // Ensure assets are handled correctly
  publicDir: 'public',
  // Better error handling and dependency optimization
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@chakra-ui/react',
      '@emotion/react',
      '@emotion/styled',
      'framer-motion',
      'date-fns',
      'zustand'
    ],
    exclude: [
      'firebase'
    ],
    force: true
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
