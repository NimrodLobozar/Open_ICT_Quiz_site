import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker wijst dit naar de server-container, lokaal naar localhost:3000.
const target = process.env.VITE_PROXY_TARGET || 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Polling is nodig om wijzigingen te zien in Docker op Windows (bind-mounts).
    watch: { usePolling: process.env.CHOKIDAR_USEPOLLING === 'true' },
    // De browser praat alleen met Vite; Vite stuurt /api en /socket.io door naar de server.
    // Daardoor geen CORS-gedoe en werken cookies gewoon (zelfde origin).
    proxy: {
      '/api': target,
      '/socket.io': { target, ws: true },
    },
  },
})
