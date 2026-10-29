import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In development the client calls "/api/..." and Vite forwards it to the Express server.
// This keeps everything same-origin, so the httpOnly login cookie works without extra CORS setup.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_DEV_PROXY_TARGET || 'http://localhost:5000';
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: { '/api': { target, changeOrigin: true } },
    },
  };
});
