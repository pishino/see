import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

/*
 * Push on the phone: register this phone with Expo's push service (it hands messages to Apple and Google), show a
 * message that arrives while See is open, and open its see:// link when tapped. Who gets what, and when, is decided
 * by whatever sends (deliver in @see/core); scripts/send-push.mjs sends one by hand.
 */
const TOKEN = 'see.push.token';

/** Until there is a server, the token stays on the phone; a server's adapter sends it there instead. */
export const pushRegistry = {
  save: (token: string) => AsyncStorage.setItem(TOKEN, token),
  load: () => AsyncStorage.getItem(TOKEN),
};

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/** Register for push if the phone allows it. Returns the Expo push token, or null (web, no permission, no project). */
export async function registerPush(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'See', importance: Notifications.AndroidImportance.HIGH, lightColor: '#FF4A1C' });
      // polls arrive on their own channel, so they can be turned off on their own
      await Notifications.setNotificationChannelAsync('polls', { name: 'Polls', importance: Notifications.AndroidImportance.HIGH, lightColor: '#7C6BFF' });
    }
    if (!(await Notifications.getPermissionsAsync()).granted) return null;
    const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
    const projectId = extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('See: push needs an EAS project id (app.json › expo.extra.eas.projectId); none yet, so no token.');
      return null;
    }
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await pushRegistry.save(data);
    console.log(`See: this phone's push token is ${data}`);
    return data;
  } catch (e) {
    console.warn('See: push registration failed', e);
    return null;
  }
}

/** Register when the app opens, and open a tapped notification's link (also when the tap is what opened See). */
export function usePushDelivery(follow: (link: string) => void) {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void registerPush();
    const open = (r: Notifications.NotificationResponse | null) => {
      const link = r?.notification.request.content.data?.link;
      if (typeof link === 'string' && link.startsWith('see://')) follow(link);
    };
    Notifications.getLastNotificationResponseAsync().then(open, () => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
