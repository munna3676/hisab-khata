// "সব উপায়, সস্তা থেকে দামি" (Figma C1 Compare Rows). Its own module, so only the comparison pages
// (Cash Out) load CompareRow; it is not in the template chunk every calculator page loads.
import { CompareRow, type CompareRowProps } from '@hisab/ui/base/CompareRow'

/** "সব উপায়, সস্তা থেকে দামি" heading with its column label, then Compare Rows. */
export function CompareList({
  title,
  column,
  rows,
}: {
  title: string
  column: string
  rows: (CompareRowProps & { key: string })[]
}) {
  return (
    <section aria-labelledby="compare-title" class="flex flex-col gap-2.5" data-compare>
      <div class="flex items-baseline justify-between gap-3">
        <h2 id="compare-title" class="type-h3 text-ink">
          {title}
        </h2>
        <span class="shrink-0 type-label text-soft" aria-hidden="true">
          {column}
        </span>
      </div>
      <ol class="flex flex-col gap-2" role="list">
        {rows.map(({ key, ...row }) => (
          <li key={key} data-compare-row={key}>
            <CompareRow {...row} />
          </li>
        ))}
      </ol>
    </section>
  )
}
