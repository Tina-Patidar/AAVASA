import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // One shared in-memory MongoDB per test file; run files sequentially to keep things simple
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 120000,
    include: ['tests/**/*.test.js'],
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123456',
      CLIENT_URL: 'http://localhost:5173',
    },
  },
});
