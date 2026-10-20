import preact from '@astrojs/preact'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// PORT lets several dev servers run side by side (component builders use 4401-4404).
// Each port gets its own Vite cache so parallel servers never race on dependency optimisation.
const port = Number(process.env.PORT) || 4321

// Canonical, hreflang and Open Graph URLs are absolute on this origin (SITE overrides it for previews).
const site = process.env.SITE || 'https://hisabkhata.com'

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  // 'preserve' keeps the registry's URL shapes: index pages are folders ('/', '/en/'), every other
  // page is '<route>.html', served at the registry route without a trailing slash ('/tools/emi').
  build: { format: 'preserve' },
  i18n: {
    locales: ['bn', 'en'],
    defaultLocale: 'bn',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [preact()],
  devToolbar: { enabled: false },
  server: { port, host: '127.0.0.1' },
  vite: {
    plugins: [tailwindcss()],
    cacheDir: process.env.PORT ? `node_modules/.vite-${port}` : undefined,
  },
})
