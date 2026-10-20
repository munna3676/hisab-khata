import { t } from '@hisab/i18n/messages'
import { Badge, VerifiedLine } from '@hisab/ui/base'
import { Breadcrumb } from '@hisab/ui/nav'
import type { ToolPageContent } from './types.ts'

/**
 * Page head of a calculator (Figma 13:431 "page head", D2 19:393): breadcrumb, H1, the subtitle
 * and the data line. While the tool's Facts are unverified the line reads "যাচাই বাকি" with a
 * short note instead of the green Verified Line (the same honest state as the home page).
 * The subtitle carries data-tool-subtitle so a mode switch can swap its text (useSubtitle).
 */
export function ToolHeader({ content }: { content: ToolPageContent }) {
  const { lang, data } = content
  return (
    <header class="min-w-0" data-tool-header>
      <Breadcrumb items={content.crumbs} label={t(lang, 'nav.breadcrumb')} />
      <h1 class="mt-2 type-h1 text-ink lg:type-display-desktop-h1">{content.title}</h1>
      <p class="mt-2 type-body text-soft lg:mt-3" data-tool-subtitle>
        {content.subtitle}
      </p>
      {data &&
        (data.verified ? (
          <VerifiedLine
            class="mt-2"
            lang={lang}
            checked={data.checked}
            source={data.source}
            sourceLabel={t(lang, 'verified.officialSource')}
            sourcePrefix={false}
          />
        ) : (
          <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1" data-unverified>
            <Badge tone="warn">{t(lang, 'verified.pending')}</Badge>
            <p class="min-w-0 flex-1 basis-60 font-body text-[0.8125rem]/[1.375rem] text-soft">
              {t(lang, 'verified.pendingNote')}{' '}
              <a href={data.source} class="underline decoration-1 underline-offset-2" target="_blank" rel="noopener noreferrer">
                {t(lang, 'verified.officialSource')}
                <span class="sr-only"> {t(lang, 'verified.newTab')}</span>
              </a>
            </p>
          </div>
        ))}
    </header>
  )
}
