import { defineConfig } from 'vite'

export default defineConfig({
  root: './src',
  server: {
    host: '0.0.0.0',
    port: 8443,
    hmr: {
      host: 'localhost',
      port: 8443
    },
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      '/ws': {
        target: 'ws://backend:3000',
        ws: true,
        changeOrigin: true
      },
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
      }
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
