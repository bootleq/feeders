import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  test: {
    projects: [
      './tests/vitest.unit.config.mts',
      './tests/vitest.workers.config.mts',
    ],
  },
})