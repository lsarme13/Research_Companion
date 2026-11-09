import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: clientDir,
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [path.resolve(clientDir, '..')],
    },
    proxy: {
      '/api': 'http://127.0.0.1:4317',
    },
  },
  build: {
    outDir: path.resolve(clientDir, '../dist/client'),
    emptyOutDir: false,
  },
});
