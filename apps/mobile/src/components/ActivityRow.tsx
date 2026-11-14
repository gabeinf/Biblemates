import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from './ui';
import { colors, spacing, typography } from '../theme/tokens';
import { firstName, timeAgo } from '../lib/format';
import { formatRef } from '../constants/books';
import type { Activity, CircleMember } from '../types/db';

function describe(a: Activity, actor: string, target: string, youAreTarget: boolean) {
  switch (a.kind) {
    case 'completed_reading':
      return { title: `${actor} finished today's reading`, sub: a.meta.day_title ? `Day ${a.meta.day_number} · ${a.meta.day_title}` : undefined };
    case 'shared_reflection':
      return {
        title: `${actor} shared a reflection`,
        sub: a.meta.book_id
          ? `On ${formatRef({ bookId: a.meta.book_id, chapter: a.meta.chapter, verseStart: a.meta.verse })}`
          : a.meta.day_number
            ? `On day ${a.meta.day_number}'s question`
            : undefined,
      };
    case 'prayer_request':
      return { title: `${actor} asked for prayer` };
    case 'encouraged':
      return {
        title:
          a.meta.kind === 'praying'
            ? `${actor} is praying for ${youAreTarget ? 'you' : target}`
            : `${actor} encouraged ${youAreTarget ? 'you' : target}`,
      };
    case 'joined':
      return { title: `${actor} joined the circle` };
    case 'milestone':
      return { title: `Your circle completed ${a.meta.study_title ?? 'a study'} 🎉` };
  }
}

export default function ActivityRow({ activity, members, userId }: { activity: Activity; members: CircleMember[]; userId: string }) {
  const profileOf = (id: string | null) => members.find((m) => m.user_id === id)?.profile
  const nameOf = (id: string | null) => profileOf(id)?.display_name;
  const actorName = activity.actor_id === userId ? 'You' : firstName(nameOf(activity.actor_id));
  const d = describe(activity, actorName, firstName(nameOf(activity.target_user_id)), activity.target_user_id === userId);

  return (
    <View style={styles.row}>
      <Avatar name={nameOf(activity.actor_id)} uri={profileOf(activity.actor_id)?.avatar_url} size={32} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{d.title}</Text>
        <Text style={styles.sub}>{d.sub ? `${d.sub} · ` : ''}{timeAgo(activity.created_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  title: { fontFamily: typography.fontFamily.body, fontSize: 15, color: colors.Ink },
  sub: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.caption, color: colors.muted, marginTop: 2 },
});
