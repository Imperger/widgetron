import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  esbuild: {
    minifySyntax: false, // without it: Could not load file 'bundle.js' for content script. It isn't UTF-8 encoded.
    minifyIdentifiers: true,
    minifyWhitespace: true,
  },
  build: {
    outDir: 'dist-client',
    rollupOptions: {
      output: {
        format: 'iife',
      },
    },
    cssCodeSplit: false,
    assetsInlineLimit: 10000000, // the hack required for 'codicon.ttf' inlining
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8080,
  },
});
