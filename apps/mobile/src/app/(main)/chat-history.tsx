/** Past Scripture chats, newest first. Tap to reopen; trash to delete. */
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { MOODS } from '@biblemates/shared'
import { useConversations, useDeleteConversation } from '../../hooks/queries'
import { RowSkeleton } from '../../components/Skeleton'
import { ErrorState, Muted } from '../../components/ui'
import { timeAgo } from '../../lib/format'
import { colors, spacing, typography } from '../../theme/tokens'

export default function ChatHistory() {
  const router = useRouter()
  const conversations = useConversations()
  const remove = useDeleteConversation()

  const open = (id: string) => router.dismissTo({ pathname: '/chat', params: { id } })
  const startNew = () => router.dismissTo({ pathname: '/chat', params: { id: '' } })

  const confirmDelete = (id: string) =>
    Alert.alert('Delete this chat?', 'It will be removed from your history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(id) },
    ])

  if (conversations.isPending) {
    return (
      <View style={styles.screen}>
        <View style={{ padding: spacing.lg }}>
          <RowSkeleton count={5} avatar={0} />
        </View>
      </View>
    )
  }
  if (conversations.isError) {
    return <ErrorState message={conversations.error.message} onRetry={() => conversations.refetch()} />
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={conversations.data}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Pressable style={styles.newRow} onPress={startNew}>
            <Ionicons name="create-outline" size={20} color={colors.Gold} />
            <Text style={styles.newText}>New chat</Text>
          </Pressable>
        }
        ListEmptyComponent={<Muted style={{ padding: spacing.lg }}>No chats yet. Your conversations will show up here.</Muted>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const mood = MOODS.find((m) => m.id === item.mood)
          return (
            <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} onPress={() => open(item.id)}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title || 'Conversation'}
                </Text>
                <Text style={styles.meta}>
                  {mood ? `${mood.label} · ` : ''}
                  {timeAgo(item.updated_at)}
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => confirmDelete(item.id)} accessibilityLabel="Delete chat">
                <Ionicons name="trash-outline" size={19} color={colors.muted} />
              </Pressable>
            </Pressable>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  list: { paddingBottom: spacing.xxl },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  newText: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.bodySmall, color: colors.Gold },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.bodySmall, color: colors.Ink },
  meta: { fontFamily: typography.fontFamily.body, fontSize: 13, color: colors.muted },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.lg },
})
