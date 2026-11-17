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

for (const route of routes) {
  test(`${route.path} renders`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
    })

    await page.goto(route.path, { waitUntil: 'networkidle' })

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
