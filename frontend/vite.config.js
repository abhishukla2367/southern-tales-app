import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // ─── Dev server proxy ─────────────────────────────────────────────
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },

  // ─── Preview server proxy (npm run preview) ───────────────────────
  // Without this, /api calls hit the preview server (port 4173)
  // instead of your Express backend (port 5000) — all logins fail
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },

  // ─── Build optimisations ──────────────────────────────────────────
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-map':      ['leaflet', 'react-leaflet'],
          'vendor-socket':   ['socket.io-client'],
          'vendor-icons':    ['lucide-react'],
          'vendor-charts':   ['recharts'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});