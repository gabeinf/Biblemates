import { jest } from '@jest/globals'

/** Fake of @rive-app/react-native: records each trigger's onTrigger so a test can fire it. */
export const triggers: Record<string, () => void> = {}

export function riveStub() {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Fit: { Cover: 'cover' },
    Alignment: { BottomCenter: 'bottomCenter' },
    RiveView: () => React.createElement(View, { testID: 'rive-view' }),
    useRiveFile: () => ({ riveFile: {}, isLoading: false, error: null }),
    useViewModelInstance: () => ({ instance: {}, isLoading: false, error: null }),
    useRiveTrigger: (name: string, _vmi: unknown, params?: { onTrigger?: () => void }) => {
      triggers[name] = params?.onTrigger ?? (() => undefined)
      return { trigger: jest.fn(), error: null }
    },
  }
}
