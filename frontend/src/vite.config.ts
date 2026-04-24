// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173,
//     proxy: {
//       '/api': {
//         target: 'https://healthcare-w8iz.onrender.com',
//         changeOrigin: true,
//         secure: true,
//       }
//     }
//   }
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Must match PORT in backend .env (default: 5000)
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})