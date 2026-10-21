import preact from '@astrojs/preact'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// PORT lets several dev servers run side by side (component builders use 4401-4404).
// Each port gets its own Vite cache so parallel servers never race on dependency optimisation.
const port = Number(process.env.PORT) || 4321

// Canonical, hreflang and Open Graph URLs are absolute on this origin (SITE overrides it for previews).
const site = process.env.SITE || 'https://hisabkhata.com'

// Client chunks (scripts/check-js-budget.mjs keeps calculator pages under 25 KB gz). Left alone,
// the bundler cuts the calculator template into ~30 files of a few hundred bytes each, and every
// file pays its own gzip and request overhead. These groups put what every calculator page loads
// first into two files: the Preact runtime and the template (inputs, result card, action bar,
// URL state), plus a small 'shared' file for what Home's scripts use too (theme settings,
// number and date formatting), so Home never loads the template. Only modules a page actually
// imports up front belong here: the report sheet, toasts, the platform adapter and preact/compat
// stay separate and load on demand.
const TOOL_TEMPLATE = [
  /packages\/pages\/src\/tool\/(url-state|hooks|parts|ToolActions|text|validation)\.tsx?$/,
  /packages\/ui\/src\/base\/(Badge|Button|Callout|Chip|CompareRow|KVRow|NumberField|QuickValues|SegmentedControl|TextField|uid)\.tsx?$/,
  /packages\/ui\/src\/(nav\/ResultCard|content\/ActionBar)\.tsx$/,
  /packages\/ui\/src\/lib\/(cx|motion)\.ts$/,
  /packages\/ui\/src\/icons\/(Icon|common|glyphs\/(Share|Download|Flag|FigmaAlert|FigmaInfo))\.tsx$/,
  /packages\/i18n\/src\/t\.ts$/,
  /packages\/core\/src\/lib\/money\.ts$/,
  /node_modules\/clsx\//,
]
const CHUNK_GROUPS = [
  { name: 'preact', test: /node_modules\/preact\/(dist|hooks\/dist|jsx-runtime\/dist)\//, priority: 2 },
  { name: 'tool', test: (id: string) => TOOL_TEMPLATE.some((re) => re.test(id)), priority: 1 },
  {
    name: 'shared',
    test: /packages\/(ui\/src\/lib\/settings|i18n\/src\/format|core\/src\/lib\/(format|digits|dates-calendar))\.ts$/,
    // Taken first: a group also takes the modules its members import, so 'tool' would take these.
    priority: 3,
  },
]

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
    // SOURCEMAP=1 pnpm build: source maps, for looking into chunk sizes (scripts/check-js-budget.mjs).
    build: {
      sourcemap: process.env.SOURCEMAP === '1',
      rolldownOptions: { output: { codeSplitting: { groups: CHUNK_GROUPS } } },
    },
    cacheDir: process.env.PORT ? `node_modules/.vite-${port}` : undefined,
  },
})
