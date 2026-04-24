import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In local dev, proxy /api → the render.com backend.
      // On Vercel, vercel.json rewrites handle this instead.
      '/api': {
        target: 'https://healthcare-w8iz.onrender.com',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
