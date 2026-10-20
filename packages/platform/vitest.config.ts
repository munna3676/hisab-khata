import { defineConfig } from 'vitest/config'

// The web implementation uses navigator, localStorage and IndexedDB, so tests run in happy-dom.
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
  },
})
