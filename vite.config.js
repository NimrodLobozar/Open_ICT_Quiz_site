import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // In Docker op Windows komen bestandswijzigingen niet door; polling vangt ze toch op.
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true', interval: 300 },
    proxy: {
      '/api': process.env.API_PROXY_TARGET || 'http://localhost:3000',
    },
  },
})
