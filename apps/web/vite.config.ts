import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const RENDER_BACKEND_API_URL = 'https://greenagro-api-tmpp.onrender.com/api';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envApiUrl = (process.env.VITE_API_BASE_URL || '').trim();
  const resolvedProdApiUrl =
    !envApiUrl ||
    envApiUrl === '/api' ||
    envApiUrl.includes('greenagro-api.vercel.app')
      ? RENDER_BACKEND_API_URL
      : envApiUrl;

  return {
    plugins: [react()],
    define:
      mode === 'production'
        ? {
            'import.meta.env.VITE_API_BASE_URL': JSON.stringify(resolvedProdApiUrl),
          }
        : undefined,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
