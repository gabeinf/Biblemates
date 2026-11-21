// `pnpm contrast`: fails if any text/background role pair misses WCAG AA in ANY palette.
import { allContrastFailures } from '../apps/mobile/src/theme/contrast'

const failures = allContrastFailures()
if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('contrast: all palettes pass')
