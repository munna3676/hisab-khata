/** Figma "split bar": principal and interest as one bar with a legend (■ মূল টাকা ৮৪% ■ সুদ ১৬%). */
export function SplitBar({ principalPct, principalLabel, interestLabel, label }: { principalPct: number; principalLabel: string; interestLabel: string; label: string }) {
  return (
    <figure class="flex flex-col gap-2" data-split-bar>
      <div class="flex h-3 overflow-hidden rounded-full bg-accent" role="img" aria-label={`${label}: ${principalLabel}, ${interestLabel}`}>
        <span class="h-full bg-blue" style={{ width: `${principalPct}%` }} />
      </div>
      <figcaption class="flex flex-wrap gap-x-4 gap-y-1 type-body-small text-soft" aria-hidden="true">
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2.5 bg-blue" />
          {principalLabel}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2.5 bg-accent" />
          {interestLabel}
        </span>
      </figcaption>
    </figure>
  )
}
