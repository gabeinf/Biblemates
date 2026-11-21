// `pnpm style`: no hex colors, rgb()/rgba() strings or fontFamily string literals outside apps/mobile/src/theme/.
// Colors and fonts come from `useTheme()` / theme tokens. Zero deps; fails with file:line for every hit.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

const SRC = 'apps/mobile/src'
const RULES = [
  [/['"`]#[0-9a-fA-F]{3,8}['"`]/, 'hex color'],
  [/\brgba?\(/, 'rgb()/rgba()'],
  [/fontFamily:\s*['"`]/, 'fontFamily string'],
]

export function violations(file, text) {
  return text.split('\n').flatMap((line, i) =>
    RULES.filter(([re]) => re.test(line)).map(([, what]) => `${file}:${i + 1}: ${what} outside theme/ | fix: use useTheme() or a theme token`),
  )
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = walk(SRC).filter(
    (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !relative(SRC, f).startsWith('theme/'),
  )
  const found = files.flatMap((f) => violations(f, readFileSync(f, 'utf8')))
  if (found.length) {
    console.error(found.join('\n'))
    process.exit(1)
  }
  console.log(`style: ${files.length} files clean`)
}
