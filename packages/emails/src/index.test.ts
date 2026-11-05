import { describe, expect, it } from 'vitest';
import { EMAILS, listActivity, samples, signInCode } from './index';

const b = { site: 'https://see.example/', address: '1 Example Street, Lagos' };

describe('the six emails', () => {
  const all = samples(b);
  it('has one of each, with the board’s subjects', () => {
    expect(Object.keys(all)).toEqual(EMAILS.map((e) => e.id));
    expect(all['sign-in-code'].subject).toBe('Your See code: 482 913');
    expect(all.welcome.subject).toBe('You’re in. Start ranking.');
    expect(all['list-activity'].subject).toBe('@kemi joined Summer in Lagos');
    expect(all['weekly-recap'].subject).toBe('Your week: 6 moves, one No. 1 held');
    expect(all['weekly-recap'].preheader).toBe('Soweto climbed 2 places, and Lonely At The Top held No. 1 for a third week.');
    expect(all['poll-results'].preheader).toBe('Your pick won: Lonely At The Top, with 41% of 1,204 votes.');
    expect(all['account-deletion'].subject).toBe('Your See account will be deleted on 9 November');
  });

  it('is built the way every mail client keeps: 600 px tables, dark, with the address and a text version', () => {
    for (const e of Object.values(all)) {
      expect(e.html).toContain('width="600"');
      expect(e.html).toContain('<meta name="color-scheme" content="dark">');
      expect(e.html).toContain('1 Example Street, Lagos');
      expect(e.html).not.toContain('clip-path');
      expect(e.text.length).toBeGreaterThan(40);
    }
  });

  it('lets you stop the kinds you can, never the code or the account emails', () => {
    expect(all['sign-in-code'].html).not.toContain('Stop emails');
    expect(all['account-deletion'].html).not.toContain('Stop emails');
    expect(all['weekly-recap'].html).toContain('Stop emails like this');
  });

  it('escapes what people type', () => {
    const e = listActivity({ who: 'x', list: '<b>Mine</b>', category: 'Music', did: 'moved "it"', rows: [{ t: '<i>', m: '&', move: '▲ 1' }], link: 'https://see.example/' }, b);
    expect(e.html).toContain('&lt;b&gt;Mine&lt;/b&gt;');
    expect(e.html).not.toContain('<i>');
    expect(signInCode({ code: '12 34 56', email: 'a@b.c', link: 'x' }, b).subject).toBe('Your See code: 123 456');
  });
});
