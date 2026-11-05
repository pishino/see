/*
 * Settings (V3Settings): ten sections, all live. No Save button: a change is the change. Every section line says
 * what it is set to now. Platform-free; each platform keeps the values in its own storage.
 */
import { NOTIFICATIONS, QUIET_HOURS, type NotificationKind } from './notifications';

export type SectionId = 'profile' | 'account' | 'services' | 'privacy' | 'notif' | 'lists' | 'playback' | 'display' | 'ads' | 'help';
export type Appearance = 'Dark' | 'Light' | 'Flare' | 'Match device';

export interface Settings {
  colour: string;
  uploaded: boolean;
  /** your photo as 24 × 24 tones (one digit each), or null for the made-up picture */
  photo: string | null;
  name: string;
  handle: string;
  /** where sign-in codes go; from Google or Apple when you sign in with them */
  email: string;
  bio: string;
  topcats: boolean;
  signIn: Record<string, boolean>;
  devicesSignedOut: string[];
  conn: Record<string, boolean>;
  lastConn: string | null;
  lists: 'Everyone' | 'Your people' | 'Only you';
  profile: 'Public' | 'Hidden from search';
  canAdd: 'Anyone' | 'Your people' | 'No one';
  showVotes: boolean;
  compare: boolean;
  notif: Record<NotificationKind, { push: boolean; email: boolean }>;
  quiet: (typeof QUIET_HOURS)[number];
  size: '5' | '10' | '20' | '50';
  timeFrame: 'All time' | 'This year' | 'This month';
  smart: boolean;
  repeat: boolean;
  playOrder: string[];
  autoplay: boolean;
  dataSaver: boolean;
  previewsIn: 'Corner player' | 'Full screen';
  appearance: Appearance;
  reduceMotion: boolean;
  field: boolean;
  text: 'Default' | 'Larger' | 'Largest';
  rings: boolean;
  adTopics: Record<string, boolean>;
  rankAds: boolean;
  /** Everyone you blocked (Settings › Privacy lists them) */
  blocked: string[];
  /** People whose pages you follow (and makers, as m:<name>) */
  following: string[];
  /** other people's lists you keep up with: handle/name */
  savedLists: string[];
}

export const COLOURS: [string, string][] = [
  ['Flare', '#FF4A1C'],
  ['Violet', '#7C6BFF'],
  ['Teal', '#2EC4B6'],
  ['Gold', '#F2B544'],
  ['Pink', '#E8508A'],
  ['Blue', '#3D8BFF'],
  ['Green', '#7FD18B'],
  ['Chalk', '#C9CFCC'],
];

/** The services See can read, by what they feed. */
export const SERVICES: { name: string; feeds: string; services: string[] }[] = [
  { name: 'Music', feeds: 'Feeds Music and Artists', services: ['Spotify', 'Apple Music', 'YouTube', 'Deezer'] },
  { name: 'Film and TV', feeds: 'Feeds Movies and TV', services: ['Netflix', 'Letterboxd', 'IMDb', 'Prime Video'] },
  { name: 'Social', feeds: 'Feeds Artists', services: ['X', 'Instagram', 'TikTok', 'Reddit'] },
];

export const READS: Record<string, string> = {
  Spotify: 'your listening history',
  'Apple Music': 'your library and plays',
  YouTube: 'your watch history and likes',
  Deezer: 'your favourites',
  Netflix: 'your viewing history',
  Letterboxd: 'your diary and ratings',
  IMDb: 'your ratings and watchlist',
  'Prime Video': 'your watch history',
  X: 'who you follow',
  Instagram: 'your saved posts',
  TikTok: 'your liked videos',
  Reddit: 'your upvotes',
};

export const DEVICES: [string, string, boolean][] = [
  ['This device', 'Lagos · active now', true],
  ['MacBook', 'Abuja · 2 days ago', false],
  ['iPad', 'Abuja · 3 weeks ago', false],
];

export const DEFAULT_SETTINGS: Settings = {
  colour: '#FF4A1C',
  uploaded: false,
  photo: null,
  name: 'Joey',
  handle: '@joey',
  email: 'joey@example.com',
  bio: 'Ranks music, films and TV',
  topcats: true,
  signIn: { Google: true, 'Email code': true, Apple: false },
  devicesSignedOut: [],
  conn: {},
  lastConn: null,
  lists: 'Your people',
  profile: 'Public',
  canAdd: 'Your people',
  showVotes: false,
  compare: true,
  notif: Object.fromEntries(NOTIFICATIONS.map((n) => [n.kind, { ...n.defaults }])) as Settings['notif'],
  quiet: '22:00 to 08:00',
  size: '10',
  timeFrame: 'All time',
  smart: true,
  repeat: true,
  playOrder: ['YouTube', 'Spotify', 'Apple Music'],
  autoplay: true,
  dataSaver: false,
  previewsIn: 'Corner player',
  appearance: 'Dark',
  reduceMotion: false,
  field: true,
  text: 'Default',
  rings: false,
  adTopics: { 'Music launches': true, 'Films and cinema': true, TV: true, 'Live events': true, 'Tech and audio': false },
  // personal ads are off until you turn them on (V3Legal)
  rankAds: false,
  blocked: [],
  following: [],
  savedLists: [],
};

export interface Section {
  id: SectionId;
  title: string;
  blurb: string;
}

export const SECTIONS: Section[] = [
  { id: 'profile', title: 'Profile', blurb: 'What people see when they open your page' },
  { id: 'account', title: 'Account', blurb: 'How you get in, and getting out' },
  { id: 'services', title: 'Connected services', blurb: 'What See can read to fill your lists' },
  { id: 'privacy', title: 'Privacy', blurb: 'Who sees what you rank' },
  { id: 'notif', title: 'Notifications', blurb: 'What is worth telling you' },
  { id: 'lists', title: 'Lists', blurb: 'How a new list starts' },
  { id: 'playback', title: 'Playback', blurb: 'How previews play' },
  { id: 'display', title: 'Display and access', blurb: 'Motion, the field and text size' },
  { id: 'ads', title: 'Ads', blurb: 'Ads pay for one See for everyone' },
  { id: 'help', title: 'Help and legal', blurb: 'Help, rules and the small print' },
];

export const SECTION_GROUPS: [string, SectionId[]][] = [
  ['You', ['profile', 'account', 'services']],
  ['Your See', ['privacy', 'notif', 'lists', 'playback']],
  ['', ['display', 'ads', 'help']],
];

export const VERSION = 'See 3.5 · build 2610';

export function colourName(hex: string): string {
  return COLOURS.find((c) => c[1].toLowerCase() === hex.toLowerCase())?.[0] ?? 'Your';
}

/** What a section is set to now, for its line in Settings. */
export function sectionSummary(id: SectionId, s: Settings): string {
  const devices = DEVICES.filter((d) => !s.devicesSignedOut.includes(d[0])).length;
  const connected = Object.values(s.conn).filter(Boolean).length;
  switch (id) {
    case 'profile':
      return `${s.handle} · ${colourName(s.colour)} picture`;
    case 'account':
      return `${s.email} · ${devices} ${devices === 1 ? 'device' : 'devices'}`;
    case 'services':
      return `${connected} connected`;
    case 'privacy':
      return `Lists: ${s.lists}`;
    case 'notif':
      return s.quiet === 'Off' ? 'No quiet hours' : `Quiet ${s.quiet}`;
    case 'lists':
      return `Top ${s.size} · ${s.timeFrame}`;
    case 'playback':
      return `${s.playOrder[0]} first`;
    case 'display':
      return `${s.reduceMotion ? 'Reduced motion' : 'Motion on'} · ${s.text} text`;
    case 'ads':
      return 'Topics and why';
    case 'help':
      return 'Version 3.5';
  }
}

/** Accept saved settings, filling anything missing (or added since) from the defaults. */
export function withDefaults(v: unknown): Settings {
  if (!v || typeof v !== 'object') return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(v as Partial<Settings>) };
}
