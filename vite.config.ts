
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 'base: "./"' ensures that assets are loaded correctly on GitHub Pages sub-folders
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});
