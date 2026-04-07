import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // @percolator/sdk is loaded dynamically at runtime only in live trading mode.
      // Its dependency on @solana/web3.js from a linked local path causes resolution
      // errors during build. Externalizing it lets the dynamic import() succeed at
      // runtime (where the package IS available) without blocking the build.
      external: ['@percolator/sdk'],
    },
  },
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
