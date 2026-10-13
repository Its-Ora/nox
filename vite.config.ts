import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(({ mode }) => ({
  // Le mode "demo" sort un seul fichier HTML autonome (données simulées), pratique pour tester l'UI partout.
  plugins: [svelte(), ...(mode === 'demo' ? [viteSingleFile()] : [])],
  define: { __DEMO_ONLY__: JSON.stringify(mode === 'demo') },
  build: {
    outDir: mode === 'demo' ? 'dist-demo' : 'dist',
    target: 'es2022',
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: { ignored: ['**/src-tauri/**'] },
  },
}));
