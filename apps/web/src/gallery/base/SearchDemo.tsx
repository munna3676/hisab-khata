// Gallery island: Search Bar with onSearch instead of navigating.
import { SearchBar } from '@hisab/ui/base'
import { useState } from 'preact/hooks'

export default function SearchDemo({ size = 'large' }: { size?: 'large' | 'compact' }) {
  const [query, setQuery] = useState<string | null>(null)
  return (
    <div class="grid gap-2">
      <SearchBar size={size} onSearch={setQuery} class={size === 'compact' ? 'max-w-[280px]' : 'max-w-[342px]'} />
      <p class="type-body-small text-soft" aria-live="polite">
        {query === null ? 'Enter চাপো বা খোঁজো বাটন' : `খোঁজা হলো: “${query}”`}
      </p>
    </div>
  )
}
