import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { spacing, typography, colors, radii } from '../../../theme/tokens'
import { Link } from 'expo-router'
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function Register() {

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          display_name: name
        }
      }
    });
    if (error) {
      console.log('Error signing up:', error.message)
    }
    setLoading(false)
  }

  return (

    <View style={styles.screen}>

      <View style={styles.body}>
        <Text style={styles.heroText}>Sign up</Text>

        <Text style={styles.subText}>Sign up and Invite others through text. No passwords to keep</Text>




        <View style={styles.inputContainer}>

          <View style={styles.mobileContainer}>
            <Text style={styles.formDetail}>Display Name</Text>
            <TextInput
              style={styles.input}
              onChangeText={(text => setName(text))}
              value={name}
            />
          </View>

          <View style={styles.mobileContainer}>
            <Text style={styles.formDetail}>Email</Text>

            <TextInput
              style={styles.input}
              onChangeText={(text => setEmail(text))}
              value={email}
            />
            
          </View>

          <View style={styles.mobileContainer}>
            <Text style={styles.formDetail}>Password</Text>
            <TextInput
              style={styles.input}
              onChangeText={(text => setPassword(text))}
              value={password}
            />
          </View>

          <Pressable
            style={styles.signUpButton}
            onPress={signUpWithEmail}
          >
            <Text>Sign in</Text>
          </Pressable>
          <Link href='/register' asChild>
            <Pressable style={styles.signUpButton}>
              <Text>Sign up</Text>
            </Pressable>
          </Link>
        </View>

      </View>

      <View style={styles.footer}>
        <Text style={styles.subText}>You can use one and never touch the other.</Text>
        <Link href='/home' asChild>
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
  formDetail: {
    fontSize: typography.fontSize.caption,
    color: colors.muted,
    fontFamily: typography.fontFamily.body
  },
  inputContainer: {
    gap: spacing.md
  },

  mobileNumber: {

  },
  input: {
  },
  mobileContainer: {
    height: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 5,
    borderColor: colors.muted
  },
  signUpButton: {
    alignItems: 'center',
    backgroundColor: colors.Gold,
    borderRadius: 24,
    padding: spacing.md,
  },
  subText: {
    color: colors.muted,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall
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