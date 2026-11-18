import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react-native'
import { TestimonialCard } from './onboarding-testimonial'
import { TESTIMONIALS } from '../lib/testimonials'

describe('TestimonialCard', () => {
  const t = TESTIMONIALS[0]

  it('reads as "title, quote" with the stars left out', async () => {
    await render(<TestimonialCard testimonial={t} />)
    const card = screen.getByLabelText(`${t.title}, ${t.quote}`)
    expect(card.props.accessible).toBe(true)
  })

  it('hides the decorative stars from screen readers', async () => {
    await render(<TestimonialCard testimonial={t} />)
    // Present, but excluded from the accessibility tree.
    expect(screen.getByTestId('stars', { includeHiddenElements: true })).toBeTruthy()
    expect(screen.queryByTestId('stars')).toBeNull()
  })
})

describe('testimonials data', () => {
  it('has unique ids, a 1–5 rating and a short quote for every entry', () => {
    expect(new Set(TESTIMONIALS.map((t) => t.id)).size).toBe(TESTIMONIALS.length)
    for (const t of TESTIMONIALS) {
      expect(t.rating).toBeGreaterThanOrEqual(1)
      expect(t.rating).toBeLessThanOrEqual(5)
      expect(t.title.length).toBeGreaterThan(0)
      // Fits the card's 2–4 lines.
      expect(t.quote.length).toBeLessThanOrEqual(180)
    }
  })

  it('makes no numeric claims (no user counts or percentages)', () => {
    for (const t of TESTIMONIALS) expect(`${t.title} ${t.quote}`).not.toMatch(/\d|%/)
  })
})
