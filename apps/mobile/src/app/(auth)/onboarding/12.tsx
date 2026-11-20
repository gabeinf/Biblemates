/**
 * 12 · Stakes picker. Choose what you'll owe your circle after a missed week.
 * See docs/specs/onboarding.md → "12 · Stakes picker".
 */
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Button } from '../../../components/ui'
import { FadeIn, TextField } from '../../../components/onboarding'
import { KeyboardScreen } from '../../../components/KeyboardScreen'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { getDraft, updateDraft } from '../../../lib/onboarding-draft'
import {
  STAKES_MAX,
  STAKES_PRESETS,
  stakesFromLabel,
  stakesLabelError,
  type Stakes,
} from '../../../lib/stakes'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

type TileProps = {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  selected: boolean
  onPress: () => void
  onEdit: () => void
}

function Tile({ label, icon, selected, onPress, onEdit }: TileProps) {
  return (
    <View style={styles.tileWrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        style={({ pressed }) => [
          styles.tile,
          selected && styles.tileSelected,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name={icon} size={28} color={selected ? colors.Gold : colors.Ink} />
        <Text style={styles.tileLabel}>{label}</Text>
        {selected ? (
          <View testID="stakes-check" style={styles.check}>
            <Ionicons name="checkmark" size={16} color={colors.surface} />
          </View>
        ) : null}
      </Pressable>
      {selected ? (
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Edit “${label}”`}
          style={styles.pencil}
        >
          <Ionicons name="pencil" size={16} color={colors.Ink} />
        </Pressable>
      ) : null}
    </View>
  )
}

export default function StakesPicker() {
  const { goNext } = useOnboardingNav()
  const [stakes, setStakes] = useState<Stakes | undefined>(() => getDraft().stakes)
  // The last custom value, kept even after picking a preset so it can be picked again.
  const [custom, setCustom] = useState<string | null>(() => {
    const saved = getDraft().stakes
    return saved?.kind === 'custom' ? saved.label : null
  })
  // The inline editor: null when closed, otherwise the text being typed.
  const [draftLabel, setDraftLabel] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const choose = (next: Stakes) => {
    setStakes(next)
    if (next.kind === 'custom') setCustom(next.label)
    updateDraft({ stakes: next })
    setDraftLabel(null)
  }

  const openEditor = (initial: string) => {
    setDraftLabel(initial)
    setTouched(false)
  }

  const saveEditor = () => {
    const next = draftLabel === null ? null : stakesFromLabel(draftLabel)
    if (!next) return setTouched(true)
    choose(next)
  }

  const editing = draftLabel !== null
  const labelError = editing ? stakesLabelError(draftLabel) : null
  // Too long shows right away; empty waits until they've left the field or tried to save.
  const tooLong = editing && draftLabel.trim().length > STAKES_MAX
  const shownError = tooLong || touched ? labelError : null

  // While the editor is open nothing is selected; cancelling leaves `stakes` intact so it returns.
  const tiles: { label: string; icon: TileProps['icon']; selected: boolean; stakes: Stakes }[] = [
    ...STAKES_PRESETS.map((p) => ({
      label: p.label,
      icon: p.icon,
      selected: !editing && stakes?.kind === 'preset' && stakes.label === p.label,
      stakes: { kind: 'preset' as const, label: p.label },
    })),
    ...(custom
      ? [
          {
            label: custom,
            icon: 'sparkles-outline' as const,
            selected: !editing && stakes?.kind === 'custom' && stakes.label === custom,
            stakes: { kind: 'custom' as const, label: custom },
          },
        ]
      : []),
  ]
  // Rows of two, so an odd last tile keeps the same width as the rest.
  const rows: (typeof tiles)[] = []
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2))

  return (
    <KeyboardScreen
      footer={
        // Mounted once, so swapping its contents doesn't replay the entrance fade. While
        // editing, it carries the editor's actions so they stay above the keyboard.
        <FadeIn delay={160} style={styles.footer}>
          {editing ? (
            <>
              {/* Stays enabled so an empty or too-long label explains itself on tap. */}
              <Button label="Save" size="lg" onPress={saveEditor} />
              <Button label="Cancel" variant="ghost" onPress={() => setDraftLabel(null)} />
            </>
          ) : (
            <>
              <Button
                label="Continue"
                size="lg"
                disabled={!stakes}
                onPress={() => stakes && goNext({ stakes })}
              />
              <Text style={styles.note}>You can adjust this anytime</Text>
            </>
          )}
        </FadeIn>
      }
    >
      <FadeIn style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          What will you owe for a missed week?
        </Text>
        <Text style={styles.subtitle}>
          Keep it small and kind. It’s about showing up, not paying up.
        </Text>
      </FadeIn>

      <FadeIn delay={80} style={styles.grid}>
        {rows.map((row) => (
          <View key={row[0].label} style={styles.row}>
            {row.map((t) => (
              <Tile
                key={t.label}
                label={t.label}
                icon={t.icon}
                selected={t.selected}
                onPress={() => choose(t.stakes)}
                onEdit={() => openEditor(t.label)}
              />
            ))}
            {row.length === 1 ? <View style={styles.tileWrap} /> : null}
          </View>
        ))}
      </FadeIn>

      <FadeIn delay={120}>
        {editing ? (
          <TextField
            label="Your stakes"
            value={draftLabel}
            onChangeText={setDraftLabel}
            onBlur={() => setTouched(true)}
            onSubmitEditing={saveEditor}
            placeholder="Pick our next study"
            maxLength={STAKES_MAX + 10}
            autoFocus
            returnKeyType="done"
            autoCapitalize="sentences"
            error={shownError}
            hint={`${draftLabel.trim().length}/${STAKES_MAX}`}
          />
        ) : (
          <Pressable
            onPress={() => openEditor(custom ?? '')}
            accessibilityRole="button"
            accessibilityLabel="Make your own stakes"
            style={({ pressed }) => [styles.own, pressed && styles.pressed]}
          >
            <View style={styles.plus}>
              <Ionicons name="add" size={22} color={colors.Ink} />
            </View>
            <View style={styles.ownText}>
              <Text style={styles.ownTitle}>Make your own</Text>
              <Text style={styles.ownHint}>Like “Pick our next study” or “Bake cookies”</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        )}
      </FadeIn>
    </KeyboardScreen>
  )
}

const styles = StyleSheet.create({
  head: { gap: spacing.sm, alignItems: 'center' },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
    color: colors.Ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.muted,
    textAlign: 'center',
  },
  grid: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  tileWrap: { flex: 1 },
  tile: {
    minHeight: 120,
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    // Same width selected or not, so picking a tile never resizes it.
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tileSelected: { borderColor: colors.Gold, backgroundColor: colors.goldSoft },
  pressed: { opacity: 0.7 },
  tileLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Ink,
  },
  check: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: radii.full,
    backgroundColor: colors.Gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pencil: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  own: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  plus: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.Mat,
  },
  ownText: { flex: 1, gap: spacing.xxs },
  ownTitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Ink,
  },
  ownHint: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
  },
  footer: { gap: spacing.sm },
  note: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
    textAlign: 'center',
  },
})
