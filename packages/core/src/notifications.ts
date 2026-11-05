/*
 * What See tells you, and where (V3Notifications): each kind of news, word for word, for push and email, its
 * default channels, how it bundles, and the link it opens. The web shows these in Activity; the native apps send
 * the same titles and lines as push, and open the same see:// links.
 */

export type NotificationKind = 'poll-results' | 'round-opens' | 'list-activity' | 'added-to-list' | 'weekly-recap' | 'report-closed';

export interface NotificationSpec {
  kind: NotificationKind;
  /** The line in Settings › Notifications */
  label: string;
  sub: string;
  /** When it is sent */
  when: string;
  defaults: { push: boolean; email: boolean };
  /** How a busy list is kept from flooding you */
  bundling: string;
  /** Can it be turned off? (Reports always answer something you did.) */
  optional: boolean;
}

export const NOTIFICATIONS: NotificationSpec[] = [
  {
    kind: 'poll-results',
    label: 'Poll results',
    sub: 'When a poll you voted in closes',
    when: 'A poll you voted in closes',
    defaults: { push: true, email: false },
    bundling: 'One per poll. Several in an hour: “3 polls you voted in have closed.”',
    optional: true,
  },
  {
    kind: 'round-opens',
    label: 'A bracket round opens',
    sub: 'In polls that run a round a day',
    when: 'A poll that plays a round a day',
    defaults: { push: true, email: false },
    bundling: 'One per poll per day, at the time the round opens.',
    optional: true,
  },
  {
    kind: 'list-activity',
    label: 'Someone joins or edits your list',
    sub: '',
    when: 'A join, a move, an add or a removal on a list you made',
    defaults: { push: true, email: true },
    bundling: 'Per list, at most one every 30 minutes: “@kemi and 2 others made 5 changes.”',
    optional: true,
  },
  {
    kind: 'added-to-list',
    label: 'Someone adds you to a list',
    sub: '',
    when: 'You are added to someone else’s list',
    defaults: { push: true, email: true },
    bundling: 'Every time. Who can add you is a Privacy setting.',
    optional: true,
  },
  {
    kind: 'weekly-recap',
    label: 'Weekly recap',
    sub: 'Sunday: how your charts moved',
    when: 'Sunday 18:00 local, only if something moved',
    defaults: { push: false, email: true },
    bundling: 'Once a week. Nothing moved: nothing sent.',
    optional: true,
  },
  {
    kind: 'report-closed',
    label: 'We looked at your report',
    sub: '',
    when: 'A report you sent is closed',
    defaults: { push: true, email: false },
    bundling: 'One per report. Always on: it answers something you did.',
    optional: false,
  },
];

/** The rules every message follows: the title is the thing, up to 40; the line says what happened, up to 110. */
export const TITLE_MAX = 40;
export const LINE_MAX = 110;

export interface Message {
  kind: NotificationKind;
  /** Push title: the poll question or the list name */
  title: string;
  /** Push line: what happened */
  line: string;
  /** Email subject */
  subject: string;
  /** Where it opens */
  link: string;
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const msg = (kind: NotificationKind, title: string, line: string, subject: string, link: string): Message => ({
  kind,
  title: clip(title, TITLE_MAX),
  line: clip(line, LINE_MAX),
  subject,
  link,
});

/** Each kind's words, as the board writes them. */
export const compose = {
  pollResults: (pollId: string, question: string, yourPick: string, won: boolean) =>
    msg('poll-results', question, `It’s closed. Your pick, ${yourPick}, ${won ? 'won' : 'didn’t win'}.`, `Results: ${question}`, `see://poll/${pollId}/results`),
  roundOpens: (pollId: string, question: string, round: number, left: number) =>
    msg('round-opens', question, `Round ${round} is open. ${left} left to choose from.`, `Round ${round} is open: ${question}`, `see://poll/${pollId}/play`),
  listActivity: (listId: string, listName: string, who: string[], changes: number, detail?: string) =>
    msg(
      'list-activity',
      listName,
      who.length > 1 ? `@${who[0]} and ${who.length - 1} ${who.length === 2 ? 'other' : 'others'} made ${changes} changes.` : `@${who[0]} ${detail ?? 'joined'}.`,
      `@${who[0]} joined ${listName}`,
      `see://list/${listId}`,
    ),
  addedToList: (listId: string, listName: string, by: string) =>
    msg('added-to-list', listName, `@${by} added you. Rank it with them.`, `@${by} added you to ${listName}`, `see://list/${listId}`),
  weeklyRecap: (moves: number, held?: string) =>
    msg('weekly-recap', 'Your week in See', `Your charts moved ${moves} places.${held ? ` ${held} held No. 1.` : ''}`, `Your week: ${moves} moves${held ? ', one No. 1 held' : ''}`, 'see://you/week'),
  reportClosed: () => msg('report-closed', 'Your report', 'We looked at what you reported and took it down. Thanks.', 'We looked at your report', 'see://you/activity'),
};

/** Never sent: ads, “we miss you”, streaks, follower counts, anything about someone you blocked or who blocked you. */
export const NEVER_SENT = ['Ads', '“We miss you.”', 'Streaks', 'Counts of followers', 'Anything about a person you blocked, or who blocked you'];

/** The default quiet hours: held, then delivered together when they end. */
export const QUIET_HOURS = ['Off', '22:00 to 08:00', '00:00 to 07:00'] as const;

/** A see:// link as an app path (the web and the native apps route the same way). */
export function routeOf(link: string): string {
  const p = link.replace(/^see:\/\//, '');
  if (p.startsWith('list/')) return `/app/l/${p.slice(5)}`;
  if (p.startsWith('poll/')) return '/app/polls';
  if (p.startsWith('you/activity')) return '/app/activity';
  if (p.startsWith('you')) return '/app/you';
  if (p.startsWith('u/')) return `/app/u/${p.slice(2)}`;
  if (p.startsWith('join/')) return `/app/join/${p.slice(5)}`;
  if (p.startsWith('t/')) return `/t/${p.slice(2)}`;
  if (p.startsWith('entry/')) return '/app/find';
  return '/app';
}

export interface ActivityItem {
  id: string;
  group: 'Today' | 'This week' | 'Earlier';
  icon: 'poll' | 'person' | 'eq';
  text: string;
  when: string;
  action: string;
  link: string;
  unread: boolean;
}

/** The Activity list the prototypes open on. Older than 30 days drops off. */
export const SEED_ACTIVITY: ActivityItem[] = [
  { id: 'a1', group: 'Today', icon: 'poll', text: 'Video of the year? has closed. Your pick, Lonely At The Top, won.', when: '2 h', action: 'See results', link: 'see://poll/p1/results', unread: true },
  { id: 'a2', group: 'Today', icon: 'person', text: '@kemi joined Summer in Lagos.', when: '4 h', action: 'Open the list', link: 'see://list/l2', unread: true },
  { id: 'a3', group: 'Today', icon: 'eq', text: '@ada moved Water to No. 1 in Videos of the year.', when: '6 h', action: 'Open the list', link: 'see://list/l1', unread: true },
  { id: 'a4', group: 'This week', icon: 'poll', text: 'Round 2 of Best film of 2025? is open.', when: 'Tue', action: 'Play it', link: 'see://poll/p2/play', unread: false },
  { id: 'a5', group: 'This week', icon: 'person', text: '@tunde added you to Goals of the season.', when: 'Mon', action: 'See @tunde', link: 'see://u/tunde', unread: false },
  { id: 'a6', group: 'This week', icon: 'eq', text: 'Your week: your charts moved 6 places. Lonely At The Top held No. 1.', when: 'Sun', action: 'Open the list', link: 'see://list/l1', unread: false },
  { id: 'a7', group: 'Earlier', icon: 'person', text: '@zainab joined Albums on repeat.', when: 'Oct 12', action: 'Open the list', link: 'see://list/l3', unread: false },
];
