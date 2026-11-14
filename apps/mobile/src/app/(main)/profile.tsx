import { Alert, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import Constants from 'expo-constants'
import { useAuthContext, useUserId } from '../../hooks/use-auth-context'
import { useCircle, useLeaveCircle, useMembers, usePrefs, useUpdatePrefs } from '../../hooks/queries'
import { unregisterPush } from '../../services/notifications'
import { supabase } from '../../lib/supabase'
import { Avatar, Button, Card, Eyebrow, Muted } from '../../components/ui'
import { NotificationPrefsSkeleton, RowSkeleton } from '../../components/Skeleton'
import { colors, radii, spacing, typography } from '../../theme/tokens'

const hourLabel = (h: number) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`

function Stepper({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable hitSlop={8} onPress={() => onChange((value + 23) % 24)}>
        <Text style={styles.stepperBtn}>−</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{hourLabel(value)}</Text>
      <Pressable hitSlop={8} onPress={() => onChange((value + 1) % 24)}>
        <Text style={styles.stepperBtn}>+</Text>
      </Pressable>
    </View>
  )
}

function ToggleRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Muted>{sub}</Muted> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.Gold }} />
    </View>
  )
}

export default function Profile() {
  const router = useRouter()
  const userId = useUserId()
  const { profile } = useAuthContext()
  const circle = useCircle()
  const members = useMembers(circle.id)
  const prefs = usePrefs()
  const updatePrefs = useUpdatePrefs()
  const leave = useLeaveCircle()

  const p = prefs.data
  const quietOn = p?.quiet_start != null && p?.quiet_end != null

  const shareInvite = () =>
    Share.share({
      message: `Join my Bible reading circle "${circle.name}" on Biblemates! Use invite code ${circle.invite_code}.`,
    })

  const signOut = async () => {
    await unregisterPush()
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Error signing out', error.message)
  }

  const confirmLeave = () =>
    Alert.alert('Leave circle?', `You'll stop seeing ${circle.name}'s reading and reflections.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => leave.mutate() },
    ])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Identity + edit */}
      <View style={styles.identity}>
        <Avatar name={profile?.display_name} uri={profile?.avatar_url} size={96} />
        <Text style={styles.name}>{profile?.display_name ?? 'You'}</Text>
        <Muted>{circle.name}</Muted>
        <Button label="Edit profile" variant="outline" onPress={() => router.push('/edit-profile')} style={styles.editButton} />
      </View>

      <Eyebrow>Your circle</Eyebrow>
      <Card>
        <Pressable
          style={styles.codeBox}
          onPress={async () => {
            await Clipboard.setStringAsync(circle.invite_code)
            Alert.alert('Copied', 'Invite code copied to clipboard.')
          }}
        >
          <Text style={styles.code}>{circle.invite_code}</Text>
          <Muted>Tap to copy</Muted>
        </Pressable>
        <Button label="Invite someone" onPress={shareInvite} />
        {members.isPending && <RowSkeleton count={3} avatar={30} />}
        {(members.data ?? []).map((m) => (
          <View key={m.user_id} style={styles.member}>
            <Avatar name={m.profile?.display_name} uri={m.profile?.avatar_url} size={30} />
            <Text style={styles.rowLabel}>
              {m.profile?.display_name ?? 'Member'}
              {m.user_id === userId ? ' (you)' : ''}
            </Text>
            {m.role === 'owner' && <Muted>owner</Muted>}
          </View>
        ))}
      </Card>

      <Eyebrow>Notifications</Eyebrow>
      {!p && <NotificationPrefsSkeleton />}
      {p && (
        <Card style={{ gap: spacing.md }}>
          <ToggleRow
            label="Daily reading reminder"
            sub="One gentle nudge per day, only if you haven't read yet."
            value={p.daily_reminder}
            onChange={(v) => updatePrefs.mutate({ daily_reminder: v })}
          />
          {p.daily_reminder && <Stepper value={p.reminder_hour} onChange={(h) => updatePrefs.mutate({ reminder_hour: h })} />}
          <ToggleRow
            label="Circle activity"
            sub="When someone finishes the reading, shares a reflection or asks for prayer."
            value={p.circle_activity}
            onChange={(v) => updatePrefs.mutate({ circle_activity: v })}
          />
          <ToggleRow
            label="Encouragement"
            sub="When someone prays for you or hearts your reflection."
            value={p.encouragements}
            onChange={(v) => updatePrefs.mutate({ encouragements: v })}
          />
          <ToggleRow
            label="Quiet hours"
            value={quietOn}
            onChange={(v) => updatePrefs.mutate(v ? { quiet_start: 22, quiet_end: 7 } : { quiet_start: null, quiet_end: null })}
          />
          {quietOn && (
            <View style={{ gap: spacing.xs }}>
              <Muted>From</Muted>
              <Stepper value={p.quiet_start!} onChange={(h) => updatePrefs.mutate({ quiet_start: h })} />
              <Muted>Until</Muted>
              <Stepper value={p.quiet_end!} onChange={(h) => updatePrefs.mutate({ quiet_end: h })} />
            </View>
          )}
        </Card>
      )}

      <Button label="Sign out" variant="outline" onPress={signOut} />
      <Button label="Leave circle" variant="ghost" onPress={confirmLeave} />
      <Muted style={{ textAlign: 'center' }}>Biblemates {Constants.expoConfig?.version}</Muted>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  identity: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  name: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.title, color: colors.Ink, marginTop: spacing.xs },
  editButton: { alignSelf: 'stretch', marginTop: spacing.sm },
  codeBox: { alignItems: 'center', padding: spacing.md, backgroundColor: colors.goldSoft, borderRadius: radii.md },
  code: { fontFamily: typography.fontFamily.body, fontSize: 28, letterSpacing: 8, color: colors.Gold },
  member: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { fontFamily: typography.fontFamily.body, fontSize: 16, color: colors.Ink, flexShrink: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  stepperBtn: { fontSize: 24, color: colors.Gold, paddingHorizontal: spacing.sm },
  stepperValue: { fontFamily: typography.fontFamily.body, fontSize: 16, color: colors.Ink, minWidth: 90, textAlign: 'center' },
})
