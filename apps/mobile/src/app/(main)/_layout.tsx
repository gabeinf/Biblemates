import { Stack, useRouter } from 'expo-router'
import { markAppReady } from '../../lib/splash'
import { showCelebration } from '../../lib/celebrations'
import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { useAuthContext } from '../../hooks/use-auth-context'
import { prefetchLaunchData, useCircleRealtime, useMyCircle } from '../../hooks/queries'
import { registerForPush } from '../../services/notifications'
import { ErrorState } from '../../components/ui'
import { colors, typography } from '../../theme/tokens'

/** Opens the screen a push notification points at (data.url). */
function useNotificationRouting() {
  const router = useRouter()
  useEffect(() => {
    const open = (n: Notifications.Notification) => {
      const url = n.request.content.data?.url
      if (typeof url === 'string') router.push(url as any)
    }
    const last = Notifications.getLastNotificationResponse()
    if (last) open(last.notification)
    const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification))
    return () => sub.remove()
  }, [router])
}

export default function MainLayout() {
  const { userId } = useAuthContext()
  const circle = useMyCircle()
  const hasCircle = !!circle.data

  const router = useRouter()
  // Everyone finished the study: celebrate once, wherever they are in the app.
  const onMilestone = useCallback(() => showCelebration(router, 'study'), [router])
  useCircleRealtime(circle.data?.id, onMilestone)
  useNotificationRouting()

  // Ask for push permission once the user is in a circle (so the prompt has context).
  useEffect(() => {
    if (userId && hasCircle) registerForPush(userId).catch((e) => console.warn('push registration', e))
  }, [userId, hasCircle])

  // Launch warm-up: keep the splash up while Home's data and the last Bible
  // chapter load, so the first screen paints complete. Capped so a slow
  // network never traps the user on the splash (skeletons take over).
  const qc = useQueryClient()
  const circleId = circle.data?.id
  const [launched, setLaunched] = useState(false)
  useEffect(() => {
    if (launched || circle.isPending) return
    if (!circleId) return setLaunched(true)
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        setLaunched(true)
      }
    }
    prefetchLaunchData(qc, circleId).finally(finish)
    const cap = setTimeout(finish, 2500)
    return () => clearTimeout(cap)
  }, [launched, circle.isPending, circleId, qc])

  useEffect(() => {
    if (launched) markAppReady()
  }, [launched])

  if (!launched) return null // splash is still covering the screen
  if (circle.isError) return <ErrorState message={circle.error.message} onRetry={() => circle.refetch()} />

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTintColor: colors.Gold,
        headerTitleStyle: { fontFamily: typography.fontFamily.body },
        headerStyle: { backgroundColor: colors.paper },
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Protected guard={!hasCircle}>
        <Stack.Screen name="circle-setup" />
      </Stack.Protected>

      <Stack.Protected guard={hasCircle}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reflect" options={{ presentation: 'modal', headerShown: true, title: 'Reflect' }} />
        <Stack.Screen name="prayer" options={{ presentation: 'modal', headerShown: true, title: 'Prayer request' }} />
        <Stack.Screen name="verse-reflections" options={{ presentation: 'modal', headerShown: true, title: 'Circle reflections' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="guided" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="celebrate" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="profile" options={{ headerShown: true, title: 'Profile', headerBackTitle: 'Home' }} />
        <Stack.Screen name="chat" options={{ headerShown: true, title: 'Scripture', headerBackTitle: 'Home' }} />
        <Stack.Screen name="chat-history" options={{ presentation: 'modal', headerShown: true, title: 'Chats' }} />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal', headerShown: true, title: 'Edit profile' }} />
      </Stack.Protected>
    </Stack>
  )
}
