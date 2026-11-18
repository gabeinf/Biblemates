/**
 * Testimonials for 05 · Voices. See docs/specs/onboarding.md → "05 · Voices".
 *
 * PLACEHOLDER(testimonials): every entry below is a written sample, not a real person
 * or review, and the screen says so. Replace them with real quotes only once each
 * author has consented (spec open question 3), then drop `SAMPLE_TESTIMONIALS`.
 */

export type Testimonial = {
  id: string
  /** Shown as the avatar initial only. */
  name: string
  title: string
  quote: string
  /** 1–5. Decorative: hidden from screen readers. */
  rating: number
}

/** True while the list below is samples. The screen shows a note when it is. */
export const SAMPLE_TESTIMONIALS = true

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    id: 'sample-1',
    name: 'Grace',
    title: 'We stopped drifting',
    quote:
      'My sister and I kept quitting plans by February. Seeing each other check in each morning is what kept us going.',
    rating: 5,
  },
  {
    id: 'sample-2',
    name: 'Daniel',
    title: 'Small and steady',
    quote:
      'Three days a week felt doable. A few months in, it has turned into the calmest part of my week.',
    rating: 5,
  },
  {
    id: 'sample-3',
    name: 'Ruth',
    title: 'Our small group, between Sundays',
    quote:
      'We used to only open our Bibles together on Sunday. Now we share what stood out midweek, and our conversations go deeper.',
    rating: 5,
  },
  {
    id: 'sample-4',
    name: 'Marcus',
    title: 'Accountability that feels kind',
    quote:
      'Nobody nags. You just see that your friend read today, and you want to show up for them too.',
    rating: 5,
  },
  {
    id: 'sample-5',
    name: 'Leah',
    title: 'Reading with my husband',
    quote:
      'We read the same passage on different schedules and talk about it over dinner. It has given us something to share every day.',
    rating: 5,
  },
]
