import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'edge-runtime', include: ['packages/**/src/**/*.test.ts'], server: { deps: { inline: ['@convex-dev/agent', '@convex-dev/rate-limiter', '@convex-dev/batch-worker'] } } } });
