// Web icons from the launch app icon (design/launch/app-icon-1024.png):
//   apps/web/public/icons/icon-32.png, apple-touch-icon.png (180), icon-192.png, icon-512.png
// sharp is not a direct dependency: it comes with Astro (image service), so it is resolved through astro.
//   node scripts/make-icons.mjs
// The PNGs are committed; run this again only when the app icon changes.
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const fromWeb = createRequire(`${root}apps/web/package.json`)
const sharp = createRequire(fromWeb.resolve('astro/package.json'))('sharp')

const src = `${root}design/launch/app-icon-1024.png`
const out = `${root}apps/web/public/icons/`
mkdirSync(out, { recursive: true })

const sizes = [
  [32, 'icon-32.png'],
  [180, 'apple-touch-icon.png'],
  [192, 'icon-192.png'],
  [512, 'icon-512.png'],
]
for (const [size, name] of sizes) {
  await sharp(src).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9, palette: size <= 32 }).toFile(out + name)
  console.log(`${name} ${size}x${size}`)
}
