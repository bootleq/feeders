import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: path.join(rootDir, 'wrangler.jsonc')}
    }),
  ],
  test: {
    name: 'workers',
    include: ['**/*.cf.test.ts'],
    setupFiles: [path.join(rootDir, 'tests/vitest.workers.setup.mts')],
  },
  resolve: {
    alias: {
      '@': path.join(rootDir, 'src')
    }
  },
});
