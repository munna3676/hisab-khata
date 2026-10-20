// /search-index.json: the MiniSearch index over the registry and the guides, built at build time
// and fetched by the search page when its box gets focus (@hisab/search lazySearch).
import { buildSearchIndex, serializeIndex, type GuideText } from '@hisab/search/index'

const guides = Object.values(import.meta.glob<GuideText>('../../../../data/guides/*.json', { eager: true, import: 'default' }))

export function GET() {
  return new Response(serializeIndex(buildSearchIndex({ guides })), { headers: { 'content-type': 'application/json' } })
}
