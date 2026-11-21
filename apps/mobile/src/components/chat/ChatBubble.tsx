/**
 * One chat message. Your messages sit in a gold bubble on the right; answers
 * are plain text across the page (no bubble), streaming in with a soft fade.
 */
import { useEffect, useRef, type PropsWithChildren } from 'react'
import { Animated, Easing, Linking, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { Citation, MoodId } from '@biblemates/shared'
import StreamingText from './StreamingText'
import { colors, radii, spacing, typography } from '../../theme/tokens'

export type UiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations: Citation[]
  crisis: boolean
  streaming?: boolean
  /** Arrived live in this session (animate it); history renders instantly. */
  live?: boolean
  error?: string
  /** Set on a failed answer so it can be re-sent. */
  retry?: { message: string; mood?: MoodId; userId: string; assistantId: string }
}

type PassageTarget = { bookId: string; chapter: number; verseStart: number }

/** Fades and slides its children in once, on mount. */
export function FadeIn({
  children,
  enabled = true,
  delay = 0,
  style,
}: PropsWithChildren<{ enabled?: boolean; delay?: number; style?: StyleProp<ViewStyle> }>) {
  const v = useRef(new Animated.Value(enabled ? 0 : 1)).current
  useEffect(() => {
    if (!enabled) return
    Animated.timing(v, {
      toValue: 1,
      duration: 320,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [enabled, delay, v])
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] })
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY }] }]}>{children}</Animated.View>
}

/** "Searching Scripture" as plain text with a slow breathing pulse. */
function Thinking() {
  const pulse = useRef(new Animated.Value(0.35)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])
  return <Animated.Text style={[styles.thinking, { opacity: pulse }]}>Searching Scripture</Animated.Text>
}

export default function ChatBubble({
  message,
  onOpenPassage,
  onRetry,
}: {
  message: UiMessage
  onOpenPassage: (p: PassageTarget) => void
  onRetry?: () => void
}) {
  if (message.role === 'user') {
    return (
      <FadeIn enabled={!!message.live} style={[styles.row, styles.rowUser]}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </FadeIn>
    )
  }

  const waiting = message.streaming && !message.content

  return (
    <View style={styles.assistant}>
      {waiting ? (
        <FadeIn enabled delay={150}>
          <Thinking />
        </FadeIn>
      ) : (
        <StreamingText
          text={message.content}
          animate={!!message.live}
          style={styles.assistantText}
          onOpenPassage={onOpenPassage}
        />
      )}

      {message.error ? (
        <FadeIn enabled style={{ gap: spacing.xs }}>
          <Text style={styles.errorText}>{message.error}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} hitSlop={8}>
              <Text style={styles.retry}>Try again</Text>
            </Pressable>
          ) : null}
        </FadeIn>
      ) : null}

      {!message.streaming && message.citations.length > 0 ? (
        <FadeIn enabled={!!message.live} delay={250} style={styles.pills}>
          {message.citations.map((c) => (
            <Pressable
              key={`${c.bookId}-${c.chapter}-${c.verseStart}-${c.verseEnd}`}
              onPress={() => onOpenPassage(c)}
              style={({ pressed }) => [styles.pill, pressed && { opacity: 0.6 }]}
              accessibilityRole="link"
              accessibilityLabel={`Read ${c.reference}`}
            >
              <Ionicons name="book-outline" size={13} color={colors.Gold} />
              <Text style={styles.pillText}>{c.reference}</Text>
            </Pressable>
          ))}
        </FadeIn>
      ) : null}

      {message.crisis && !message.streaming ? (
        <FadeIn enabled={!!message.live} delay={150} style={styles.crisis}>
          <Text style={styles.crisisTitle}>You don't have to face this alone</Text>
          <View style={styles.crisisButtons}>
            <Pressable style={styles.crisisButton} onPress={() => Linking.openURL('tel:988')}>
              <Ionicons name="call" size={14} color={colors.surface} />
              <Text style={styles.crisisButtonText}>Call 988</Text>
            </Pressable>
            <Pressable style={styles.crisisButton} onPress={() => Linking.openURL('sms:988')}>
              <Ionicons name="chatbubble" size={14} color={colors.surface} />
              <Text style={styles.crisisButtonText}>Text 988</Text>
            </Pressable>
          </View>
        </FadeIn>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: spacing.md },
  rowUser: { justifyContent: 'flex-end' },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: colors.Gold,
    borderRadius: radii.lg,
    borderBottomRightRadius: radii.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  userText: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.bodySmall, color: colors.surface, lineHeight: 23 },
  assistant: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, gap: spacing.md },
  assistantText: { fontFamily: typography.fontFamily.body, fontSize: 17, color: colors.Ink, lineHeight: 28 },
  thinking: { fontFamily: typography.fontFamily.bodyItalic, fontSize: 16, color: colors.muted },
  errorText: { fontFamily: typography.fontFamily.body, fontSize: 14, color: colors.danger },
  retry: { fontFamily: typography.fontFamily.body, fontSize: 14, color: colors.Gold, textDecorationLine: 'underline' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.goldSoft,
  },
  pillText: { fontFamily: typography.fontFamily.body, fontSize: 13, color: colors.Ink },
  crisis: { gap: spacing.xs, padding: spacing.sm, borderRadius: radii.md, backgroundColor: colors.dangerSoft },
  crisisTitle: { fontFamily: typography.fontFamily.body, fontSize: 14, color: colors.danger },
  crisisButtons: { flexDirection: 'row', gap: spacing.xs },
  crisisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.danger,
  },
  crisisButtonText: { fontFamily: typography.fontFamily.body, fontSize: 14, color: colors.surface },
})
