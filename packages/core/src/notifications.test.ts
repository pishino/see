import { describe, expect, it } from 'vitest';
import { LINE_MAX, NOTIFICATIONS, TITLE_MAX, compose, routeOf } from './notifications';
import { DEFAULT_SETTINGS, sectionSummary, withDefaults } from './settings';

describe('notification copy', () => {
  it('writes each kind the way the board does', () => {
    expect(compose.pollResults('p1', 'Video of the year?', 'Lonely At The Top', true)).toEqual({
      kind: 'poll-results',
      title: 'Video of the year?',
      line: 'It’s closed. Your pick, Lonely At The Top, won.',
      subject: 'Results: Video of the year?',
      link: 'see://poll/p1/results',
    });
    expect(compose.listActivity('l2', 'Summer in Lagos', ['kemi', 'ada', 'tunde'], 5).line).toBe('@kemi and 2 others made 5 changes.');
    expect(compose.weeklyRecap(6, 'Lonely At The Top').line).toBe('Your charts moved 6 places. Lonely At The Top held No. 1.');
  });
  it('keeps titles to 40 and lines to 110', () => {
    const m = compose.addedToList('x', 'A list name that goes on far longer than any push title should', 'tunde');
    expect(m.title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(compose.listActivity('x', 'L', ['a'], 1, 'x'.repeat(200)).line.length).toBeLessThanOrEqual(LINE_MAX);
  });
  it('routes see:// links to app paths', () => {
    expect(routeOf('see://list/l2')).toBe('/app/l/l2');
    expect(routeOf('see://poll/p1/results')).toBe('/app/polls');
    expect(routeOf('see://you/activity')).toBe('/app/activity');
  });
  it('keeps reports always on', () => {
    expect(NOTIFICATIONS.find((n) => n.kind === 'report-closed')!.optional).toBe(false);
  });
});

describe('settings', () => {
  it('says what each section is set to', () => {
    expect(sectionSummary('profile', DEFAULT_SETTINGS)).toBe('@joey · Flare picture');
    expect(sectionSummary('notif', { ...DEFAULT_SETTINGS, quiet: 'Off' })).toBe('No quiet hours');
    expect(sectionSummary('display', { ...DEFAULT_SETTINGS, reduceMotion: true, text: 'Larger' })).toBe('Reduced motion · Larger text');
  });
  it('fills settings saved by an older version', () => {
    expect(withDefaults({ name: 'Ada' })).toMatchObject({ name: 'Ada', handle: '@joey', field: true });
    expect(withDefaults(null)).toBe(DEFAULT_SETTINGS);
  });
});
