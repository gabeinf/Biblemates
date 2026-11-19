import * as Notifications from 'expo-notifications'

/** True when a local reminder can actually be delivered (permission already granted). */
export async function canRemind(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).status === 'granted'
  } catch {
    return false
  }
}

/** Schedules the "trial ends soon" notification. Best effort: never fails the purchase. */
export async function scheduleTrialReminder(date: Date) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your free trial ends soon',
        body: 'Billing starts in two days. Cancel in your store settings if it is not for you.',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    })
  } catch (e) {
    console.warn('trial reminder not scheduled', e)
  }
}
