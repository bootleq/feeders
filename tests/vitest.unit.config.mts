import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'units',
    environment: 'jsdom',
    dir: 'src',
    exclude: ['**/*.cf.test.ts', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@': path.join(rootDir, 'src')
    }
  },
})
