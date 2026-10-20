import { toBanglaDigits } from '@hisab/core/lib/digits'
import type { ComponentChildren } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { Badge } from '../base/Badge'
import { cx } from '../lib/cx'
import { ChecklistItem } from './ChecklistItem'
import { useContentUid } from './uid'

export interface ChecklistEntry {
  /** Stable id, used for the saved progress and as the checkbox value. */
  id: string
  label: ComponentChildren
}

export interface ChecklistProps {
  /** Section heading, e.g. "কাগজপত্র". */
  title?: ComponentChildren
  /** Heading level (default h2, as on the guide page). */
  titleAs?: 'h2' | 'h3' | 'h4'
  items: readonly ChecklistEntry[]
  /** Controlled list of ticked ids. */
  checked?: readonly string[]
  /** Ticked ids on first render (uncontrolled). */
  defaultChecked?: readonly string[]
  onChange?: (checked: string[]) => void
  /**
   * Saves progress on this device under this key (localStorage on the web; the app's
   * store adapter later). The server renders `defaultChecked`; saved ticks load after hydration.
   */
  storageKey?: string
  /** Progress badge text; default "২/৫ রেডি". Return null to hide the badge. */
  progressLabel?: ((done: number, total: number) => string) | null
  /** Small print under the list, e.g. "টিক দিলে তোমার ফোনেই সেভ থাকে, প্রিন্ট বা PDF করা যায়।" */
  hint?: ComponentChildren
  /** Checkbox form name (values are the item ids). */
  name?: string
  class?: string
}

export const defaultProgressLabel = (done: number, total: number) => `${toBanglaDigits(done)}/${toBanglaDigits(total)} রেডি`

function load(key: string): string[] | null {
  try {
    const raw = window.localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : null
  } catch {
    return null
  }
}

function save(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    /* private mode or storage full: progress lasts for this visit only */
  }
}

/**
 * A guide's documents checklist (Figma Guide 17:1577): heading with a "২/৫ রেডি" badge
 * that updates politely for screen readers, Checklist Items, and a hint. Progress can be
 * saved on the device with `storageKey`.
 */
export function Checklist({
  title,
  titleAs: Title = 'h2',
  items,
  checked,
  defaultChecked = [],
  onChange,
  storageKey,
  progressLabel = defaultProgressLabel,
  hint,
  name,
  class: className,
}: ChecklistProps) {
  const titleId = useContentUid(undefined, 'hkc-list')
  const [inner, setInner] = useState<string[]>(() => [...defaultChecked])
  const current = checked ? [...checked] : inner

  useEffect(() => {
    if (!storageKey || checked) return
    const saved = load(storageKey)
    if (saved) setInner(saved.filter((id) => items.some((item) => item.id === id)))
  }, [storageKey])

  const toggle = (id: string, on: boolean) => {
    const next = on ? [...current.filter((v) => v !== id), id] : current.filter((v) => v !== id)
    const ordered = items.map((item) => item.id).filter((v) => next.includes(v))
    if (!checked) setInner(ordered)
    if (storageKey) save(storageKey, ordered)
    onChange?.(ordered)
  }

  const done = items.filter((item) => current.includes(item.id)).length

  return (
    <div class={cx('min-w-0', className)} data-checklist>
      {(title || progressLabel) && (
        <div class="mb-1 flex min-w-0 items-center justify-between gap-3">
          {title && (
            <Title id={titleId} class="type-h2 text-ink">
              {title}
            </Title>
          )}
          {progressLabel && (
            <Badge tone="good" aria-live="polite" aria-atomic="true">
              {progressLabel(done, items.length)}
            </Badge>
          )}
        </div>
      )}
      <ul role="list" aria-labelledby={title ? titleId : undefined} class="m-0 list-none p-0">
        {items.map((item, i) => (
          <li key={item.id}>
            <ChecklistItem
              label={item.label}
              name={name}
              value={item.id}
              checked={current.includes(item.id)}
              onChange={(on) => toggle(item.id, on)}
            />
          </li>
        ))}
      </ul>
      {/* Figma Guide 17:1577: the hint sits right under the last row's rule. */}
      {hint && <p class="type-body-small text-soft">{hint}</p>}
    </div>
  )
}
