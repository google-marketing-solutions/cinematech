import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      script: {
        defineModel: true,
      },
    }),
    vueDevTools(),
    vueJsx()
  ],
  define: {
    'process.env': {}
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popup',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/api/v1': {
        target: 'https://us-central1-aiplatform.googleapis.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, '')
      }
    }
  }
})
