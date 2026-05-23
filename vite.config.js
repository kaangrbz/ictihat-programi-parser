import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        explorer: 'explorer.html',
        'law-parser': 'law-parser.html',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': { target: 'http://localhost:8102', changeOrigin: true },
    },
  },
});
