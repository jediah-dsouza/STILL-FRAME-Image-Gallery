import { unsplashSearchPlugin } from './server/viteSearchPlugin.js'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/STILL-FRAME-Image-Gallery/',

  plugins: [react(), unsplashSearchPlugin()],

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}', 'server/**/*.test.js'],
  },
})
