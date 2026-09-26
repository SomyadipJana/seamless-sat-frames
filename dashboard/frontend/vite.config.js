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
      '/gallery': {
        target: 'https://mosdac.gov.in',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
          });
        }
      },
      '/common': {
        target: 'https://mosdac.gov.in',
        changeOrigin: true,
      },
      '/assets': {
        target: 'https://mosdac.gov.in',
        changeOrigin: true,
      },
      '/api': {
        target: 'https://mosdac.gov.in',
        changeOrigin: true,
      },
      '/live': {
        target: 'https://mosdac.gov.in',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
          });
        }
      }
    }
  }
})
