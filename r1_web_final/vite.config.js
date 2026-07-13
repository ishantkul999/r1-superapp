import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy all /api calls to the gateway so browser never sees cross-origin
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // Pass cookies / auth headers through
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[proxy error]', err.message)
          })
        }
      },
      // Also proxy WebSocket for SOS Socket.io
      '/socket.io': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        ws: true,
        secure: false
      }
    }
  }
})
