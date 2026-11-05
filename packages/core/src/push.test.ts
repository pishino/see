import { describe, expect, it } from 'vitest';
import { NOTIFICATIONS, compose } from './notifications';
import { DEFAULT_SETTINGS } from './settings';
import { ALWAYS_SENT, deliver, expoMessage, inQuiet, isExpoToken, quietEnd, sendExpo } from './push';

const at = (h: number, m = 0) => new Date(2026, 10, 5, h, m);
const prefs = { notif: DEFAULT_SETTINGS.notif, quiet: '22:00 to 08:00', blocked: ['tunde'] };

describe('push delivery', () => {
  it('keeps always-sent in step with the kinds that cannot be turned off', () => {
    expect(ALWAYS_SENT).toEqual(NOTIFICATIONS.filter((n) => !n.optional).map((n) => n.kind));
  });

  it('knows quiet hours, across midnight', () => {
    expect(inQuiet('22:00 to 08:00', at(23))).toBe(true);
    expect(inQuiet('22:00 to 08:00', at(7, 59))).toBe(true);
    expect(inQuiet('22:00 to 08:00', at(8))).toBe(false);
    expect(inQuiet('Off', at(23))).toBe(false);
    expect(quietEnd('22:00 to 08:00', at(23)).getDate()).toBe(6);
    expect(quietEnd('22:00 to 08:00', at(3)).getHours()).toBe(8);
  });

  it('sends now, holds for quiet hours, skips what is off or about someone blocked', () => {
    const m = compose.addedToList('l2', 'Summer in Lagos', 'ada');
    expect(deliver(m, prefs, at(14))).toEqual({ at: at(14), held: false });
    expect(deliver(m, prefs, at(23))).toMatchObject({ held: true });
    expect(deliver(m, { ...prefs, notif: { ...prefs.notif, 'added-to-list': { push: false, email: true } } }, at(14))).toEqual({ skip: 'off' });
    expect(deliver(compose.addedToList('l2', 'Summer in Lagos', 'tunde'), prefs, at(14), ['@tunde'])).toEqual({ skip: 'blocked' });
    // a report's answer always goes
    const off = Object.fromEntries(Object.entries(prefs.notif).map(([k, v]) => [k, { ...v, push: false }])) as typeof prefs.notif;
    expect(deliver(compose.reportClosed(), { ...prefs, notif: off }, at(14))).toMatchObject({ held: false });
  });

  it('builds Expo’s message: polls on their own channel, the link in data', () => {
    const e = expoMessage('ExponentPushToken[abc]', compose.pollResults('p1', 'Video of the year?', 'Water', false));
    expect(e).toMatchObject({ title: 'Video of the year?', channelId: 'polls', data: { link: 'see://poll/p1/results', kind: 'poll-results' } });
    expect(isExpoToken('ExponentPushToken[abc]')).toBe(true);
    expect(isExpoToken('abc')).toBe(false);
  });

  it('posts to the push service and reads its tickets', async () => {
    let sent: unknown;
    const fake = (async (_u: string, init: RequestInit) => {
      sent = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ data: [{ status: 'ok', id: 't1' }] }), { status: 200 });
    }) as typeof fetch;
    const r = await sendExpo([expoMessage('ExponentPushToken[abc]', compose.weeklyRecap(6))], { fetch: fake });
    expect(r).toEqual([{ status: 'ok', id: 't1' }]);
    expect((sent as { body: string }[])[0].body).toBe('Your charts moved 6 places.');
  });
});
