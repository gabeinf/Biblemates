import { Pressable, StyleSheet, View } from 'react-native'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import Ionicons from '@expo/vector-icons/Ionicons'
import { control, radius, space, useTheme } from '../../theme'
import { useTabBarHidden } from '../../lib/tab-bar'
import { AppText } from './AppText'
import { haptic } from './haptics'

type Icon = React.ComponentProps<typeof Ionicons>['name']
const ITEMS: { name: string; label: string; icon: Icon; active: Icon }[] = [
  { name: 'bible', label: 'Bible', icon: 'book-outline', active: 'book' },
  { name: 'pasture', label: 'Pasture', icon: 'leaf-outline', active: 'leaf' },
  { name: 'today', label: 'Today', icon: 'sunny-outline', active: 'sunny' },
  { name: 'study', label: 'Study', icon: 'library-outline', active: 'library' },
  { name: 'circle', label: 'Circle', icon: 'people-outline', active: 'people' },
]
const DT_CAP = 1.2
const RING = 52

/**
 * Opaque 5-tab bar. Today (center) is raised and wears a progress ring.
 * `todayProgress` is 0..1 (tasks done / tasks). shortcut: the ring fills in quarters (border sides, no SVG dependency), upgrade to an arc when react-native-svg lands.
 */
export function AppTabBar({ state, emitter, navigateToTab, insets, todayProgress = 0 }: BottomTabBarProps & { todayProgress?: number }) {
  const theme = useTheme()
  const hidden = useTabBarHidden()
  if (hidden) return null
  const current = state.routes[state.index]?.name
  const quarters = Math.round(Math.min(Math.max(todayProgress, 0), 1) * 4)
  const done = quarters === 4

  return (
    <View
      accessibilityRole="tabbar"
      style={[styles.bar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, space.xs) }]}
    >
      {ITEMS.map(({ name, label, icon, active }) => {
        const route = state.routes.find((r) => r.name === name)
        if (!route) return null
        const selected = current === name
        const raised = name === 'today'
        const tint = selected ? theme.primary : theme.textSecondary
        const press = () => {
          const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!selected && !e.defaultPrevented) {
            haptic.tap()
            navigateToTab(route.key)
          }
        }
        const glyph = <Ionicons name={selected ? active : icon} size={raised ? 26 : 24} color={tint} />
        return (
          <Pressable
            key={name}
            onPress={press}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            style={styles.item}
          >
            {raised ? (
              <View
                testID="today-ring"
                accessibilityValue={{ min: 0, max: 4, now: quarters }}
                style={[
                  styles.ring,
                  {
                    backgroundColor: selected ? theme.primaryTint : theme.surface,
                    borderColor: theme.border,
                    ...(done
                      ? { borderColor: theme.success }
                      : quarters > 0 && {
                          borderTopColor: theme.progress,
                          borderRightColor: quarters > 1 ? theme.progress : theme.border,
                          borderBottomColor: quarters > 2 ? theme.progress : theme.border,
                        }),
                  },
                ]}
              >
                <View style={styles.center}>{done ? <Ionicons name="checkmark" size={26} color={theme.success} /> : glyph}</View>
              </View>
            ) : (
              <View style={[styles.pill, selected && { backgroundColor: theme.primaryTint }]}>{glyph}</View>
            )}
            <AppText variant="tab" style={{ color: tint }} maxFontSizeMultiplier={DT_CAP}>
              {label}
            </AppText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1, paddingTop: space.xs },
  item: { flex: 1, alignItems: 'center', gap: space.xxs, minHeight: control.minTouch },
  pill: { width: 56, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  // -space.md lifts the center item above the bar's top edge.
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 4,
    marginTop: -space.md,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  center: { transform: [{ rotate: '45deg' }] },
})
