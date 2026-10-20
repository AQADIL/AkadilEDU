import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: env.VITE_DEV_HOST,
      port: env.VITE_DEV_PORT ? Number(env.VITE_DEV_PORT) : undefined,
      strictPort: true,
    },
    esbuild: { drop: ['debugger'] },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            localization: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
            motion: ['framer-motion'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
          },
        },
      },
    },
  };
});
