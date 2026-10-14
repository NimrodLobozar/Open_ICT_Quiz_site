import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker is dit http://backend:3000, lokaal http://localhost:3000.
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // In Docker op Windows komen bestandswijzigingen niet door; polling vangt ze toch op.
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true', interval: 300 },
    proxy: {
      '/api': apiTarget,
      // ws: true stuurt ook de WebSocket-verbinding door, niet alleen gewone HTTP-requests.
      // Zonder valt Socket.IO stil terug op "long-polling": het werkt, maar trager.
      '/socket.io': { target: apiTarget, ws: true },
    },
  },
})
