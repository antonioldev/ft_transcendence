import { defineConfig } from 'vite'

export default defineConfig({
  root: './src',
  server: {
    host: '0.0.0.0',
    port: 8443,
    hmr: {
      host: 'localhost',
      port: 8443
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
