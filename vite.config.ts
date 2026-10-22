import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// BASE is set to "/buildwithai/" for the GitHub Pages build (see scripts/deploy.mjs).
export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react()],
  worker: { format: 'es' },
  build: { target: 'es2022', sourcemap: true },
  test: {
    include: ['tests/engine/**/*.test.ts'],
    environment: 'node',
  },
});
