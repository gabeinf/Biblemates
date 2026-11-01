import { Tabs } from 'expo-router'

export default function AppLayout() {
    return (
    <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="bible" options={{ title: 'Bible' }} />
        <Tabs.Screen name="study" options={{ title: 'Study' }} />
    </Tabs>
)
} 