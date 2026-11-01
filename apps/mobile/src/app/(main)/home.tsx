import { View, Text, StyleSheet, Pressable, Button } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { spacing, typography, radii, colors } from '../../theme/tokens'
import { socket } from '../../lib/socket'
import { useEffect, useState } from 'react'
import { useAuthContext } from '../../hooks/use-auth-context'
import { supabase } from '../../lib/supabase'

export default function Home() {

  const { profile } = useAuthContext();
  const [rooms, setRooms] = useState<string[]>([])

  useEffect(() => {
    const onUpdate = (list: string[]) => setRooms(list)
    socket.on("rooms:update", onUpdate)
    socket.connect()
    return () => { socket.off("rooms:update", onUpdate) }
  }, [])

  const handleStartSession = async () => {
    const res = await socket.emitWithAck("room:create");
    console.log("room:", res);
  }

  async function onSignOutButtonPress () {
    const {error} = await supabase.auth.signOut();
    if (error) {
      console.log('Error signing out:', error.message)
    }
  }

  return (
    <SafeAreaView style={styles.screen}>

      <View style={styles.header}>
        <Text style={styles.userStatus}>{profile?.display_name} · Friday, 5:30 PM</Text>
        <Text style={styles.heroText}>Friday Night Study</Text>

        <Pressable style={styles.button} onPress={handleStartSession}>
          <Text style={styles.buttonText}>Start a live session</Text>
        </Pressable>

        <View style={styles.divider}></View>

        <View>
          <Text>{profile?.display_name}</Text>
          <Button title='Sign out' onPress={onSignOutButtonPress}/>
        </View>

        {rooms.map(id => (
          <View key={id} style={styles.card}>
            <Text>{id}</Text>
          </View>
        ))}
      </View>


    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    gap: spacing.md
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: -spacing.xl
  },
  body: {
    gap: spacing.lg
  },
  card: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.sm
  },
  userStatus: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.Gold,
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  heroText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
  },
  subTitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.subTitle,
  },
  subText: {
    color: colors.muted,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall
  },
  infoText: {
    color: colors.Gold,
    fontSize: typography.fontSize.caption
  },
  footer: {
    gap: spacing.lg
  },
  button: {
    alignItems: 'center',
    borderColor: colors.Gold,
    borderWidth: 2,
    borderRadius: radii.sm,
    paddingVertical: spacing.md
  },
  buttonText: {
    color: colors.Gold,
    fontFamily: typography.fontFamily.body
  }

})