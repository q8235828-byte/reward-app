import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only proxy: lets `npm run dev` (Vite on its own port) call the
// Express API without needing CORS - the browser only ever talks to
// Vite's origin, which forwards /api/* to the backend server-side. In
// production there's no proxy needed at all since Express serves both
// the built frontend and the API from the same origin (see backend/src/app.js).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
