import type { ComponentChildren, HTMLAttributes } from 'preact'
import { cx } from '../lib/cx'
import type { NavLink } from './DesktopHeader'
import { Logo } from './Logo'

export interface FooterProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
  name?: string
  /** Makes the footer logo a link (usually home). */
  homeHref?: string
  description?: ComponentChildren
  links?: NavLink[]
  copyright?: ComponentChildren
  /** Accessible name of the links' <nav>. */
  linksLabel?: string
  /**
   * auto (default): stacked like the Mobile variant, side by side like the
   * Desktop variant once the footer itself is at least 56rem wide (container query).
   */
  layout?: 'auto' | 'mobile' | 'desktop'
  class?: string
}

export const DEFAULT_FOOTER_LINKS: NavLink[] = [
  { href: '/about/', label: 'আমাদের কথা' },
  { href: '/privacy/', label: 'প্রাইভেসি' },
  { href: '/contact/', label: 'যোগাযোগ' },
  { href: '/disclaimer/', label: 'দায় অস্বীকার' },
  { href: '/changelog/', label: 'পরিবর্তনের তালিকা' },
]

const DEFAULT_DESCRIPTION =
  'বাংলাদেশের টাকা-পয়সা আর সরকারি কাজের হিসাব, এক খাতায়। স্বাধীন গাইড, কোনো ব্যাংক বা সরকারি প্রতিষ্ঠানের সাথে যুক্ত নয়।'

/**
 * Site footer (Figma "Footer" 7:260, Mobile and Desktop variants): logo, a short
 * independence note, blue Body/Small links and a 12px copyright line.
 * Mobile: stacked, 24px sides. Desktop: brand | links | copyright on the 1080px column.
 */
export function Footer({
  name,
  homeHref,
  description = DEFAULT_DESCRIPTION,
  links = DEFAULT_FOOTER_LINKS,
  copyright = '© ২০২৬ হিসাব খাতা · তথ্য শুধু ধারণার জন্য',
  linksLabel = 'সাইটের তথ্য',
  layout = 'auto',
  class: className,
  ...rest
}: FooterProps) {
  const desk = layout === 'desktop'
  const auto = layout === 'auto'
  return (
    <footer class={cx('@container border-t border-line bg-sheet', className)} data-footer={layout} {...rest}>
      <div
        class={cx(
          desk ? 'px-4' : 'pr-[max(var(--space-6),env(safe-area-inset-right))] pl-[max(var(--space-6),env(safe-area-inset-left))]',
          auto && '@4xl:px-4',
        )}
      >
        <div
          class={cx(
            'mx-auto flex max-w-content flex-col items-start gap-4 py-7',
            auto && '@4xl:flex-row @4xl:gap-10',
            desk && 'flex-row gap-10',
          )}
        >
          <div class={cx('flex flex-col items-start gap-2.5', auto && '@4xl:min-w-0 @4xl:flex-1', desk && 'min-w-0 flex-1')}>
            {/* A linked logo is 44px tall; the negative margin keeps the 30px row of the design. */}
            <Logo name={name} href={homeHref} class={homeHref ? '-my-1.75' : undefined} />
            <p class="max-w-105 type-body-small text-soft">{description}</p>
          </div>
          <nav aria-label={linksLabel}>
            <ul class="flex flex-wrap gap-x-4 gap-y-2 type-body-small text-blue">
              {links.map((link, i) => (
                <li key={`${i}-${link.label}`}>
                  {/* Inline link in a list item: the ::before widens the hit area by 4px above and below. */}
                  <a
                    href={link.href}
                    aria-current={link.current ? 'page' : undefined}
                    class="link-underline whitespace-nowrap before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p class={cx('font-body text-[0.75rem] leading-5.5 text-soft', auto && '@4xl:whitespace-nowrap', desk && 'whitespace-nowrap')}>
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}
