import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

/**
 * The system Reduce Motion setting, kept up to date while mounted. `null` until the
 * first read resolves, so callers can wait before starting an animation.
 */
export function useReduceMotion(): boolean | null {
  const [reduce, setReduce] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((value) => {
        if (!cancelled) setReduce(value)
      })
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce)
    return () => {
      cancelled = true
      sub.remove()
    }
  }, [])

  return reduce
}
