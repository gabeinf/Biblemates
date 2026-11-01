import { Stack, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { useAuthContext } from "../hooks/use-auth-context";
import AuthProvider from "../providers/auth-provider";

SplashScreen.preventAutoHideAsync();



function RootNavigator() {

  const { isLoggedIn } = useAuthContext();
  
  const [fontsLoaded, fontError] = useFonts({
    'Lora': require('../../assets/fonts/Lora-VariableFont_wght.ttf'),
    'Lora-Italic': require('../../assets/fonts/Lora-Italic-VariableFont_wght.ttf'),
    'CormorantGaramond': require('../../assets/fonts/CormorantGaramond-VariableFont_wght.ttf'),
    'CormorantGaramond-Italic': require('../../assets/fonts/CormorantGaramond-Italic-VariableFont_wght.ttf')
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack >
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen options={{ headerShown: false }} name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(main)" options={{ animation: 'fade', headerShown: false }} />
      </Stack.Protected>
    </Stack>


  );


}
  export default function RootLayout() {
    return (
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    )
  }