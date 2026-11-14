/**
 * Renders an answer the way it streams in, like ChatGPT/Claude:
 *  - characters are revealed at a steady pace, independent of how bursty the
 *    network is (it speeds up a little when a backlog builds);
 *  - every character fades from light to full ink over FADE_MS after it appears.
 * Citation markers ([[PHP 4:6-7]]) render as tappable references.
 */
import { useEffect, useReducer, useRef } from 'react'
import { StyleSheet, Text, type TextStyle } from 'react-native'
import { formatPassage, splitCitations } from '@biblemates/shared'
import { colors } from '../../theme/tokens'

const FADE_MS = 420
/** Minimum characters revealed per frame (~60fps → ~100 chars/sec). */
const MIN_PER_FRAME = 1.7
/** Frames to work off a backlog, so bursts are spread out rather than dumped. */
const CATCH_UP_FRAMES = 20
/** Opacity buckets: neighbouring characters with similar opacity share a span. */
const BUCKETS = 8
const START_ALPHA = 0.08

const ink = (a: number) => `rgba(32,31,29,${a.toFixed(2)})`

type Target = { bookId: string; chapter: number; verseStart: number }

const refLabel = (bookId: string, chapter: number, vs: number, ve: number) => {
  try {
    return formatPassage(bookId, chapter, vs, ve)
  } catch {
    return `${bookId} ${chapter}:${vs}`
  }
}

export default function StreamingText({
  text,
  animate,
  style,
  onOpenPassage,
}: {
  text: string
  /** Reveal progressively (live answers). History renders instantly. */
  animate: boolean
  style?: TextStyle
  onOpenPassage: (p: Target) => void
}) {
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  const shown = useRef(animate ? 0 : text.length)
  const revealedAt = useRef<number[]>([]) // timestamp each character index appeared
  const target = useRef(text.length)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    target.current = text.length
    if (!animate) {
      shown.current = text.length
      revealedAt.current = []
      rerender()
      return
    }
    // The final text can be shorter than what streamed (e.g. a dropped citation).
    if (shown.current > text.length) {
      shown.current = text.length
      revealedAt.current.length = text.length
    }
    if (frame.current != null) return
    const tick = () => {
      const now = Date.now()
      const backlog = target.current - shown.current
      if (backlog > 0) {
        const before = Math.floor(shown.current)
        shown.current = Math.min(target.current, shown.current + Math.max(MIN_PER_FRAME, backlog / CATCH_UP_FRAMES))
        for (let i = before; i < Math.floor(shown.current); i++) revealedAt.current[i] = now
      }
      rerender()
      const last = revealedAt.current[revealedAt.current.length - 1] ?? 0
      const stillFading = now - last < FADE_MS
      frame.current = backlog > 0 || stillFading ? requestAnimationFrame(tick) : null
    }
    frame.current = requestAnimationFrame(tick)
  }, [text, animate])

  useEffect(
    () => () => {
      if (frame.current != null) cancelAnimationFrame(frame.current)
    },
    [],
  )

  const count = Math.floor(shown.current)
  const visible = text.slice(0, count)
  const parts = splitCitations(visible)
  const last = parts[parts.length - 1]
  const now = Date.now()

  // Index (in `visible`) of the first character still fading.
  let fadeFrom = count
  if (animate) {
    while (fadeFrom > 0 && now - (revealedAt.current[fadeFrom - 1] ?? 0) < FADE_MS) fadeFrom--
  }
  // Only the final plain-text part can be mid-fade (markers appear whole).
  const tailStart = last?.type === 'text' ? visible.length - last.text.length : visible.length

  return (
    <Text style={style}>
      {parts.map((p, i) => {
        if (p.type === 'cite') {
          return (
            <Text
              key={i}
              style={styles.ref}
              onPress={() => onOpenPassage({ bookId: p.bookId, chapter: p.chapter, verseStart: p.verseStart })}
            >
              {refLabel(p.bookId, p.chapter, p.verseStart, p.verseEnd)}
            </Text>
          )
        }
        if (i !== parts.length - 1 || fadeFrom >= count) return <Text key={i}>{p.text}</Text>

        // Split the tail into spans by opacity bucket.
        const from = Math.max(fadeFrom, tailStart)
        const spans: { t: string; a: number }[] = []
        for (let c = from; c < count; c++) {
          const age = now - (revealedAt.current[c] ?? 0)
          const a = START_ALPHA + (1 - START_ALPHA) * Math.min(1, age / FADE_MS)
          const bucket = Math.round(a * BUCKETS) / BUCKETS
          const prev = spans[spans.length - 1]
          if (prev && prev.a === bucket) prev.t += visible[c]
          else spans.push({ t: visible[c], a: bucket })
        }
        return (
          <Text key={i}>
            {visible.slice(tailStart, from)}
            {spans.map((s, j) => (
              <Text key={j} style={s.a >= 1 ? undefined : { color: ink(s.a) }}>
                {s.t}
              </Text>
            ))}
          </Text>
        )
      })}
    </Text>
  )
}

const styles = StyleSheet.create({
  ref: { color: colors.Gold, textDecorationLine: 'underline' },
})
