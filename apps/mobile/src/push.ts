import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/*
 * Push permission (V3ProblemStates O4). The phone is asked the first time a push switch goes on, never before.
 * If the phone says no for good, Settings shows the switches as unreachable and sends you to the one place that can
 * fix it; coming back to See checks again.
 */
export type PushPerm = 'granted' | 'denied' | 'ask' | 'unsupported';

const read = (r: Notifications.NotificationPermissionsStatus): PushPerm => (r.granted ? 'granted' : r.canAskAgain ? 'ask' : 'denied');

export function usePushPermission(): [PushPerm, () => void] {
  const [perm, setPerm] = useState<PushPerm>(Platform.OS === 'web' ? 'unsupported' : 'ask');
  const check = useCallback(() => {
    if (Platform.OS === 'web') return;
    Notifications.getPermissionsAsync().then((r) => setPerm(read(r)), () => {});
  }, []);
  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, [check]);
  const ask = useCallback(() => {
    if (Platform.OS === 'web') return;
    Notifications.requestPermissionsAsync().then((r) => setPerm(read(r)), () => {});
  }, []);
  return [perm, ask];
}
