import * as Haptics from 'expo-haptics'

const quiet = () => undefined
/** One haptic per event. Never throws (web, simulators and Jest have no engine). */
export const haptic = {
  tap: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(quiet)
    } catch {}
  },
  success: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(quiet)
    } catch {}
  },
}
