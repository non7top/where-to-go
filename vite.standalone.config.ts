import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

const DATA_FILES = ['areas.geojson', 'land.geojson', 'climate.json', 'events.json', 'concerts.json', 'fronts.json', 'shortcuts.json'];

// Build that opens by double-click from disk: one classic script, data inlined, no module or fetch needs.
const standaloneEntry: Plugin = {
  name: 'standalone-entry',
  transformIndexHtml: { order: 'pre', handler: (html) => html.replace('/src/main.ts', '/src/standalone-entry.ts') },
};

const standaloneData: Plugin = {
  name: 'standalone-data',
  transformIndexHtml: {
    order: 'post',
    handler: (html) => ({
      html: html.replaceAll(' crossorigin', '').replace(' type="module"', ' defer'),
      tags: [{ tag: 'script', attrs: { src: './assets/data.js', defer: true }, injectTo: 'head-prepend' }],
    }),
  },
  generateBundle() {
    const data = Object.fromEntries(DATA_FILES.map((f) => [f, JSON.parse(readFileSync(`public/data/${f}`, 'utf8'))]));
    this.emitFile({ type: 'asset', fileName: 'assets/data.js', source: `globalThis.__WTG_DATA__=${JSON.stringify(data)};` });
  },
};

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [standaloneEntry, standaloneData],
  build: {
    outDir: '.cache/standalone',
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/app.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
