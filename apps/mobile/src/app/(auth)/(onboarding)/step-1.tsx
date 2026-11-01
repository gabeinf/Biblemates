import { View, Text, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { spacing, typography, colors, radii } from '../../../theme/tokens'
import { Link } from 'expo-router'

export default function StepOne() {
  return (

    <View style={styles.screen}>

      <View style={styles.body}>
        <Text style={styles.heroText}>Biblemates works two ways.</Text>

        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <Text style={styles.infoText}>ALL WEEK · ON YOUR OWN TIME</Text>
            <Text style={styles.subTitle}>Together Reader</Text>
            <Text style={styles.subText}>{'One shared Bible. Your group\'s highlights sit in the margin, and a verse that stops you can be nudged straight to them.'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.infoText}>TUESDAY NIGHTS · TOGETHER</Text>
            <Text style={styles.subTitle}>Live Study</Text>
            <Text style={styles.subText}>{'The host turns the page and every screen\nfollows. You keep talking - on a call, or around the table - and Biblemates keeps the place.'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.subText}>You can use one and never touch the other.</Text>
        <Link href='/step-2' asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  )

}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between'
  },
  body: {
    gap: spacing.lg
  },
  heroText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
  },
  cardsContainer: {
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
    paddingVertical: spacing.ml
  },
  buttonText: {
    color: colors.Gold,
    fontFamily: typography.fontFamily.body
  }

})