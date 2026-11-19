// Screenshots every /onboarding/<n> route (found on disk) plus a "/" smoke route.
// Fails if a page throws, logs a console error, hits the not-found screen, or renders blank.
import { expect, test } from '@playwright/test'
import { readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const APP_DIR = join(__dirname, '..', 'apps', 'mobile', 'src', 'app')

/** Finds files like app/(auth)/onboarding/3.tsx and returns '/onboarding/3' (route groups stripped). */
function onboardingRoutes(): { path: string; name: string }[] {
  const found: { path: string; name: string; n: number }[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      const m = entry.name.match(/^(\d+)\.tsx$/)
      if (entry.isFile() && m && full.split(sep).at(-2) === 'onboarding') {
        const segments = relative(APP_DIR, full).split(sep).slice(0, -1)
        const urlDir = segments.filter((s) => !/^\(.*\)$/.test(s)).join('/')
        const n = Number(m[1])
        found.push({ path: `/${urlDir}/${n}`, name: `onboarding-${String(n).padStart(2, '0')}`, n })
      }
    }
  }
  walk(APP_DIR)
  return found.sort((a, b) => a.n - b.n)
}

const routes = [{ path: '/', name: 'smoke-root' }, ...onboardingRoutes()]

// Steps that move on by themselves after a moment. The page clock is frozen once they
// render so the screenshot shows the step itself, not wherever it went next.
const AUTO_ADVANCE = new Set(['/onboarding/1'])
// Long enough for the native-splash overlay to fade out (the verse is static: the config
// sets reducedMotion), and shorter than the step's own timer.
const AUTO_ADVANCE_SETTLE_MS = 1000

for (const route of routes) {
  test(`${route.path} renders`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
    })

    const visited: string[] = []
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) visited.push(new URL(frame.url()).pathname)
    })

    const autoAdvance = AUTO_ADVANCE.has(route.path)
    if (autoAdvance) await page.clock.install()

    await page.goto(route.path, { waitUntil: 'networkidle' })

    if (route.path === '/') {
      // A cold launch shows the splash first, which then sends a new user to the hook (02).
      await expect.poll(() => visited, { message: 'launch never showed the splash' }).toContain('/onboarding/1')
      await expect
        .poll(() => new URL(page.url()).pathname, { message: 'splash never moved on', timeout: 10_000 })
        .toBe('/onboarding/2')
    }

    if (autoAdvance) {
      await page.locator('#root').getByText(/\S/).first().waitFor()
      // pauseAt can't go backwards, so aim just past "now" (time still runs until it lands).
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 50))
      await page.clock.runFor(AUTO_ADVANCE_SETTLE_MS)
      expect(new URL(page.url()).pathname, `${route.path} advanced before the screenshot`).toBe(route.path)
    }

    // Wait for real content (fonts + auth gate resolve first), or bail early on an error.
    await expect
      .poll(
        async () => {
          if (errors.length) return 'error'
          const text = (await page.locator('#root').innerText()).trim()
          return text ? 'content' : 'blank'
        },
        { message: `${route.path} rendered blank`, timeout: 15_000 },
      )
      .not.toBe('blank')
    expect(errors, `errors on ${route.path}`).toEqual([])

    await expect(page.getByText(/unmatched route|this screen doesn't exist/i)).toHaveCount(0)

    // JS-driven animations (splash fade, Reanimated entering) ignore CSS animation
    // settings, so wait until two consecutive frames are identical.
    let previous = Buffer.alloc(0)
    await expect
      .poll(
        async () => {
          await page.waitForTimeout(250)
          const frame = await page.screenshot({ animations: 'disabled' })
          const stable = frame.equals(previous)
          previous = frame
          return stable
        },
        { message: `${route.path} never stopped animating`, timeout: 10_000 },
      )
      .toBe(true)

    await page.screenshot({
      path: `artifacts/screenshots/${route.name}.png`,
      animations: 'disabled',
    })

    expect(errors, `errors on ${route.path}`).toEqual([])
  })
}

// Spec 08: "Fits on a 667pt-tall screen without overlapping the button." The body
// scrolls, so the button can't be covered; this checks it doesn't need to scroll at all.
test('/onboarding/8 fits a 375×667 screen without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/onboarding/8', { waitUntil: 'networkidle' })
  await page.getByText('Watch each other show up').waitFor()
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll('div')]
      .filter(
        (d) => ['auto', 'scroll'].includes(getComputedStyle(d).overflowY) && d.clientHeight > 100,
      )
      .map((d) => d.scrollHeight - d.clientHeight),
  )
  expect(overflow.length, 'no scroll container found').toBeGreaterThan(0)
  expect(Math.max(...overflow), 'content overflows by this many px').toBeLessThanOrEqual(0)
})
