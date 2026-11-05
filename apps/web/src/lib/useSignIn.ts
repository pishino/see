import { useSettings } from '@see/core/react';
import { KEYS, appleLinked, signInWithApple, signInWithGoogle, type Identity } from './connect';

/**
 * Continue with Google or Apple: the real sign-in when this build has the key, so your name and email come from
 * them; without a key, it carries on as the demo does. Until See has a server, the session lives on this device.
 */
export function useSignIn(toast: (s: string) => void) {
  const { settings, set } = useSettings();
  return async (via: 'Google' | 'Apple', then: () => void) => {
    const real = via === 'Google' ? !!KEYS.YouTube : appleLinked();
    if (!real) return then();
    try {
      const me: Identity = via === 'Google' ? await signInWithGoogle() : await signInWithApple();
      if (me.name) set('name', me.name.slice(0, 30));
      if (me.email) set('email', me.email);
      set('signIn', { ...settings.signIn, [via]: true });
      toast(`Signed in with ${via}${me.email ? ` as ${me.email}` : ''}`);
      then();
    } catch (e) {
      toast((e as Error).message || `${via} didn’t sign you in. Nothing was changed.`);
    }
  };
}
