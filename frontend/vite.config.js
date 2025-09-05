import { defineConfig } from 'vite'

export default defineConfig({
  root: './src',
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: 'localhost',
      port: 5173
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: './src/index.html'
      }
    }
  },
  css: {
    postcss: './postcss.config.js'
  }
})
