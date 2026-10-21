// Rewrites root-relative URLs in a built site so it can be served under a
// sub-path, e.g. GitHub Pages at /hisab-khata/. Used only for the preview
// deploy; the real site is served from the domain root.
// Usage: node scripts/rebase-paths.mjs <dist dir> </base/>
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [dir, base] = process.argv.slice(2)
if (!dir || !base || !base.startsWith('/') || !base.endsWith('/')) {
  console.error('usage: rebase-paths.mjs <dir> </base/>')
  process.exit(1)
}
const prefix = base.slice(0, -1)

const rewrite = (text, ext) => {
  // Attributes and CSS url() that start with a single slash (not // or the base itself).
  const notBase = `(?!/|${prefix.slice(1)}/)`
  text = text.replace(new RegExp(`((?:href|src|action|poster|data-href|content)=["'])/${notBase}`, 'g'), `$1${prefix}/`)
  text = text.replace(new RegExp(`url\\((["']?)/${notBase}`, 'g'), `url($1${prefix}/`)
  text = text.replace(new RegExp(`(srcset=["'][^"']*?)(^|[\\s,])/${notBase}`, 'g'), `$1$2${prefix}/`)
  if (ext === 'js' || ext === 'webmanifest' || ext === 'json' || ext === 'html') {
    // Quoted string literals that are site paths, e.g. "/_astro/x.js", "/tools/emi".
    text = text.replace(new RegExp(`(["'\`])/(?=(?:_astro|tools|en|search|mfs|bank|banks|guides|remittance|calculators|date-land-gold|sorkari-kaj|saved|all-tools|about|privacy|contact|disclaimer|changelog|icons|favicon|manifest|apple-touch-icon|search-index)[/."'\`?#])`, 'g'), `$1${prefix}/`)
  }
  return text
}

let changed = 0
const walk = (d) => {
  for (const name of readdirSync(d)) {
    const path = join(d, name)
    if (statSync(path).isDirectory()) { walk(path); continue }
    const ext = name.split('.').pop()
    if (!['html', 'css', 'js', 'webmanifest', 'json', 'xml'].includes(ext)) continue
    const before = readFileSync(path, 'utf8')
    const after = rewrite(before, ext)
    if (after !== before) { writeFileSync(path, after); changed++ }
  }
}
walk(dir)
console.log(`rebased ${changed} files under ${base}`)
