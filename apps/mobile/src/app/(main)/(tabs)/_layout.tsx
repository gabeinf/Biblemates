import { Tabs } from 'expo-router/js-tabs'
import { AppTabBar } from '../../../components/ui/AppTabBar'

/** Custom JS tab bar (opaque, no Liquid Glass). Visibility is driven by `setTabBarHidden` (the Bible reader hides it). */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <AppTabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="pasture" />
      <Tabs.Screen name="today" />
      <Tabs.Screen name="study" />
      {/* Redirect only; never shown in the bar (AppTabBar renders a fixed list). */}
      <Tabs.Screen name="home" options={{ href: null }} />
    </Tabs>
  )
}

export const unstable_settings = { initialRouteName: 'today' }
