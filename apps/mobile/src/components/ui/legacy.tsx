/**
 * Small shared building blocks so screens stay focused on layout + data.
 */
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { initials } from '../../lib/format';

export function Eyebrow({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.eyebrowRow}>
      <Text style={styles.eyebrow}>{children}</Text>
      {right ? <Text style={styles.eyebrowRight}>{right}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: any }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'solid' | 'outline' | 'ghost';
  /** 'lg' is the full-width call to action used on onboarding screens. */
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'solid', size = 'md', loading, disabled, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        size === 'lg' && styles.buttonLarge,
        variant === 'solid' && styles.buttonSolid,
        variant === 'outline' && styles.buttonOutline,
        variant === 'ghost' && styles.buttonGhost,
        (pressed || isDisabled) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? colors.surface : colors.Gold} />
      ) : (
        <Text style={[styles.buttonText, variant === 'solid' && { color: colors.surface }]}>{label}</Text>
      )}
    </Pressable>
  );
}

type AvatarProps = { name?: string | null; uri?: string | null; size?: number; dim?: boolean };

export function Avatar({ name, uri, size = 36, dim }: AvatarProps) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View
      style={[
        styles.avatar,
        shape,
        dim && { backgroundColor: colors.Mat, borderColor: colors.inactive },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={[shape, dim && { opacity: 0.45 }]} />
      ) : (
        <Text style={[styles.avatarText, { fontSize: size * 0.36 }, dim && { color: colors.muted }]}>{initials(name)}</Text>
      )}
    </View>
  );
}

export function AvatarStack({ people }: { people: { id: string; name?: string | null; uri?: string | null; active?: boolean }[] }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {people.map((p, i) => (
        <View key={p.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar name={p.name} uri={p.uri} dim={p.active === false} />
        </View>
      ))}
    </View>
  );
}

export function ProgressTrack({ value }: { value: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.trackFill, { width: `${Math.min(100, Math.max(0, value))}%` }]} />
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.Gold} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={[styles.center, { gap: spacing.md }]}>
      <Muted>{message}</Muted>
      {onRetry ? <Button label="Try again" variant="outline" onPress={onRetry} /> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.Gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  eyebrowRight: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.caption, color: colors.muted },
  sectionTitle: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.subTitle, color: colors.Ink },
  muted: { fontFamily: typography.fontFamily.body, fontSize: 14, color: colors.muted, lineHeight: 20 },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  buttonLarge: { minHeight: 56, borderRadius: radii.md },
  buttonSolid: { backgroundColor: colors.Gold },
  buttonOutline: { borderColor: colors.Gold, borderWidth: 2 },
  buttonGhost: {},
  buttonText: { color: colors.Gold, fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.bodySmall },
  avatar: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.paper,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontFamily: typography.fontFamily.body, color: colors.Gold },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.Mat, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: colors.Gold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
