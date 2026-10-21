import type { CompareTableRow } from './model.ts'

/**
 * Figma F10 "table block" (পাশাপাশি): one row per figure, one column per offer, the lower value
 * of each row on a green cell. A real table, so screen readers read row and column headers.
 */
export function OfferTable({ title, offerNames, rows, lowestLabel }: { title: string; offerNames: string[]; rows: CompareTableRow[]; lowestLabel: string }) {
  return (
    <section aria-labelledby="offer-table-title" class="flex flex-col gap-2.5" data-offer-table>
      <h2 id="offer-table-title" class="type-h3 text-ink">
        {title}
      </h2>
      <div class="overflow-hidden rounded-card border border-line bg-sheet">
        <table class="w-full border-separate border-spacing-0" aria-labelledby="offer-table-title">
          <thead>
            <tr class="bg-subtle">
              <th scope="col" class="w-[38%] border-b border-line px-3 py-2.5 text-start">
                <span class="sr-only">{title}</span>
              </th>
              {offerNames.map((name) => (
                <th key={name} scope="col" class="border-b border-line px-3 py-2.5 text-end type-label text-ink">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row.key} data-offer-row={row.key}>
                <th scope="row" class={`px-3 py-2.5 text-start font-body text-[0.8125rem] font-normal text-soft ${r < rows.length - 1 ? 'border-b border-rule' : ''}`}>
                  {row.label}
                </th>
                {row.values.map((value, i) => (
                  <td
                    key={i}
                    class={`px-3 py-2.5 text-end hk-num text-number-m whitespace-nowrap ${r < rows.length - 1 ? 'border-b border-rule' : ''} ${
                      row.lowest === i ? 'bg-good-bg font-bold text-good' : 'text-ink'
                    }`}
                    data-lowest={row.lowest === i ? '' : undefined}
                  >
                    {value}
                    {row.lowest === i && <span class="sr-only"> ({lowestLabel})</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
