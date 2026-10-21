import type { Lang } from '@hisab/i18n/locale'
import type { FaqEntry } from '@hisab/ui/content/jsonld'
import type { BreadcrumbItem } from '@hisab/ui/nav/Breadcrumb'
import type { DataStatus } from './verification.ts'

export type { Lang }

/** One numbered tip or step under the calculator ("চার্জ কমানোর ৪টা উপায়"). */
export interface ToolStep {
  title: string
  body?: string
}

/** A card in "আরও টুল", built from the registry entry's `related` list. */
export interface RelatedTool {
  id: string
  href: string
  /** The section it sits in, e.g. "মোবাইল ব্যাংকিং". */
  tag: string
  title: string
  description: string
}

/**
 * Everything the calculator page template shows around the calculator island. Built per tool by a
 * pure function (e.g. cashOutContent) so the website and the app render the same page.
 */
export interface ToolPageContent {
  lang: Lang
  /** Registry id, e.g. "cash-out". */
  id: string
  /** H1: the registry name. */
  title: string
  /** Line under the title: the registry description (the island may swap it per mode). */
  subtitle: string
  crumbs: BreadcrumbItem[]
  /** Verified line for data-backed tools; leave out for pure formula tools. */
  data?: DataStatus
  steps?: { title: string; items: ToolStep[] }
  faq?: { title: string; items: FaqEntry[] }
  related: RelatedTool[]
}
