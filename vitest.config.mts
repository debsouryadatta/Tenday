import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'edge-runtime',
    maxWorkers: 1,
    testTimeout: 10000,
    include: ['packages/**/src/**/*.test.ts'],
    server: {
      deps: {
        inline: [
          '@convex-dev/agent',
          '@convex-dev/rate-limiter',
          '@convex-dev/batch-worker',
        ],
      },
    },
  },
});
