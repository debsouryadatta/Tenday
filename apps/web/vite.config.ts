import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  plugins: [react()],
  base: process.env.TENDAY_WEB_BASE_URL || '/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    fs: {
      deny: [
        '**/.env',
        '**/.env.*',
        '**/.git/**',
        '**/.local/**',
        '**/*.{crt,pem,key,p12,pfx,cer,der,keystore}',
        '**/.npmrc',
        '**/.yarnrc.yml',
      ],
    },
  },
});
