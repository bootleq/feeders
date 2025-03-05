import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})