/** `alpha('#201F1D', 0.5)` → rgba string. Only hex input; lives in theme/ so screens never write rgba(). */
export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1, 7), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
