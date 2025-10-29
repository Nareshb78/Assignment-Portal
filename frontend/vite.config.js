import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
const API_TARGET = process.env.VITE_API_BASE_URL || 'http://localhost:5000';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    // This block tells Vite to redirect API calls to your backend server
    host : true,
    proxy: {
      '/api': {
        target: API_TARGET, // <--- Your running Node.js server port
        changeOrigin: true,
        secure: false, 
      },
    },
  },
})
