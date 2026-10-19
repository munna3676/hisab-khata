import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium, defineConfig } from '@playwright/test'

// Visual + a11y checks for the gallery and token pages.
//   PORT=4401 pnpm test:visual                 dev server on 4401 (started, or reused if running)
//   PORT=4401 SECTION=base pnpm shots          only #base, screenshots in test-results/gallery/base/
//   PW_SERVER=preview pnpm test:visual         serve the production build (CI) instead of `astro dev`
//   BASE_URL=https://preview.example pnpm test:visual   test a deployed preview, no local server
const PORT = Number(process.env.PORT) || 4400
const BASE_URL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`
const root = fileURLToPath(new URL('../../', import.meta.url))

// The container ships one Chromium build in /opt/pw-browsers; use it when the
// browser this @playwright/test version expects is not installed (CI installs its own).
function chromiumPath(): string | undefined {
  if (process.env.PW_CHROMIUM_PATH) return process.env.PW_CHROMIUM_PATH
  try {
    if (existsSync(chromium.executablePath())) return undefined
  } catch {
    /* fall through */
  }
  return existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined
}

const server = process.env.PW_SERVER === 'preview' ? 'preview' : 'dev'

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts$/,
  // Per-port output dir: Playwright empties it on every run, so parallel runs on other ports are untouched.
  outputDir: `${root}test-results/pw-${PORT}`,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: `${root}playwright-report` }]] : 'list',
  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    launchOptions: { executablePath: chromiumPath() },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium' }],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `pnpm --filter @hisab/web ${server}`,
        cwd: root,
        url: `${BASE_URL}/dev/gallery`,
        env: { PORT: String(PORT), ASTRO_TELEMETRY_DISABLED: '1' },
        reuseExistingServer: true,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
})
