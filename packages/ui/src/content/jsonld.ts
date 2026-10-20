// JSON-LD for content components, so a page shell can put the same data the page shows
// into <script type="application/ld+json">. Plain text only: no markup in answers.

export interface FaqEntry {
  question: string
  /** Plain-text answer (also what JSON-LD carries). */
  answer: string
}

export interface FaqPageJsonLd {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: {
    '@type': 'Question'
    name: string
    acceptedAnswer: { '@type': 'Answer'; text: string }
  }[]
}

/** schema.org FAQPage for a list of questions and plain-text answers. */
export function faqJsonLd(items: readonly FaqEntry[]): FaqPageJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export interface HowToStepEntry {
  title: string
  description?: string
}

export interface HowToJsonLd {
  '@context': 'https://schema.org'
  '@type': 'HowTo'
  name: string
  step: { '@type': 'HowToStep'; position: number; name: string; text: string }[]
}

/** schema.org HowTo for a guide's steps (StepList). */
export function howToJsonLd(name: string, steps: readonly HowToStepEntry[]): HowToJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.description ?? s.title })),
  }
}

/**
 * Serialises JSON-LD for an inline <script type="application/ld+json">. Escapes "<" so
 * an answer containing "</script>" cannot end the script element early.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}
