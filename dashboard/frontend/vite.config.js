import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/feeds/mosdac': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/interpolate': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/generate': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/download_h5': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/config': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },

    }
  }
})
