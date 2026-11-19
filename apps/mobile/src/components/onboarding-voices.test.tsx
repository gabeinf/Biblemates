// Screen test for 05 · Voices. Lives outside app/ so expo-router doesn't treat it as a route.
import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react-native'
import Voices from '../app/(auth)/onboarding/5'
import { SAMPLE_TESTIMONIALS, TESTIMONIALS } from '../lib/testimonials'

jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 5, goNext: jest.fn(), goBack: jest.fn() }),
}))

describe('05 · Voices', () => {
  it('says the testimonials are samples while they are', async () => {
    expect(SAMPLE_TESTIMONIALS).toBe(true)
    await render(<Voices />)
    expect(screen.getByText(/sample stories/i)).toBeTruthy()
  })

  it('shows every testimonial from the data file', async () => {
    await render(<Voices />)
    for (const t of TESTIMONIALS) expect(screen.getByText(t.title)).toBeTruthy()
  })
})
