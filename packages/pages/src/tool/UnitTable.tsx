// "সব এককে" (Figma L1 31:8623, L3 31:9006): the same quantity in every unit, as a two-column
// table under a heading, with the unit the person typed in (or the result unit) tinted.
import { cx } from '@hisab/ui/lib/cx'

export interface UnitRow {
  key: string
  label: string
  value: string
  /** Tinted row (Figma: the input unit in L1, the result unit in L3). */
  current?: boolean
}

export function UnitTable({ title, unitLabel, valueLabel, rows }: { title: string; unitLabel: string; valueLabel: string; rows: readonly UnitRow[] }) {
  return (
    <section aria-labelledby="unit-table-title" class="flex flex-col gap-2.5" data-unit-table>
      <h2 id="unit-table-title" class="type-h3 text-ink">
        {title}
      </h2>
      <div class="min-w-0 overflow-hidden rounded-card border border-line bg-sheet">
        <table class="w-full border-separate border-spacing-0" aria-labelledby="unit-table-title">
          <thead>
            <tr class="bg-subtle">
              <th scope="col" class="border-b border-line py-3 pr-3 pl-4 text-start font-body text-[0.75rem]/4 font-semibold text-soft">
                {unitLabel}
              </th>
              <th scope="col" class="border-b border-line py-3 pr-4 pl-3 text-end font-body text-[0.75rem]/4 font-semibold text-soft">
                {valueLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const line = i < rows.length - 1 ? 'border-b border-line' : ''
              return (
                <tr key={row.key} class={cx(row.current && 'bg-accent-tint')} aria-current={row.current ? 'true' : undefined} data-unit-row={row.key}>
                  <th scope="row" class={cx(line, 'py-3.5 pr-3 pl-4 text-start type-body font-normal text-ink')}>
                    {row.label}
                  </th>
                  <td class={cx(line, 'hkc-num py-3.5 pr-4 pl-3 text-end text-number-m text-ink')}>{row.value}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
