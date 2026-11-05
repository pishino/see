/*
 * Connected services (V3Settings › Connected services, V3AuthWebConnect): what See can read to fill your lists,
 * and how. Each service is honest about what it allows: a real sign-in (OAuth) where the service lets an app read
 * from the browser or phone, a file you download from the service where that's the only door, and plainly "not
 * yet" where it needs See's own server or the service doesn't open the data at all.
 * See only reads; it never posts for you.
 */
import type { Entry, Kind } from './seed';

export type How = 'oauth' | 'import' | 'server' | 'none';

export interface Service {
  name: string;
  how: How;
  /** what See reads, in Settings' words */
  reads: string;
  /** source key for entries it fills (sp, yt…) */
  key: string;
  /** for imports: how to get the file */
  file?: string;
  /** for server / none: why, in one line */
  why?: string;
}

export const CONNECTIONS: Service[] = [
  { name: 'Spotify', how: 'oauth', key: 'sp', reads: 'your top tracks' },
  { name: 'Apple Music', how: 'oauth', key: 'am', reads: 'your recently played' },
  { name: 'YouTube', how: 'oauth', key: 'yt', reads: 'your liked videos' },
  { name: 'Deezer', how: 'none', key: 'dz', reads: 'your favourites', why: 'Deezer isn’t taking new apps on its developer site, so See can’t sign in to it yet.' },
  { name: 'Netflix', how: 'import', key: 'nf', reads: 'your viewing history', file: 'On Netflix: Account › your profile › Viewing activity › Download all. Then choose that file here.' },
  { name: 'Letterboxd', how: 'import', key: 'lb', reads: 'your diary and ratings', file: 'On Letterboxd: Settings › Import & export › Export your data. Choose watched.csv, ratings.csv or diary.csv from it.' },
  { name: 'IMDb', how: 'import', key: 'im', reads: 'your ratings', file: 'On IMDb: Your ratings › ⋯ › Export. Then choose that file here.' },
  { name: 'Prime Video', how: 'none', key: 'pv', reads: 'your watch history', why: 'Prime Video doesn’t let apps read what you watched, and has no file to download.' },
  { name: 'X', how: 'server', key: 'x', reads: 'who you follow', why: 'Reading who you follow needs See’s server and X’s paid API.' },
  { name: 'Instagram', how: 'none', key: 'ig', reads: 'your saved posts', why: 'Instagram doesn’t let apps read personal accounts’ saved posts.' },
  { name: 'TikTok', how: 'none', key: 'tt', reads: 'your liked videos', why: 'TikTok doesn’t let apps read your liked videos.' },
  { name: 'Reddit', how: 'oauth', key: 'rd', reads: 'your upvotes' },
];

export const connectionOf = (name: string) => CONNECTIONS.find((c) => c.name === name);

const found = (key: string, id: string, t: string, m: string, k: Kind, extra: Partial<Entry> = {}): Entry => ({
  id: `${key}:${id}`,
  t: t.slice(0, 120),
  m: m.slice(0, 80),
  a: '',
  k,
  tags: '',
  src: [key],
  y: '',
  g: '',
  ...extra,
});

/* ---------------------------------------------------------------- what each service returns, as things to rank */

/** Spotify: GET /v1/me/top/tracks */
export function fromSpotify(json: { items?: { id: string; name: string; artists?: { name: string }[]; album?: { name?: string; release_date?: string } }[] }): Entry[] {
  return (json.items ?? []).map((x) => found('sp', x.id, x.name, x.artists?.map((a) => a.name).join(', ') ?? '', 'song', { a: x.album?.name ?? '', y: x.album?.release_date?.slice(0, 4) ?? '' }));
}

/** YouTube: GET /youtube/v3/videos?myRating=like&part=snippet */
export function fromYouTube(json: { items?: { id: string; snippet?: { title?: string; channelTitle?: string; publishedAt?: string } }[] }): Entry[] {
  return (json.items ?? []).map((x) =>
    found('yt', x.id, x.snippet?.title ?? '', (x.snippet?.channelTitle ?? '').replace(/ - Topic$|VEVO$/, '').trim(), 'video', { y: x.snippet?.publishedAt?.slice(0, 4) ?? '' }),
  );
}

/** Apple Music: GET /v1/me/recent/played/tracks */
export function fromAppleMusic(json: { data?: { id: string; attributes?: { name?: string; artistName?: string; albumName?: string; releaseDate?: string } }[] }): Entry[] {
  return (json.data ?? []).map((x) => found('am', x.id, x.attributes?.name ?? '', x.attributes?.artistName ?? '', 'song', { a: x.attributes?.albumName ?? '', y: x.attributes?.releaseDate?.slice(0, 4) ?? '' }));
}

/** Reddit: GET /user/{name}/upvoted. Only what can be ranked: music and video links (YouTube, Spotify). */
export function fromReddit(json: { data?: { children?: { data: { id: string; title: string; url?: string; subreddit?: string; media?: { oembed?: { author_name?: string; title?: string } } } }[] } }): Entry[] {
  return (json.data?.children ?? [])
    .map((c) => c.data)
    .filter((d) => /youtube\.com|youtu\.be|open\.spotify\.com/.test(d.url ?? ''))
    .map((d) => {
      const spotify = /spotify/.test(d.url ?? '');
      const o = d.media?.oembed;
      return found('rd', d.id, o?.title ?? d.title, o?.author_name ?? `r/${d.subreddit ?? ''}`, spotify ? 'song' : 'video', { src: ['rd', spotify ? 'sp' : 'yt'] });
    });
}

/** A small CSV reader: quoted fields, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const byHeader = (rows: string[][]) => {
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])) as Record<string, string>);
};

/** Netflix's viewing activity (Title, Date). Episodes ("Show: Season 1: Ep") fold into their show, once each. */
export function fromNetflixCsv(text: string): Entry[] {
  const seen = new Map<string, Entry>();
  for (const r of byHeader(parseCsv(text))) {
    const title = r.title ?? '';
    if (!title) continue;
    const parts = title.split(': ');
    const show = parts.length > 1 && /season|series|part|chapter|episode|limited/i.test(title);
    const name = show ? parts[0] : title;
    if (!seen.has(name)) seen.set(name, found('nf', slug(name), name, 'Netflix', show ? 'show' : 'film', { y: (r.date ?? '').match(/\d{4}/)?.[0] ?? '' }));
  }
  return [...seen.values()];
}

/** Letterboxd's export (watched.csv, ratings.csv or diary.csv: Name, Year, …). */
export function fromLetterboxdCsv(text: string): Entry[] {
  return byHeader(parseCsv(text))
    .filter((r) => r.name)
    .map((r) => found('lb', slug(`${r.name}-${r.year ?? ''}`), r.name, 'Film', 'film', { y: r.year ?? '' }));
}

/** IMDb's ratings export (Const, Your Rating, Title, Title Type, Year, Directors, …). */
export function fromImdbCsv(text: string): Entry[] {
  return byHeader(parseCsv(text))
    .filter((r) => r.title && r.const)
    .map((r) => {
      const tv = /tv ?series|tv ?mini/i.test(r['title type'] ?? '');
      return found('im', r.const, r.title, r.directors || (tv ? 'TV' : 'Film'), tv ? 'show' : 'film', { y: r.year ?? '' });
    });
}

export const IMPORTERS: Record<string, (text: string) => Entry[]> = { Netflix: fromNetflixCsv, Letterboxd: fromLetterboxdCsv, IMDb: fromImdbCsv };
