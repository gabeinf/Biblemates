export type Verse = { verse: number; text: string };

/**
 * Splits a chapter into consecutive groups of 3–5 verses (~4 on average).
 * Chapters shorter than 3 verses become a single chunk.
 */
export function chunkVerses(verses: Verse[]): Verse[][] {
  const n = verses.length;
  if (n < 3) return [verses];
  const groups = Math.min(Math.max(Math.round(n / 4), Math.ceil(n / 5)), Math.floor(n / 3));
  const base = Math.floor(n / groups);
  const extra = n % groups; // the first `extra` groups get one more verse
  const out: Verse[][] = [];
  let i = 0;
  for (let g = 0; g < groups; g++) {
    const size = base + (g < extra ? 1 : 0);
    out.push(verses.slice(i, i + size));
    i += size;
  }
  return out;
}
