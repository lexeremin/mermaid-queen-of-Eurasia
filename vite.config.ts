import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // iPhones stay on old iOS versions for years: write syntax that Safari 15 understands.
  build: { target: ['es2020', 'safari15'] },
  optimizeDeps: {
    include: ['three', 'zustand', '@react-three/fiber', '@react-three/drei'],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
