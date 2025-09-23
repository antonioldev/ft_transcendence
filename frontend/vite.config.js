import { defineConfig } from 'vite'

export default defineConfig({
  root: './src',
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: 'localhost',
      port: 5173
    }
  },
  build: {
    outDir: '../dist'
  },
  css: {
    postcss: './postcss.config.js'
  }
})
import { defineConfig } from 'vite'

export default defineConfig({
  root: './src',
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    outDir: '../dist'
  },
  css: {
    postcss: './postcss.config.js'
  }
})
