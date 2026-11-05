/*
 * Ads inside what is there, no tiers (V3Ads, V3AdsMotion). Everyone gets every chart, poll and list size; ads pay
 * for that. An ad has no number: it can't be ranked, added to a slot or voted into a chart, and never sits in
 * anyone's top 3. One ad on a screen at most, always tagged AD in grey; ads never wear flare or violet. Advertisers
 * get counts and shares, never names, lists or votes. Video ads start muted, 6–15 s, two loops at most, stop moving
 * while you drag, type or vote, and hold a still frame for reduced motion.
 * The advertisers here are invented for the boards (Ola Dara, Ember, Northline Records, Harbour Cinemas).
 */
export type AdPlace = 'sponsor' | 'video' | 'search' | 'buy' | 'spot' | 'poll';

export interface Ad {
  id: string;
  place: AdPlace;
  /** the category it belongs to, for sponsor lines and video bands */
  cat?: string;
  /** the Settings › Ads topic it falls under */
  topic: 'Music launches' | 'Films and cinema' | 'TV' | 'Live events' | 'Tech and audio';
  name: string;
  line: string;
  url: string;
  /** search: the words it shows for */
  match?: string[];
  /** buy: the catalogue ids it shows on */
  on?: string[];
}

export const ADS: Ad[] = [
  { id: 'sp-music', place: 'sponsor', cat: 'MUSIC', topic: 'Music launches', name: 'Northline Records', line: 'Music this week, with Northline Records', url: 'https://example.com/northline' },
  { id: 'vid-music', place: 'video', cat: 'MUSIC', topic: 'Music launches', name: 'Ola Dara · Ember', line: 'Ember, the new album. Out Friday.', url: 'https://example.com/ember' },
  { id: 'vid-movies', place: 'video', cat: 'MOVIES', topic: 'Films and cinema', name: 'Harbour Cinemas', line: 'Now showing in Lekki and Ikeja', url: 'https://example.com/harbour' },
  { id: 'search-ember', place: 'search', topic: 'Music launches', name: 'Ember · Ola Dara', line: 'The new album. Opens on its page.', url: 'https://example.com/ember', match: ['ember', 'ola', 'dara', 'afrobeats', 'album'] },
  { id: 'buy-sinners', place: 'buy', topic: 'Films and cinema', name: 'Harbour Cinemas', line: 'Showtimes · Lekki and Ikeja · from ₦6,500', url: 'https://example.com/harbour', on: ['f0'] },
  { id: 'buy-asake', place: 'buy', topic: 'Live events', name: 'Eko Live', line: 'Tickets · Asake in Lagos · from ₦25,000', url: 'https://example.com/eko', on: ['v0', 's0', 'a0'] },
  { id: 'spot-ember', place: 'spot', topic: 'Music launches', name: 'Ola Dara · Ember', line: 'Ember. Out Friday, everywhere you listen.', url: 'https://example.com/ember' },
  { id: 'poll-northline', place: 'poll', cat: 'MUSIC', topic: 'Music launches', name: 'Northline Records', line: 'Which Ember track opens the night?', url: 'https://example.com/northline' },
];

/** The ad for a place, if its topic is on in Settings › Ads. Ads follow the page you are on, never you. */
export function adFor(place: AdPlace, topics: Record<string, boolean>, where: { cat?: string; q?: string; xid?: string } = {}): Ad | null {
  return (
    ADS.find((a) => {
      if (a.place !== place || topics[a.topic] === false) return false;
      if (a.cat && where.cat !== undefined && a.cat !== where.cat) return false;
      if (place === 'search') return !!where.q && a.match!.some((m) => where.q!.toLowerCase().includes(m));
      if (place === 'buy') return !!where.xid && a.on!.includes(where.xid);
      return true;
    }) ?? null
  );
}

/** Spots between previews: skip after 5 s, never inside a preview, at most one every 30 minutes. */
export const SPOT = { seconds: 15, skipAfter: 5, everyMs: 30 * 60_000 };
export const spotDue = (lastAt: number, now: number) => now - lastAt >= SPOT.everyMs;
