import { jest } from '@jest/globals'

/** Fake of @rive-app/react-native: records each trigger's onTrigger so a test can fire it. */
export const triggers: Record<string, () => void> = {}

/** Set `failure.error` to make the fake file fail to load. */
export const failure: { error: Error | null } = { error: null }

export function riveStub() {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Fit: { Cover: 'cover' },
    Alignment: { BottomCenter: 'bottomCenter' },
    RiveView: () => React.createElement(View, { testID: 'rive-view' }),
    useRiveFile: () => ({
      riveFile: failure.error ? null : {},
      isLoading: false,
      error: failure.error,
    }),
    useViewModelInstance: () => ({ instance: {}, isLoading: false, error: null }),
    useRiveTrigger: (name: string, _vmi: unknown, params?: { onTrigger?: () => void }) => {
      triggers[name] = params?.onTrigger ?? (() => undefined)
      return { trigger: jest.fn(), error: null }
    },
  }
}
