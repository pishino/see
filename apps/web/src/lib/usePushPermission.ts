import { useCallback, useState } from 'react';

type Perm = 'granted' | 'denied' | 'default' | 'unsupported';

function current(): Perm {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/** Whether this browser lets See send push, and a way to ask the first time a push switch goes on. */
export function usePushPermission(): [Perm, () => void] {
  const [perm, setPerm] = useState<Perm>(current);
  const ask = useCallback(() => {
    if (current() !== 'default') return;
    Notification.requestPermission()
      .then((p) => setPerm(p))
      .catch(() => setPerm(current()));
  }, []);
  return [perm, ask];
}
