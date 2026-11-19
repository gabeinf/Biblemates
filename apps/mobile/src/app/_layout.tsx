import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { AppState } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useAuthContext } from "../hooks/use-auth-context";
import AuthProvider from "../providers/auth-provider";
import AnimatedSplash from "../components/AnimatedSplash";
import { markAppReady } from "../lib/splash";

SplashScreen.preventAutoHideAsync();
// <AnimatedSplash /> is an identical copy of the native splash, so swap instantly.
SplashScreen.setOptions({ duration: 0, fade: false });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

// Refetch stale data when the app returns to the foreground.
AppState.addEventListener("change", (state) => focusManager.setFocused(state === "active"));

function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuthContext();

  const [fontsLoaded, fontError] = useFonts({
    'Lora': require('../../assets/fonts/Lora-VariableFont_wght.ttf'),
    'Lora-Italic': require('../../assets/fonts/Lora-Italic-VariableFont_wght.ttf'),
    'CormorantGaramond': require('../../assets/fonts/CormorantGaramond-VariableFont_wght.ttf'),
    'CormorantGaramond-Italic': require('../../assets/fonts/CormorantGaramond-Italic-VariableFont_wght.ttf')
  })

  // Signed-out users go straight to onboarding. Signed-in users keep the splash
  // up until (main) has loaded their circle — see (main)/_layout.tsx.
  useEffect(() => {
    if ((fontsLoaded || fontError) && !isLoading && !isLoggedIn) {
      markAppReady();
    }
  }, [fontsLoaded, fontError, isLoading, isLoggedIn]);

  // Drop cached server data when the user signs out.
  useEffect(() => {
    if (!isLoggedIn) queryClient.clear();
  }, [isLoggedIn]);

  if ((!fontsLoaded && !fontError) || isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Once signed in, leave onboarding for /home. Without redirectTo, expo-router
          falls back to "/", which only (auth)/index serves, so it's unmatched.
          With no circle yet, (main)'s own guard sends /home on to /circle-setup. */}
      <Stack.Protected guard={!isLoggedIn} redirectTo="/home">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Keyboard-aware layouts (sticky footers, scroll-to-input) need this at the root. See CLAUDE.md. */}
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="dark" />
            <RootNavigator />
            <AnimatedSplash />
          </AuthProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}
