/*
 * Push delivery (V3Notifications): who gets a message, when, and the exact payload for Expo's push service, which
 * hands it to Apple and Google. Shared by the phones (registering, opening) and whatever sends (a server, or
 * scripts/send-push.mjs). Only type imports here, so Node can run this file as it is.
 */
import type { Message, NotificationKind } from './notifications';

/** What delivery needs from someone's settings. */
export interface PushPrefs {
  notif: Record<NotificationKind, { push: boolean; email: boolean }>;
  /** 'Off', or 'HH:MM to HH:MM' in their own time */
  quiet: string;
  blocked: string[];
}

/** Always sent: it answers something they did (NOTIFICATIONS marks these not optional; a test keeps the two in step). */
export const ALWAYS_SENT: NotificationKind[] = ['report-closed'];

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Quiet hours as [start, end] in minutes after midnight, or null when off. */
export function quietWindow(quiet: string): [number, number] | null {
  const m = /^(\d{2}:\d{2}) to (\d{2}:\d{2})$/.exec(quiet);
  return m ? [minutes(m[1]), minutes(m[2])] : null;
}

/** Is `now` (their local time) inside their quiet hours? Windows can cross midnight. */
export function inQuiet(quiet: string, now: Date): boolean {
  const w = quietWindow(quiet);
  if (!w) return false;
  const t = now.getHours() * 60 + now.getMinutes();
  return w[0] <= w[1] ? t >= w[0] && t < w[1] : t >= w[0] || t < w[1];
}

/** When their quiet hours end next: held messages arrive together then. */
export function quietEnd(quiet: string, now: Date): Date {
  const w = quietWindow(quiet);
  const end = new Date(now);
  if (!w) return end;
  end.setHours(Math.floor(w[1] / 60), w[1] % 60, 0, 0);
  if (end <= now) end.setDate(end.getDate() + 1);
  return end;
}

export type Delivery = { at: Date; held: boolean } | { skip: 'off' | 'blocked' };

/**
 * Whether and when to push a message. Never anything about a person they blocked; nothing whose push switch is off
 * (unless it always goes); inside quiet hours it waits for their end. `about` is who the message is about.
 */
export function deliver(m: Message, p: PushPrefs, now: Date = new Date(), about: string[] = []): Delivery {
  if (about.some((h) => p.blocked.includes(h.replace(/^@/, '')))) return { skip: 'blocked' };
  if (!ALWAYS_SENT.includes(m.kind) && !p.notif[m.kind]?.push) return { skip: 'off' };
  if (inQuiet(p.quiet, now)) return { at: quietEnd(p.quiet, now), held: true };
  return { at: now, held: false };
}

export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: { link: string; kind: NotificationKind };
  sound: 'default';
  priority: 'high';
  /** Android: polls arrive on their own channel */
  channelId: 'default' | 'polls';
}

/** The message as Expo's push service takes it: the title is the thing, the body what happened, the link in data. */
export function expoMessage(to: string, m: Message): ExpoMessage {
  return {
    to,
    title: m.title,
    body: m.line,
    data: { link: m.link, kind: m.kind },
    sound: 'default',
    priority: 'high',
    channelId: m.kind === 'poll-results' || m.kind === 'round-opens' ? 'polls' : 'default',
  };
}

export const isExpoToken = (t: string) => /^Expo(nent)?PushToken\[[^\]]+\]$/.test(t);

/** Send to Expo's push service; returns what it said about each message. */
export async function sendExpo(
  msgs: ExpoMessage[],
  opts: { fetch?: typeof fetch; accessToken?: string } = {},
): Promise<{ status: 'ok' | 'error'; id?: string; message?: string }[]> {
  const f = opts.fetch ?? fetch;
  const res = await f(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...(opts.accessToken ? { authorization: `Bearer ${opts.accessToken}` } : {}),
    },
    body: JSON.stringify(msgs),
  });
  const json = (await res.json()) as { data?: { status: 'ok' | 'error'; id?: string; message?: string }[]; errors?: { message: string }[] };
  if (!res.ok || !json.data) throw new Error(json.errors?.map((e) => e.message).join('; ') || `Push service said ${res.status}`);
  return json.data;
}
