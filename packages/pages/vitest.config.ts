import { defineConfig } from 'vitest/config'

// Component unit tests: happy-dom + @testing-library/preact. Files: src/**/*.test.ts(x), test/**/*.test.ts(x).
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
  },
})
