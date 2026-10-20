import { describe, expect, it } from 'vitest'
import { faqJsonLd, howToJsonLd, jsonLdScript } from './jsonld'

describe('faqJsonLd', () => {
  it('builds a schema.org FAQPage', () => {
    expect(faqJsonLd([{ question: 'প্রশ্ন?', answer: 'উত্তর।' }])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: 'প্রশ্ন?', acceptedAnswer: { '@type': 'Answer', text: 'উত্তর।' } }],
    })
  })
})

describe('howToJsonLd', () => {
  it('numbers steps from 1 and falls back to the title for text', () => {
    const data = howToJsonLd('NID সংশোধন', [{ title: 'লগইন', description: 'OTP দিয়ে' }, { title: 'ফি দাও' }])
    expect(data['@type']).toBe('HowTo')
    expect(data.name).toBe('NID সংশোধন')
    expect(data.step).toEqual([
      { '@type': 'HowToStep', position: 1, name: 'লগইন', text: 'OTP দিয়ে' },
      { '@type': 'HowToStep', position: 2, name: 'ফি দাও', text: 'ফি দাও' },
    ])
  })
})

describe('jsonLdScript', () => {
  const tricky = 'a </script><script>alert(1)</script> <!-- b\u2028c\u2029d'

  it('cannot end the script element early or open an HTML comment', () => {
    const out = jsonLdScript(faqJsonLd([{ question: 'q', answer: tricky }]))
    expect(out).not.toContain('<')
    expect(out.toLowerCase()).not.toContain('</script')
    expect(out).toContain('\\u003c/script>')
  })

  it('escapes U+2028 and U+2029 so the output is also a valid JS string', () => {
    const out = jsonLdScript({ text: tricky })
    expect(out).not.toContain('\u2028')
    expect(out).not.toContain('\u2029')
    expect(out).toContain('\\u2028')
    expect(out).toContain('\\u2029')
  })

  it('round-trips to the same data', () => {
    const data = faqJsonLd([{ question: '<b>বিকাশ</b>?', answer: tricky }])
    expect(JSON.parse(jsonLdScript(data))).toEqual(data)
  })

  it('keeps Bangla text as is', () => {
    expect(jsonLdScript({ t: 'টাকা ৳১০০' })).toBe('{"t":"টাকা ৳১০০"}')
  })
})
