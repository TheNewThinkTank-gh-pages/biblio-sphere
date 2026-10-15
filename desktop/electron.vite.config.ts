import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: resolve('dist/desktop/main'),
      rollupOptions: { input: { index: resolve('desktop/main.ts') } },
    },
  },
  renderer: {
    root: resolve('desktop/renderer'),
    base: './',
    server: { host: '127.0.0.1', port: 5173 },
    build: {
      outDir: resolve('dist/desktop/renderer'),
      rollupOptions: { input: resolve('desktop/renderer/index.html') },
    },
  },
});