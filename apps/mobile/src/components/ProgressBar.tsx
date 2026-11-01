import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radii } from '../theme/tokens'
import { usePathname } from 'expo-router'

export default function ProgressBar() {

  const pathname = usePathname()

  const currentStepIndex = Number(pathname.split('-')[1]) - 1

  const steps = [1, 2]

  return (
      <View style={styles.progressBar}>
        {steps.map((step, index) => (
          <View
            key={step}
            style={index == currentStepIndex ? styles.activeBar: styles.inactiveBar}
          />
        ))}
        
      </View>
  )
}

const styles = StyleSheet.create({
  progressBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    
  },
  activeBar: {
    backgroundColor: colors.Gold,
    height: 4,
    width: 30,
  },
  inactiveBar: {
    backgroundColor: colors.inactive,
    height: 4,
    width: 30,
  },
})