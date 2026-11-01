import { Text, View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, typography, radii, } from '../../theme/tokens'

export default function SignIn() {
  return (
    <SafeAreaView>
      <Text style={styles.backButton}>← Back</Text>
      <Text style={styles.title}>What's your number?</Text>
      <Text style={styles.subHeading}>Invites travel by text, so Biblemates signs you in the same way. No password to keep.</Text>
      <Text style={styles.infoText}>Mobile number</Text>

    <View style={styles.mobileContainer}>
      <View style={styles.extensionContainer}>
        <Text style={styles.extension}>+1</Text>
      </View>

      <View style={styles.numberContainer}>
        <Text style={styles.number}>{'(415) 220-9'}</Text>
      </View>
    </View>
      <View style={styles.button}>
        <Text style={styles.buttonText}>Send my code</Text>
      </View>

      <Text style={styles.footerText}>By continuing you agree to Biblemates's terms. We never post anything to your group without you.</Text>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create ({
  backButton: {

  },
  title: {

  },
  subHeading: {

  },
  infoText: {
    
  },
  mobileContainer: {

  },
  extensionContainer: {

  },
  extension: {

  },
  numberContainer: {

  },
  number: {

  },
  button: {

  },
  buttonText: {

  },
  footerText: {

  }
})