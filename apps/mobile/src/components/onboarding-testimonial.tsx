/**
 * Testimonial card for 05 · Voices: avatar initial, title, decorative stars, and a short
 * quote. Screen readers hear it as one item: "title, quote".
 */
import { StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Avatar, Card } from './ui'
import type { Testimonial } from '../lib/testimonials'
import { colors, spacing, typography } from '../theme/tokens'

/** A row of stars. Decorative: hidden from screen readers. */
export function Stars({ count = 5, size = 14 }: { count?: number; size?: number }) {
  return (
    <View
      testID="stars"
      style={styles.stars}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, i) => (
        <Ionicons key={i} name="star" size={size} color={colors.Gold} />
      ))}
    </View>
  )
}

const AVATAR = 40

export function TestimonialCard({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <View accessible accessibilityLabel={`${t.title}, ${t.quote}`}>
      <Card style={styles.card}>
        <View style={styles.head}>
          <Avatar name={t.name} size={AVATAR} />
          <View style={styles.headText}>
            <Text style={styles.title}>{t.title}</Text>
            <Stars count={t.rating} />
          </View>
        </View>
        <Text style={styles.quote} numberOfLines={4}>
          {t.quote}
        </Text>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', gap: 2 },
  card: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headText: { flex: 1, gap: spacing.xxs },
  title: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Ink,
  },
  quote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    lineHeight: Math.round(typography.fontSize.bodySmall * 1.45),
    color: colors.muted,
  },
})
