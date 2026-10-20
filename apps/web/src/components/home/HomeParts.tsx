// Server-rendered Preact pieces of the home page. Children and icons have to be built here:
// JSX written in an .astro file is not a Preact vnode, so it cannot be passed as a component prop.
import { KVList, KVRow } from '@hisab/ui/base'
import { Bank, Calculator, Calendar, Guide, Land, Send, Wallet } from '@hisab/ui/icons'
import { SectionCard, ToolCard } from '@hisab/ui/nav'
import type { PopularTool, SectionIcon, TodayRow } from '../../lib/home'

const ICONS = { wallet: Wallet, bank: Bank, send: Send, calculator: Calculator, land: Land, guide: Guide, calendar: Calendar }

export function HomeSectionCard(props: { href: string; title: string; icon: SectionIcon; mobile: string; desktop: string }) {
  const Icon = ICONS[props.icon]
  const subtitle =
    props.mobile === props.desktop ? (
      props.mobile
    ) : (
      <>
        <span class="lg:hidden">{props.mobile}</span>
        <span class="hidden lg:inline">{props.desktop}</span>
      </>
    )
  return <SectionCard class="w-full" href={props.href} title={props.title} subtitle={subtitle} icon={<Icon size={22} />} />
}

export function HomeToolCard({ tool, href }: { tool: PopularTool; href: string }) {
  const Icon = ICONS[tool.icon]
  return (
    <ToolCard
      class="w-full"
      href={href}
      tag={tool.tag}
      title={tool.title}
      description={tool.description}
      example={tool.example}
      icon={<Icon size={22} />}
    />
  )
}

/** The আজকের খাতা rows; the first (Bangla date) is refreshed to today on the client. */
export function TodayRows({ rows }: { rows: TodayRow[] }) {
  return (
    <KVList class="mt-1 gap-1">
      {rows.map((row, i) => (
        <KVRow key={row.label} label={row.label} value={i === 0 ? <span data-bangla-date>{row.value}</span> : row.value} />
      ))}
    </KVList>
  )
}
