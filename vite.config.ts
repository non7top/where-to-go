import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/where-to-go/',
  build: { outDir: 'dist', chunkSizeWarningLimit: 1200 },
  test: { include: ['tests/**/*.test.ts'] },
});
