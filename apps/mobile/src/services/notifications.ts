import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import type { NotificationPrefs } from '../types/db';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const deviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'America/New_York';

/**
 * Asks for permission (once), fetches the Expo push token and stores it for the
 * signed-in user. Safe to call on every launch. No-ops on simulators.
 */
export async function registerForPush(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  await supabase.from('push_tokens').upsert({
    token,
    user_id: userId,
    platform: Platform.OS,
    updated_at: new Date().toISOString(),
  });
  // Keep server-side timezone in sync so reminders and quiet hours are local.
  await supabase.from('notification_prefs').upsert({ user_id: userId, timezone: deviceTimezone() });
  return token;
}

export async function unregisterPush() {
  try {
    if (!Device.isDevice) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from('push_tokens').delete().eq('token', token);
  } catch {
    // ignore — signing out shouldn't fail because of push cleanup
  }
}

export async function getPrefs(userId: string): Promise<NotificationPrefs> {
  const { data, error } = await supabase.from('notification_prefs').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data;
  const { data: created, error: insertError } = await supabase
    .from('notification_prefs')
    .upsert({ user_id: userId, timezone: deviceTimezone() })
    .select()
    .single();
  if (insertError) throw new Error(insertError.message);
  return created;
}

export async function updatePrefs(userId: string, patch: Partial<NotificationPrefs>) {
  const { error } = await supabase.from('notification_prefs').update(patch).eq('user_id', userId);
  if (error) throw new Error(error.message);
}
