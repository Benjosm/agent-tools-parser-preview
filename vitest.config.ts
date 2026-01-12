import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul' if you prefer
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,      // Minimum line coverage %
        functions: 80,  // Minimum function coverage %
        branches: 75,   // Minimum branch coverage %
        statements: 80  // Minimum statement coverage %
      }
    },
    setupFiles: [],
    globals: true,
    include: ['tests/**/*.test.ts', 'src/__tests__/**/*.test.ts'],
    exclude: ['node_modules'],
  }
});
