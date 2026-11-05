import { describe, expect, it } from 'vitest';
import { CONNECTIONS, fromImdbCsv, fromLetterboxdCsv, fromNetflixCsv, fromReddit, fromSpotify, fromYouTube, parseCsv } from './connections';
import { SERVICES } from './settings';
import { reduce, seedState } from './store';
import { BY_ID, search } from './seed';

describe('connected services', () => {
  it('says how every service in Settings connects', () => {
    const named = SERVICES.flatMap((g) => g.services);
    for (const n of named) expect(CONNECTIONS.find((c) => c.name === n), n).toBeDefined();
  });

  it('turns what each service returns into things to rank', () => {
    expect(fromSpotify({ items: [{ id: 'a1', name: 'Water', artists: [{ name: 'Tyla' }], album: { name: 'Tyla', release_date: '2023-07-28' } }] })[0]).toMatchObject({ id: 'sp:a1', t: 'Water', m: 'Tyla', k: 'song', y: '2023', src: ['sp'] });
    expect(fromYouTube({ items: [{ id: 'v9', snippet: { title: 'Rush', channelTitle: 'Ayra Starr - Topic', publishedAt: '2022-09-16T00:00:00Z' } }] })[0]).toMatchObject({ m: 'Ayra Starr', k: 'video' });
    const rd = fromReddit({ data: { children: [{ data: { id: 'p1', title: 'A post', url: 'https://example.com' } }, { data: { id: 'p2', title: 'Burna Boy - City Boys', url: 'https://youtu.be/x', subreddit: 'afrobeats' } }] } });
    expect(rd.map((x) => x.id)).toEqual(['rd:p2']);
  });

  it('reads the files services let you download', () => {
    expect(parseCsv('a,"b, c","d ""e"""\n1,2,3')).toEqual([['a', 'b, c', 'd "e"'], ['1', '2', '3']]);
    const nf = fromNetflixCsv('Title,Date\n"Squid Game: Season 1: Red Light, Green Light",9/20/21\n"Squid Game: Season 1: Hell",9/21/21\nRRR,3/1/23\n');
    expect(nf.map((x) => [x.t, x.k])).toEqual([['Squid Game', 'show'], ['RRR', 'film']]);
    expect(fromLetterboxdCsv('Date,Name,Year,Letterboxd URI\n2025-04-20,Sinners,2025,https://boxd.it/x\n')[0]).toMatchObject({ t: 'Sinners', y: '2025', k: 'film' });
    expect(fromImdbCsv('Const,Your Rating,Date Rated,Title,URL,Title Type,IMDb Rating,Runtime (mins),Year,Genres,Num Votes,Release Date,Directors\ntt1,9,2024-01-01,Severance,u,TV Series,8.7,55,2022,Drama,1,2022-02-18,\n')[0]).toMatchObject({ t: 'Severance', k: 'show' });
  });

  it('keeps what a service filled, once, and finds it', () => {
    const e = fromSpotify({ items: [{ id: 'zz', name: 'Ozeba', artists: [{ name: 'Rema' }] }] });
    const s1 = reduce(seedState(), { type: 'addFound', entries: e });
    expect(reduce(s1, { type: 'addFound', entries: e })).toBe(s1);
    expect(BY_ID['sp:zz']?.t).toBe('Ozeba');
    expect(search('ozeba').some((x) => x.id === 'sp:zz')).toBe(true);
  });
});
