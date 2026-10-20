import { collectionsFor, getPlatform } from '@hisab/platform/index'
import { Chip } from '@hisab/ui/base'
import { Star } from '@hisab/ui/icons'
import { useEffect, useState } from 'preact/hooks'

export interface YourToolsProps {
  title: string
  /** Pages that can appear in the row: registry id → name and route in this language. */
  pages: Record<string, { name: string; href: string }>
  /** Most chips shown. */
  limit?: number
}

/**
 * "তোমার টুল": starred pages, then recently opened ones, from the on-device store (@hisab/platform).
 * Renders nothing until the store answers and nothing when both lists are empty, so the home page
 * looks exactly like Figma for a first visit.
 */
export function YourTools({ title, pages, limit = 8 }: YourToolsProps) {
  const [items, setItems] = useState<{ id: string; starred: boolean }[]>([])

  useEffect(() => {
    const { favorites, recents } = collectionsFor(getPlatform().store)
    let alive = true
    const load = async () => {
      const [stars, recent] = await Promise.all([favorites.list(), recents.list()])
      const seen = new Set<string>()
      const next: { id: string; starred: boolean }[] = []
      for (const [ids, starred] of [
        [stars, true],
        [recent, false],
      ] as const) {
        for (const id of ids) {
          if (seen.has(id) || !pages[id]) continue
          seen.add(id)
          next.push({ id, starred })
        }
      }
      if (alive) setItems(next.slice(0, limit))
    }
    void load().catch(() => undefined)
    const offs = [favorites.subscribe(() => void load()), recents.subscribe(() => void load())]
    return () => {
      alive = false
      for (const off of offs) off()
    }
  }, [pages, limit])

  if (items.length === 0) return null
  return (
    <section aria-labelledby="your-tools-title" class="flex flex-col gap-2.5" data-your-tools>
      <h2 id="your-tools-title" class="type-label text-soft">
        {title}
      </h2>
      <ul class="-mx-1 flex flex-wrap gap-x-2 px-1">
        {items.map((item) => (
          <li key={item.id}>
            <Chip href={pages[item.id]!.href} numeric={false} icon={item.starred ? <Star size={16} class="text-accent" /> : undefined}>
              {pages[item.id]!.name}
            </Chip>
          </li>
        ))}
      </ul>
    </section>
  )
}
