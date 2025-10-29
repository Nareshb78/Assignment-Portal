// vite.config.js (FINAL DEPLOYMENT CONFIG)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// --- CRITICAL CONFIGURATION ---
// Vercel injects the VITE_API_BASE_URL variable during the build.
// We prioritize the environment variable, but default to localhost for local testing.
const API_TARGET = process.env.VITE_API_BASE_URL || 'http://localhost:5000';
// ------------------------------


// https://vite.dev/config/
export default defineConfig({
  // Plugins are correctly defined
  plugins: [react(),tailwindcss()],
  
  server: {
    // CRITICAL for local network access (allows phone connection)
    host: true, 
    
    proxy: {
      '/api': {
        // FIX: Dynamic target URL points to the Render API in production
        target: API_TARGET, 
        
        // This setting ensures Vercel's proxy correctly rewrites the hostname/port
        changeOrigin: true, 
        secure: false, 
      },
    },
  },
});