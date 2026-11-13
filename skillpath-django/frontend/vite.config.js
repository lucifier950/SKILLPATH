import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(),tailwindcss()],
  // The production build is served by Django: assets under /static/, output in ../frontend_build.
  base: command === 'build' ? '/static/' : '/',
  build: {
    outDir: '../frontend_build',
    emptyOutDir: true,
    // Fixed name for the stylesheet so Django templates can link it: {% static 'assets/index.css' %}
    rollupOptions: {
      output: {
        assetFileNames: (asset) =>
          (asset.names?.[0] ?? asset.name ?? '').endsWith('.css') ? 'assets/[name][extname]' : 'assets/[name]-[hash][extname]',
      },
    },
  },
  // `npm run dev` (hot reload): forward API calls to `python manage.py runserver`.
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
}))
