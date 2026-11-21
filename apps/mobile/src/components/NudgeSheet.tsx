import { useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { space, useTheme } from '../theme'
import { AppText, ChunkyButton, LambView, Sheet } from './ui'

/** "Hooray" bottom sheet after a nudge: the lamb, one line, Done. Rose accents. */
export function NudgeSheet({ name, onClose }: { name: string | null; onClose: () => void }) {
  const theme = useTheme()
  // Keep the last name while the sheet slides out (name is already null by then).
  const [shown, setShown] = useState(name)
  if (name !== null && name !== shown) setShown(name)
  return (
    <Modal visible={name !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      <Sheet style={{ backgroundColor: theme.surface }}>
        <View style={styles.center}>
          <LambView view="front" size={120} />
          <Ionicons name="heart" size={22} color={theme.love} />
          <AppText variant="headline" style={styles.text}>
            Prayer sent
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.text}>
            {`${shown ?? 'They'} will know you're praying for them.`}
          </AppText>
        </View>
        <ChunkyButton label="Done" onPress={onClose} />
      </Sheet>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scrim: { flex: 1 },
  center: { alignItems: 'center', gap: space.xs },
  text: { textAlign: 'center' },
})
