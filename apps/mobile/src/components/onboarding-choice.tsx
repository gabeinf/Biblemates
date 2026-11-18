/**
 * A single-select row for onboarding questions: icon, label, and a radio on the right
 * that becomes a filled check when selected.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors, radii, spacing, typography } from '../theme/tokens'

type IconName = keyof typeof Ionicons.glyphMap

export function ChoiceRow({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string
  icon: IconName
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && !selected && styles.rowPressed,
      ]}
    >
      <Ionicons name={icon} size={ICON} color={selected ? colors.Gold : colors.muted} />
      <Text style={styles.label}>{label}</Text>
      {selected ? (
        <View style={[styles.radio, styles.radioSelected]}>
          <Ionicons name="checkmark" size={CHECK} color={colors.surface} />
        </View>
      ) : (
        <View style={styles.radio} />
      )}
    </Pressable>
  )
}

// Sizes for this row only. 56pt rows clear the 44pt minimum hit area.
const ROW_MIN_HEIGHT = 56
const ICON = 22
const RADIO = 24
const CHECK = 16
const STRONG_BORDER = 1.5

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: ROW_MIN_HEIGHT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowSelected: {
    borderColor: colors.Gold,
    borderWidth: STRONG_BORDER,
    backgroundColor: colors.goldSoft,
  },
  rowPressed: { backgroundColor: colors.Mat },
  label: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Ink,
  },
  radio: {
    width: RADIO,
    height: RADIO,
    borderRadius: radii.full,
    borderWidth: STRONG_BORDER,
    borderColor: colors.inactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.Gold, backgroundColor: colors.Gold },
})
