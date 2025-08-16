/* eslint-env node */
/* global process */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// PUBLIC_INTERFACE
export default defineConfig(({ mode }) => {
  // Load all env vars, including VITE_*
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), '');

  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:8000';

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      allowedHosts: ['.kavia.ai'],
      port: 3000,
      strictPort: true,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      watch: {
        usePolling: true,
      },
      proxy: {
        // Proxy API to backend during local dev (configurable via .env)
        '/api': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
        },
        // Optional: auth/token routes if served outside /api
        '/auth': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: env.VITE_WS_BASE_URL || apiBase,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
