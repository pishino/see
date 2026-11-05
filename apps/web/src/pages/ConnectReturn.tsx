import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSettings, useStore } from '@see/core/react';
import { useToast } from '../components/Toast';
import { finishConnect } from '../lib/connect';

/** Back from Spotify or Reddit: finish the sign-in, read, and return to Connected services. */
export function ConnectReturn() {
  const loc = useLocation();
  const store = useStore();
  const { settings, set } = useSettings();
  const toast = useToast();
  const [done, setDone] = useState(false);
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    finishConnect(loc.search, location.hash)
      .then(({ name, entries }) => {
        store.addFound(entries);
        set('conn', { ...settings.conn, [name]: true });
        set('lastConn', name);
        toast(entries.length ? `${name} is connected · ${entries.length} found to rank` : `${name} is connected · nothing to rank from it yet`);
      })
      .catch((e: Error) => toast(e.message))
      .finally(() => setDone(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return done ? <Navigate to="/app/settings/services" replace /> : <div style={{ padding: 40, color: 'var(--see-text-2)' }}>Connecting…</div>;
}
