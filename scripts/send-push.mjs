#!/usr/bin/env node
/*
 * Send a See notification to a phone, through Expo's push service (which hands it to Apple and Google).
 * The words and rules are the apps' own, from packages/core (compose, deliver, expoMessage).
 *
 *   node scripts/send-push.mjs <ExponentPushToken[…]> <kind> [--dry] [--quiet "22:00 to 08:00"]
 *
 * kind: poll-results | round-opens | list-activity | added-to-list | weekly-recap | report-closed
 * The phone shows its token in the console when it registers. EXPO_ACCESS_TOKEN is used if your project
 * requires it. Needs Node 22.18 or later (it runs the TypeScript as it is).
 */
import { compose } from '../packages/core/src/notifications.ts';
import { deliver, expoMessage, isExpoToken, sendExpo } from '../packages/core/src/push.ts';

const [token, kind, ...rest] = process.argv.slice(2);
const dry = rest.includes('--dry');
const qi = rest.indexOf('--quiet');
const quiet = qi >= 0 ? rest[qi + 1] : 'Off';

const SAMPLES = {
  'poll-results': () => compose.pollResults('p1', 'Video of the year?', 'Lonely At The Top', true),
  'round-opens': () => compose.roundOpens('p4', 'Best film of 2025?', 2, 8),
  'list-activity': () => compose.listActivity('l2', 'Summer in Lagos', ['kemi'], 1),
  'added-to-list': () => compose.addedToList('l5', 'Goals of the season', 'tunde'),
  'weekly-recap': () => compose.weeklyRecap(6, 'Lonely At The Top'),
  'report-closed': () => compose.reportClosed(),
};

if (!token || !SAMPLES[kind]) {
  console.error(`Usage: node scripts/send-push.mjs <ExponentPushToken[…]> <${Object.keys(SAMPLES).join(' | ')}> [--dry] [--quiet "22:00 to 08:00"]`);
  process.exit(1);
}
if (!isExpoToken(token)) console.warn('That does not look like an Expo push token; the push service will say so.');

const m = SAMPLES[kind]();
const all = { push: true, email: true };
const prefs = { notif: Object.fromEntries(Object.keys(SAMPLES).map((k) => [k, all])), quiet, blocked: [] };
const when = deliver(m, prefs, new Date());
if ('skip' in when) {
  console.log(`Not sent: ${when.skip}.`);
  process.exit(0);
}
const msg = expoMessage(token, m);
if (when.held) console.log(`Quiet hours: a server would hold this until ${when.at.toLocaleTimeString()}. Sending now because you asked.`);
console.log(JSON.stringify(msg, null, 2));
if (dry) process.exit(0);

try {
  const tickets = await sendExpo([msg], { accessToken: process.env.EXPO_ACCESS_TOKEN });
  for (const t of tickets) console.log(t.status === 'ok' ? `Sent: ticket ${t.id}` : `Not sent: ${t.message}`);
} catch (e) {
  console.error(`Not sent: ${e.cause?.message ?? e.message}. (Behind a proxy? Run with NODE_USE_ENV_PROXY=1.)`);
  process.exit(1);
}
