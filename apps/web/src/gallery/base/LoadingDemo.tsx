// Gallery island: a primary button that goes into its loading state for 1.5 s on press.
import { Button, IconButton } from '@hisab/ui/base'
import { Bookmark, Download } from '@hisab/ui/icons'
import { useEffect, useState } from 'preact/hooks'

export default function LoadingDemo() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(t)
  }, [loading])
  return (
    <div class="flex flex-wrap items-center gap-3">
      <Button icon={<Download />} loading={loading} onClick={() => setLoading(true)}>
        {loading ? 'তৈরি হচ্ছে…' : 'PDF নামাও'}
      </Button>
      <IconButton label="সেভ করো" variant="secondary" pressed={saved} onClick={() => setSaved((s) => !s)}>
        <Bookmark />
      </IconButton>
    </div>
  )
}
