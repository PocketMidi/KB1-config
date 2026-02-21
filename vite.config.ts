import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/KB1/KB1-config/',
  server: {
    port: 5173,
    strictPort: false, // Try next port if 5173 is busy
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
