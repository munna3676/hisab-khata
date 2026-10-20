import type { Lang } from '@hisab/i18n/locale'
import { t } from '@hisab/i18n/messages'
import { routeOf } from '@hisab/i18n/routes'
import { collectionsFor, getPlatform } from '@hisab/platform/index'
import { lazySearch, type SearchHit } from '@hisab/search/index'
import { SearchBar } from '@hisab/ui/base'
import { ListRow } from '@hisab/ui/nav'
import { EmptyState } from '@hisab/ui/overlay'
import { useEffect, useState } from 'preact/hooks'

export interface SearchResultsProps {
  lang: Lang
}

const search = lazySearch(() => fetch('/search-index.json').then((r) => r.text()))

/**
 * The search page body until the full search screen (02 Search Result) is built: the query from
 * ?q=, a medium search field and the matching registry pages from the offline index.
 */
export function SearchResults({ lang }: SearchResultsProps) {
  const [query, setQuery] = useState<string | null>(null)
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [text, setText] = useState('')

  const run = async (q: string) => {
    setQuery(q)
    setText(q)
    if (!q) return setHits(null)
    void collectionsFor(getPlatform().store).recentSearches.push(q).catch(() => undefined)
    try {
      // Pages behind a [param] route (one bank's FDR rates…) are reached from their hub, not listed here.
      setHits((await search.search(q, { limit: 24 })).filter((hit) => !hit.entry.route.bn.includes('[')).slice(0, 20))
    } catch {
      setHits([])
    }
  }

  useEffect(() => {
    void run(new URLSearchParams(location.search).get('q')?.trim() ?? '')
  }, [])

  const onSearch = (q: string) => {
    const url = new URL(location.href)
    if (q) url.searchParams.set('q', q)
    else url.searchParams.delete('q')
    history.replaceState(null, '', url)
    void run(q)
  }

  return (
    <div class="flex flex-col gap-5" data-search-results>
      <SearchBar
        size="medium"
        action={routeOf('search', lang)}
        placeholder={t(lang, 'search.placeholderExample')}
        label={t(lang, 'search.label')}
        value={text}
        onInput={setText}
        onSearch={onSearch}
        onFocus={() => void search.ready().catch(() => undefined)}
      />
      {query && hits && hits.length > 0 && (
        <section aria-live="polite">
          <h2 class="type-label text-soft">{t(lang, 'search.resultsFor', { query, count: hits.length })}</h2>
          <ul class="mt-2">
            {hits.map((hit, i) => (
              <li key={hit.id}>
                <ListRow
                  href={routeOf(hit.id, lang)}
                  title={(hit.entry.shortName ?? hit.entry.name)[lang]}
                  subtitle={hit.entry.description[lang]}
                  last={i === hits.length - 1}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      {query && hits && hits.length === 0 && (
        <EmptyState title={t(lang, 'search.noResultsFor', { query })} description={t(lang, 'search.noResultsHintShort')} />
      )}
    </div>
  )
}
