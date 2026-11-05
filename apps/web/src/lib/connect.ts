/*
 * Real connections, from the browser, where a service allows it. Each one needs its app key in the build
 * (docs/integrations.md says where to get it); without one, Settings says this build isn't linked yet.
 *   Spotify      VITE_SPOTIFY_CLIENT_ID    Authorization Code with PKCE (no secret in the browser)
 *   YouTube      VITE_GOOGLE_CLIENT_ID     Google Identity Services token client
 *   Reddit       VITE_REDDIT_CLIENT_ID     an "installed app": implicit grant
 *   Apple Music  VITE_APPLE_MUSIC_TOKEN    MusicKit JS with a developer token
 * Tokens stay in this tab's sessionStorage and are only used to read; See never posts for you.
 */
import { fromAppleMusic, fromReddit, fromSpotify, fromYouTube, type Entry } from '@see/core';

const env = import.meta.env as Record<string, string | undefined>;
export const KEYS: Record<string, string | undefined> = {
  Spotify: env.VITE_SPOTIFY_CLIENT_ID,
  YouTube: env.VITE_GOOGLE_CLIENT_ID,
  Reddit: env.VITE_REDDIT_CLIENT_ID,
  'Apple Music': env.VITE_APPLE_MUSIC_TOKEN,
};
export const linked = (name: string) => !!KEYS[name];

const back = (name: string) => `${location.origin}${import.meta.env.BASE_URL}connect/${name.toLowerCase().replace(/ /g, '-')}`;
const random = (n = 48) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
const b64url = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function loadScript(src: string): Promise<void> {
  return new Promise((ok, fail) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => fail(new Error('That sign-in didn’t load. Check your connection and try again.'));
    document.head.appendChild(s);
  });
}

async function getJson<T>(url: string, token: string): Promise<T> {
  const r = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'The service said no. Connect again.' : `The service said ${r.status}.`);
  return r.json() as Promise<T>;
}

/* ---------------------------------------------------------------- start: leaves for the service, or opens its window */

/** Start connecting. Redirect flows leave the page and come back to /connect/<service>; popups resolve here. */
export async function startConnect(name: string): Promise<Entry[] | 'redirect'> {
  const key = KEYS[name];
  if (!key) throw new Error(`This build isn’t linked to ${name} yet.`);
  if (name === 'Spotify') {
    const verifier = random(64);
    const state = random(16);
    sessionStorage.setItem('see.oauth', JSON.stringify({ name, verifier, state }));
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    const q = new URLSearchParams({ client_id: key, response_type: 'code', redirect_uri: back(name), scope: 'user-top-read', code_challenge_method: 'S256', code_challenge: challenge, state });
    location.assign(`https://accounts.spotify.com/authorize?${q}`);
    return 'redirect';
  }
  if (name === 'Reddit') {
    const state = random(16);
    sessionStorage.setItem('see.oauth', JSON.stringify({ name, state }));
    const q = new URLSearchParams({ client_id: key, response_type: 'token', state, redirect_uri: back(name), scope: 'identity history' });
    location.assign(`https://www.reddit.com/api/v1/authorize?${q}`);
    return 'redirect';
  }
  if (name === 'YouTube') {
    const token = await googleToken('https://www.googleapis.com/auth/youtube.readonly');
    return readYouTube(token);
  }
  if (name === 'Apple Music') {
    await loadScript('https://js-cdn.music.apple.com/musickit/v3/musickit.js');
    const MK = (window as unknown as { MusicKit: { configure(o: unknown): Promise<unknown>; getInstance(): { authorize(): Promise<string>; api: { music(path: string, q?: unknown): Promise<{ data: unknown }> } } } }).MusicKit;
    await MK.configure({ developerToken: key, app: { name: 'See', build: '1' } });
    const mk = MK.getInstance();
    await mk.authorize();
    const r = await mk.api.music('/v1/me/recent/played/tracks', { limit: 30 });
    return fromAppleMusic(r.data as Parameters<typeof fromAppleMusic>[0]);
  }
  throw new Error(`${name} can’t be connected from here.`);
}

/** Google's token client: a Google window over the page, no redirect. Also used to sign in. */
export async function googleToken(scope: string): Promise<string> {
  const key = KEYS.YouTube;
  if (!key) throw new Error('This build isn’t linked to Google yet.');
  await loadScript('https://accounts.google.com/gsi/client');
  const g = (window as unknown as { google: { accounts: { oauth2: { initTokenClient(o: unknown): { requestAccessToken(): void } } } } }).google;
  return new Promise((ok, fail) => {
    const c = g.accounts.oauth2.initTokenClient({
      client_id: key,
      scope,
      callback: (r: { access_token?: string; error?: string }) => (r.access_token ? ok(r.access_token) : fail(new Error('Google didn’t connect. Nothing was changed.'))),
      error_callback: () => fail(new Error('Google didn’t connect. The sign-in closed before it finished. Nothing was changed.')),
    });
    c.requestAccessToken();
  });
}

async function readYouTube(token: string): Promise<Entry[]> {
  return fromYouTube(await getJson('https://www.googleapis.com/youtube/v3/videos?myRating=like&part=snippet&maxResults=40', token));
}

/* ---------------------------------------------------------------- finish: back from the service */

/** On /connect/<service>: finish the sign-in and read. */
export async function finishConnect(search: string, hash: string): Promise<{ name: string; entries: Entry[] }> {
  const saved = JSON.parse(sessionStorage.getItem('see.oauth') ?? 'null') as { name: string; verifier?: string; state: string } | null;
  sessionStorage.removeItem('see.oauth');
  if (!saved) throw new Error('That sign-in had already finished. Connect again from Settings.');
  const q = new URLSearchParams(search);
  const h = new URLSearchParams(hash.replace(/^#/, ''));
  if (q.get('error') || h.get('error')) throw new Error(`${saved.name} didn’t connect. The sign-in closed before it finished. Nothing was changed.`);
  if ((q.get('state') ?? h.get('state')) !== saved.state) throw new Error('That sign-in didn’t match. Nothing was changed; connect again.');

  if (saved.name === 'Spotify') {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: q.get('code') ?? '', redirect_uri: back('Spotify'), client_id: KEYS.Spotify ?? '', code_verifier: saved.verifier ?? '' }),
    });
    const tok = (await r.json()) as { access_token?: string };
    if (!tok.access_token) throw new Error('Spotify didn’t connect. Nothing was changed.');
    return { name: 'Spotify', entries: fromSpotify(await getJson('https://api.spotify.com/v1/me/top/tracks?limit=40&time_range=medium_term', tok.access_token)) };
  }
  if (saved.name === 'Reddit') {
    const token = h.get('access_token') ?? '';
    const me = await getJson<{ name: string }>('https://oauth.reddit.com/api/v1/me', token);
    return { name: 'Reddit', entries: fromReddit(await getJson(`https://oauth.reddit.com/user/${me.name}/upvoted?limit=100&raw_json=1`, token)) };
  }
  throw new Error('Unknown sign-in.');
}

/* ---------------------------------------------------------------- signing in to See */

export interface Identity {
  name: string;
  email: string;
  via: 'Google' | 'Apple';
}

/** Sign in with Google: who you are, from Google. Until See has a server, the session lives on this device. */
export async function signInWithGoogle(): Promise<Identity> {
  const token = await googleToken('openid email profile');
  const me = await getJson<{ name?: string; email?: string }>('https://www.googleapis.com/oauth2/v3/userinfo', token);
  return { name: me.name ?? '', email: me.email ?? '', via: 'Google' };
}

/** Sign in with Apple (VITE_APPLE_SERVICES_ID): Apple's window; the name comes only the first time. */
export async function signInWithApple(): Promise<Identity> {
  const id = env.VITE_APPLE_SERVICES_ID;
  if (!id) throw new Error('This build isn’t linked to Apple yet.');
  await loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');
  const A = (window as unknown as { AppleID: { auth: { init(o: unknown): void; signIn(): Promise<{ authorization: { id_token: string }; user?: { name?: { firstName?: string; lastName?: string } } }> } } }).AppleID;
  A.auth.init({ clientId: id, scope: 'name email', redirectURI: back('Apple'), usePopup: true });
  const r = await A.auth.signIn();
  const claims = JSON.parse(atob(r.authorization.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { email?: string };
  const n = r.user?.name;
  return { name: [n?.firstName, n?.lastName].filter(Boolean).join(' '), email: claims.email ?? '', via: 'Apple' };
}
export const appleLinked = () => !!env.VITE_APPLE_SERVICES_ID;
