import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { space } from '../../theme'
import { AppText } from './AppText'
import { ChunkyButton } from './ChunkyButton'
import { LambView } from './LambView'

/** Lamb + headline + one CTA. Pass `lamb` to swap the character (e.g. a side lamb). Never use inside forms. */
export function EmptyState({ headline, body, cta, lamb }: { headline: string; body?: string; cta?: { label: string; onPress: () => void }; lamb?: ReactNode }) {
  return (
    <View style={styles.wrap}>
      {lamb ?? <LambView view="front" size={140} />}
      <AppText variant="headline" style={styles.center}>
        {headline}
      </AppText>
      {body ? (
        <AppText variant="body" color="textSecondary" style={styles.center}>
          {body}
        </AppText>
      ) : null}
      {cta ? <ChunkyButton label={cta.label} onPress={cta.onPress} style={styles.cta} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm, padding: space.lg },
  center: { textAlign: 'center' },
  cta: { marginTop: space.sm },
})
