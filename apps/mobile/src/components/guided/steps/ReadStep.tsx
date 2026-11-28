import { useEffect } from 'react'
import { AppText } from '../../ui'
import type { StepProps } from './types'

/** Stub: its own PR fills this in. Unlocks Continue straight away. */
export function ReadStep({ onReady }: StepProps) {
  useEffect(() => {
    onReady(true)
  }, [onReady])
  return <AppText variant="body">Read</AppText>
}
