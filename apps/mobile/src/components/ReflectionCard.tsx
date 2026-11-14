import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Avatar } from './ui';
import { colors, spacing, typography } from '../theme/tokens';
import { firstName, timeAgo } from '../lib/format';
import { useDeleteReflection, useEncourage } from '../hooks/queries';
import { useUserId } from '../hooks/use-auth-context';
import type { CircleMember, Reflection } from '../types/db';

type Props = { reflection: Reflection; members: CircleMember[] };

export default function ReflectionCard({ reflection: r, members }: Props) {
  const userId = useUserId();
  const encourage = useEncourage();
  const del = useDeleteReflection();
  const authorProfile = members.find((m) => m.user_id === r.user_id)?.profile
  const author = authorProfile?.display_name;
  const isMine = r.user_id === userId;
  const hearts = r.encouragements?.filter((e) => e.kind === 'heart') ?? [];
  const iHearted = hearts.some((e) => e.from_user === userId);

  const onLongPress = () => {
    if (!isMine) return;
    Alert.alert('Delete reflection?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(r.id) },
    ]);
  };

  return (
    <Pressable onLongPress={onLongPress} style={styles.row}>
      <Avatar name={author} uri={authorProfile?.avatar_url} />
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <View style={styles.header}>
          <Text style={styles.name}>{isMine ? 'You' : firstName(author)}</Text>
          <Text style={styles.meta}>
            {timeAgo(r.created_at)}
            {r.visibility === 'private' ? ' · private' : ''}
          </Text>
        </View>
        <Text style={styles.body}>“{r.body}”</Text>
        {!isMine && r.visibility === 'circle' ? (
          <View style={styles.actions}>
            <Pressable
              hitSlop={8}
              disabled={iHearted}
              onPress={() =>
                encourage.mutate({ circleId: r.circle_id, toUser: r.user_id, kind: 'heart', reflectionId: r.id })
              }
              style={styles.action}
            >
              <Ionicons name={iHearted ? 'heart' : 'heart-outline'} size={16} color={colors.Gold} />
              <Text style={styles.actionText}>{iHearted ? 'Encouraged' : 'Encourage'}</Text>
            </Pressable>
          </View>
        ) : hearts.length ? (
          <Text style={styles.meta}>❤️ {hearts.length} encouraged you</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontFamily: typography.fontFamily.body, fontSize: 15, color: colors.Ink },
  meta: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.caption, color: colors.muted },
  body: { fontFamily: typography.fontFamily.bodyItalic, fontSize: 15, lineHeight: 22, color: colors.Ink },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xxs },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  actionText: { fontFamily: typography.fontFamily.body, fontSize: 13, color: colors.Gold },
});
