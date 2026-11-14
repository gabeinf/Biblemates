/**
 * Scripture chat: a traditional chat (newest at the bottom, input pinned below).
 * Answers stream in from apps/server and the view glides along with them; Scripture references are
 * tappable and open the passage in the Bible tab. Mood chips start a chat by
 * sending a normal message. History lives behind the clock icon (top right).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useQueryClient } from '@tanstack/react-query'
import { MOODS, type Mood, type MoodId } from '@biblemates/shared'
import ChatBubble, { type UiMessage } from '../../components/chat/ChatBubble'
import { qk, useConversationMessages } from '../../hooks/queries'
import { sendAsk } from '../../services/chat'
import { Lines } from '../../components/Skeleton'
import { Eyebrow, Muted } from '../../components/ui'
import { colors, radii, spacing, typography } from '../../theme/tokens'

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const FLUSH_MS = 40

export default function Chat() {
  const router = useRouter()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id?: string }>()

  const [conversationId, setConversationId] = useState<string | undefined>(params.id || undefined)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  // Which conversation `messages` was loaded for, so a fetch never clobbers a live chat.
  const loadedFor = useRef<string | undefined>(undefined)

  // Opening a chat from history (or starting fresh).
  useEffect(() => {
    const id = params.id || undefined
    setConversationId(id)
    setMessages([])
    loadedFor.current = undefined
  }, [params.id])

  const history = useConversationMessages(conversationId)
  useEffect(() => {
    if (!conversationId || !history.data || loadedFor.current === conversationId) return
    loadedFor.current = conversationId
    setMessages(history.data.map((m) => ({ ...m, citations: m.citations ?? [] })))
  }, [conversationId, history.data])

  const newChat = () => {
    if (busy) return
    if (params.id) router.setParams({ id: '' })
    setConversationId(undefined)
    setMessages([])
    loadedFor.current = undefined
  }

  const patch = (id: string, fn: (m: UiMessage) => UiMessage) =>
    setMessages((list) => list.map((m) => (m.id === id ? fn(m) : m)))

  const send = useCallback(
    async (raw: string, mood?: MoodId, retryOf?: { userId: string; assistantId: string }) => {
      const message = raw.trim()
      if (!message || busy) return
      setBusy(true)
      const requestId = newId()
      const userId = retryOf?.userId ?? `u-${requestId}`
      const assistantId = `a-${requestId}`

      setMessages((list) => {
        const base = retryOf ? list.filter((m) => m.id !== retryOf.assistantId) : list
        const userMsg: UiMessage = { id: userId, role: 'user', content: message, citations: [], crisis: false, live: true }
        return [
          ...(retryOf ? base : [...base, userMsg]),
          { id: assistantId, role: 'assistant', content: '', citations: [], crisis: false, streaming: true, live: true },
        ]
      })

      // Batch network chunks; StreamingText paces the on-screen reveal itself.
      let buffer = ''
      let timer: ReturnType<typeof setTimeout> | null = null
      const flush = () => {
        timer = null
        const chunk = buffer
        buffer = ''
        if (chunk) patch(assistantId, (m) => ({ ...m, content: m.content + chunk }))
      }

      try {
        const res = await sendAsk(
          { requestId, conversationId, message, mood },
          {
            // The server has saved the message; keep the conversation even if the answer fails.
            onStart: (s) => {
              loadedFor.current = s.conversationId
              setConversationId(s.conversationId)
            },
            onDelta: (d) => {
              buffer += d
              if (!timer) timer = setTimeout(flush, FLUSH_MS)
            },
          },
        )
        if (timer) clearTimeout(timer)
        loadedFor.current = res.conversationId
        setConversationId(res.conversationId)
        // Ids stay the local ones: changing a key would remount the text and restart its animation.
        patch(assistantId, (m) => ({
          ...m,
          content: res.text,
          citations: res.citations,
          crisis: res.crisis,
          streaming: false,
        }))
        qc.invalidateQueries({ queryKey: qk.conversations })
        qc.invalidateQueries({ queryKey: qk.messages(res.conversationId) })
      } catch (err) {
        if (timer) clearTimeout(timer)
        patch(assistantId, (m) => ({
          ...m,
          streaming: false,
          content: m.content + buffer,
          error: err instanceof Error ? err.message : 'Something went wrong.',
          retry: { message, mood, userId, assistantId },
        }))
      } finally {
        setBusy(false)
      }
    },
    [busy, conversationId, qc],
  )

  const submit = () => {
    const t = text
    setText('')
    send(t)
  }

  const pickMood = (m: Mood) => send(m.message, m.id)

  const openPassage = (p: { bookId: string; chapter: number; verseStart: number }) =>
    router.navigate({ pathname: '/bible', params: { book: p.bookId, chapter: String(p.chapter), verse: String(p.verseStart) } })

  // ------------------------------------------------------------ follow the stream
  // Normal (non-inverted) list: while pinned to the bottom, each new line glides
  // into view with an animated scroll instead of shoving the content up a line.
  // Dragging up unpins (so we never fight the reader); the arrow button re-pins.
  const listRef = useRef<FlatList<UiMessage>>(null)
  const pinned = useRef(true)
  const dragging = useRef(false)
  const firstLayout = useRef(true)
  const [showJump, setShowJump] = useState(false)

  const followIfPinned = () => {
    if (!pinned.current) return
    // First paint of a reopened chat: jump straight to the end, no animation.
    listRef.current?.scrollToEnd({ animated: !firstLayout.current })
    firstLayout.current = false
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!dragging.current) return // only the reader's own scrolling changes pinning
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    const fromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height)
    pinned.current = fromBottom < 60
    setShowJump(!pinned.current)
  }

  // A flick that coasts back to the bottom re-pins (never unpins: programmatic
  // follow-scrolls also end here, possibly while the content is still growing).
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    if (contentSize.height - (contentOffset.y + layoutMeasurement.height) < 60) {
      pinned.current = true
      setShowJump(false)
    }
  }

  const jumpToBottom = () => {
    pinned.current = true
    setShowJump(false)
    listRef.current?.scrollToEnd({ animated: true })
  }

  // Sending always brings you back to the latest message.
  useEffect(() => {
    if (busy) jumpToBottom()
  }, [busy])

  // A different conversation starts with a fresh, unanimated jump to its end.
  useEffect(() => {
    firstLayout.current = true
    pinned.current = true
    setShowJump(false)
  }, [params.id])

  const loadingHistory = !!conversationId && history.isPending && messages.length === 0
  const empty = !conversationId && messages.length === 0

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerIcons}>
              <Pressable hitSlop={8} onPress={newChat} accessibilityLabel="New chat">
                <Ionicons name="create-outline" size={23} color={colors.Gold} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => router.push('/chat-history')} accessibilityLabel="Chat history">
                <Ionicons name="time-outline" size={24} color={colors.Gold} />
              </Pressable>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
      >
        {loadingHistory ? (
          <View style={styles.historySkeleton}>
            <Lines count={3} />
            <Lines count={4} />
          </View>
        ) : empty ? (
          <View style={styles.welcome}>
            <Eyebrow>Scripture for today</Eyebrow>
            <Text style={styles.hero}>How are you feeling?</Text>
            <Muted>Tap a feeling or write what's on your heart. Every answer comes from the Bible.</Muted>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              scrollEventThrottle={16}
              onScrollBeginDrag={() => (dragging.current = true)}
              onScroll={onScroll}
              onScrollEndDrag={() => (dragging.current = false)}
              onMomentumScrollEnd={onMomentumEnd}
              onContentSizeChange={followIfPinned}
              onLayout={() => pinned.current && listRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => (
                <ChatBubble
                  message={item}
                  onOpenPassage={openPassage}
                  onRetry={item.retry ? () => send(item.retry!.message, item.retry!.mood, item.retry) : undefined}
                />
              )}
            />
            {showJump ? (
              <Pressable style={styles.jump} onPress={jumpToBottom} accessibilityLabel="Scroll to latest">
                <Ionicons name="arrow-down" size={18} color={colors.Ink} />
              </Pressable>
            ) : null}
          </View>
        )}

        {empty ? (
          <View style={styles.chips}>
            {MOODS.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => pickMood(m)}
                style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
              >
                <Text style={styles.chipText}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={submit}
            disabled={busy || !text.trim()}
            style={({ pressed }) => [styles.send, (busy || !text.trim()) && styles.sendDisabled, pressed && { opacity: 0.6 }]}
            accessibilityLabel="Send"
          >
            <Ionicons name="arrow-up" size={20} color={colors.surface} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  list: { paddingVertical: spacing.md, gap: spacing.sm },
  historySkeleton: { flex: 1, padding: spacing.lg, gap: spacing.xl },
  welcome: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.xs },
  hero: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.title, color: colors.Ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { fontFamily: typography.fontFamily.body, fontSize: 15, color: colors.Ink },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.paper,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 130,
    paddingHorizontal: spacing.md,
    paddingTop: 11,
    paddingBottom: 11,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Ink,
  },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.Gold, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
  jump: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
})
