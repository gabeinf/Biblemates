import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { colors } from '../../../theme/tokens'
import { useTabBarHidden } from '../../../lib/tab-bar'

/**
 * System tab bar — floating Liquid Glass on iOS 26+, Material bottom nav on Android.
 * Visibility is driven by screens via `setTabBarHidden` (the Bible reader hides it while reading).
 */
export default function TabsLayout() {
  const hidden = useTabBarHidden()

  return (
    <NativeTabs tintColor={colors.Gold} hidden={hidden} minimizeBehavior="never">
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="bible">
        <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} md="menu_book" />
        <NativeTabs.Trigger.Label>Bible</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="study">
        <NativeTabs.Trigger.Icon sf={{ default: 'leaf', selected: 'leaf.fill' }} md="eco" />
        <NativeTabs.Trigger.Label>Study</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
