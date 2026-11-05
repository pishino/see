/*
 * The emails See sends (V3Emails): the sign-in code, welcome, someone on your list, the weekly recap, a poll result
 * and account deletion. One layout: 600 px, tables and inline styles, so Gmail, Outlook and Apple Mail keep it.
 * Dark like the app; the meta tags ask clients not to invert it. Buttons hug their label and are square (clients
 * drop clip-path). Type falls back to Arial Black and Arial. Footers say why it came, how to stop that kind, and
 * our address; the sign-in code and account emails can't be turned off.
 * Self-contained (no imports), so Node runs it as it is and any server can send with it.
 */

export interface Email {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

export interface Brand {
  /** where See lives, ending in / (links and the wordmark image) */
  site: string;
  /** the postal address every email carries */
  address: string;
}

const C = { bg: '#0B0F0E', rule: '#1D2422', text: '#F4F5F2', text2: '#C9CFCC', text3: '#9AA39F', text4: '#7C8884', flare: '#FF4A1C', up: '#7FD18B', down: '#FF8A66', violet: '#7C6BFF', violetText: '#B9AFFF' };
const DISPLAY = `'Archivo', 'Arial Black', Arial, sans-serif`;
const BODY = `'Instrument Sans', Helvetica, Arial, sans-serif`;

const esc = (s: string | number) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n: number) => String(n).padStart(2, '0');

const kicker = (t: string, color = C.text3) =>
  `<tr><td style="padding: 0 0 10px; font-family: ${BODY}; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${color};">${esc(t)}</td></tr>`;
const hero = (lines: string[], color = C.text) =>
  `<tr><td style="padding: 0 0 14px; font-family: ${DISPLAY}; font-weight: 900; font-size: 34px; line-height: 1.02; letter-spacing: -0.01em; text-transform: uppercase; color: ${color};">${lines.map(esc).join('<br>')}</td></tr>`;
const para = (html: string, size = 15, color = C.text2, padding = '0 0 16px') =>
  `<tr><td style="padding: ${padding}; font-family: ${BODY}; font-size: ${size}px; line-height: 1.55; color: ${color};">${html}</td></tr>`;
const button = (label: string, href: string, bg = C.flare) =>
  `<tr><td style="padding: 8px 0 24px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${bg}" style="background: ${bg};"><a href="${esc(href)}" style="display: inline-block; padding: 14px 22px; font-family: ${DISPLAY}; font-weight: 800; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: ${C.bg}; text-decoration: none;">${esc(label)}</a></td></tr></table></td></tr>`;
const footer = (why: string, b: Brand, stop?: { href: string; label: string }) =>
  `<tr><td style="padding: 26px 0 0; border-top: 1px solid ${C.rule}; font-family: ${BODY}; font-size: 12px; line-height: 1.6; color: ${C.text4};">${why}<br>${
    stop ? `<a href="${esc(stop.href)}" style="color: ${C.text4}; text-decoration: underline;">${esc(stop.label)}</a> · ` : ''
  }See · ${esc(b.address)} · <a href="${esc(b.site)}privacy" style="color: ${C.text4}; text-decoration: underline;">Privacy</a></td></tr>`;

/** The hidden line inbox previews show after the subject, padded so the body doesn't leak into it. */
const preheaderHtml = (t: string) =>
  `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${esc(t)}${' &#847; &zwnj;'.repeat(40)}</div>`;

function layout(subject: string, preheader: string, rows: string, b: Brand): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<style>
:root { color-scheme: dark; supported-color-schemes: dark; }
body { margin: 0; padding: 0; background: ${C.bg}; }
a { color: ${C.text}; }
@media (max-width: 620px) { .code { font-size: 40px !important; } .wrap { padding-left: 16px !important; padding-right: 16px !important; } }
</style>
</head>
<body style="margin: 0; padding: 0; background: ${C.bg};">
${preheaderHtml(preheader)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background: ${C.bg};">
<tr><td align="center" style="padding: 40px 0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 100%;">
<tr><td class="wrap" style="padding: 0 24px 34px;"><img src="${esc(b.site)}email/see@2x.png" width="64" height="24" alt="see" style="display: block; border: 0; font-family: ${DISPLAY}; font-size: 22px; font-weight: 900; color: ${C.flare};"></td></tr>
<tr><td class="wrap" style="padding: 0 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${rows}
</table></td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Plain text: the same words, in order, for clients that don't show HTML. */
const plain = (parts: (string | false | undefined)[]) => parts.filter(Boolean).join('\n\n') + '\n';

/* ---------------------------------------------------------------- 1 · the sign-in code (always sent) */

export function signInCode(d: { code: string; email: string; link: string }, b: Brand): Email {
  const code = d.code.replace(/\D/g, '').replace(/(\d{3})(\d{3})/, '$1 $2');
  const subject = `Your See code: ${code}`;
  const preheader = 'It works for 10 minutes. If you didn’t ask for it, ignore this email.';
  const why = `Someone asked to sign in to See as ${esc(d.email)}. If it wasn’t you, ignore this: nothing happens without the code.`;
  const html = layout(
    subject,
    preheader,
    [
      kicker('Sign in'),
      hero(['Your code']),
      `<tr><td class="code" style="padding: 4px 0 18px; font-family: ${DISPLAY}; font-weight: 900; font-size: 52px; letter-spacing: 0.16em; color: ${C.text};">${esc(code).replace(' ', '&nbsp;')}</td></tr>`,
      para('Type it into See within 10 minutes. It works once.'),
      para('On the phone or computer you’re signing in on? Skip the code:', 14, C.text3, '0 0 4px'),
      button('Sign me in', d.link),
      footer(why, b),
    ].join('\n'),
    b,
  );
  const text = plain([`Your See code: ${code}`, 'Type it into See within 10 minutes. It works once.', `On the phone or computer you’re signing in on? Skip the code: ${d.link}`, `Someone asked to sign in to See as ${d.email}. If it wasn’t you, ignore this: nothing happens without the code.`, `See · ${b.address}`]);
  return { subject, preheader, html, text };
}

/* ---------------------------------------------------------------- 2 · welcome (once) */

export function welcome(d: { name: string; email: string }, b: Brand): Email {
  const subject = 'You’re in. Start ranking.';
  const preheader = 'Three steps to your first list, in about a minute.';
  const steps: [string, string][] = [
    ['Name a list', 'Type it the way you’d say it, like “Afrobeats songs of 2026”. See files it for you.'],
    ['Fill No. 1', 'Search, or paste a playlist or chart and See fills it.'],
    ['Bring your people', 'Share a list and rank it together, or start a poll.'],
  ];
  const stepRows = steps
    .map(
      ([h, t], i) =>
        `<tr><td style="padding: 12px 0; border-bottom: 1px solid ${C.rule};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="40" valign="top" style="font-family: ${DISPLAY}; font-weight: 800; font-size: 15px; color: ${i === 0 ? C.flare : C.text3};">${pad(i + 1)}</td><td style="font-family: ${DISPLAY}; font-weight: 800; font-size: 15px; text-transform: uppercase; color: ${C.text};">${esc(h)}<div style="font-family: ${BODY}; font-weight: 400; font-size: 13.5px; line-height: 1.5; text-transform: none; color: ${C.text3}; padding-top: 4px;">${esc(t)}</div></td></tr></table></td></tr>`,
    )
    .join('\n');
  const html = layout(
    subject,
    preheader,
    [
      kicker(`Welcome, ${d.name}`),
      hero(['You’re in.', 'Start ranking.']),
      para('See is where you rank what you love, and see how it moves. Music, films, TV, sport, books: whatever you have opinions about.'),
      stepRows,
      `<tr><td style="height: 18px;"></td></tr>`,
      button('Start ranking', `${b.site}app`),
      footer(`You signed up to See with ${esc(d.email)}.`, b, { href: `${b.site}app/settings/notif`, label: 'Choose what we email you' }),
    ].join('\n'),
    b,
  );
  const text = plain([`Welcome, ${d.name}`, 'You’re in. Start ranking.', 'See is where you rank what you love, and see how it moves.', ...steps.map(([h, t], i) => `${i + 1}. ${h}: ${t}`), `Start ranking: ${b.site}app`, `You signed up to See with ${d.email}.`, `See · ${b.address}`]);
  return { subject, preheader, html, text };
}

/* ---------------------------------------------------------------- 3 · someone joins or edits your list */

export interface Row {
  t: string;
  m: string;
  /** "▲ 2", "▼ 1", "–", "NEW" */
  move: string;
}

const rankRows = (rows: Row[]) =>
  rows
    .map((r, i) => {
      const tone = r.move.startsWith('▲') ? C.up : r.move.startsWith('▼') ? C.down : C.text3;
      return `<tr><td style="padding: 10px 0; border-bottom: 1px solid ${C.rule};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="40" style="font-family: ${DISPLAY}; font-weight: 800; font-size: 15px; color: ${i === 0 ? C.flare : C.text3};">${pad(i + 1)}</td><td style="font-family: ${DISPLAY}; font-weight: 800; font-size: 15px; text-transform: uppercase; color: ${C.text};">${esc(r.t)}<div style="font-family: ${BODY}; font-weight: 400; font-size: 12.5px; text-transform: none; color: ${C.text3}; padding-top: 2px;">${esc(r.m)}</div></td><td width="60" align="right" style="font-family: ${DISPLAY}; font-weight: 800; font-size: 12px; color: ${tone};">${esc(r.move)}</td></tr></table></td></tr>`;
    })
    .join('\n');

export function listActivity(d: { who: string; list: string; category: string; did: string; rows: Row[]; link: string }, b: Brand): Email {
  const subject = `@${d.who} joined ${d.list}`;
  const preheader = `@${d.who} ${d.did}.`;
  const html = layout(
    subject,
    preheader,
    [
      kicker(`${d.list} · ${d.category}`),
      hero([`@${d.who} joined your list`]),
      para(`They ${esc(d.did)}. Here’s how the top looks now:`),
      rankRows(d.rows.slice(0, 5)),
      `<tr><td style="height: 18px;"></td></tr>`,
      button('Open the list', d.link),
      footer('You get an email when someone joins or edits a list you made. At most one every 30 minutes per list.', b, { href: `${b.site}app/settings/notif`, label: 'Stop emails like this' }),
    ].join('\n'),
    b,
  );
  const text = plain([`@${d.who} joined ${d.list}`, `They ${d.did}. Here’s how the top looks now:`, d.rows.slice(0, 5).map((r, i) => `${pad(i + 1)} ${r.t} · ${r.m} ${r.move}`).join('\n'), `Open the list: ${d.link}`, 'You get an email when someone joins or edits a list you made. At most one every 30 minutes per list.', `See · ${b.address}`]);
  return { subject, preheader, html, text };
}

/* ---------------------------------------------------------------- 4 · the weekly recap (Sunday 18:00, only if something moved) */

export function weeklyRecap(
  d: { week: string; moves: number; pollsClosed: number; joined: number; biggest: { t: string; list: string; by?: string; move: string }; held?: { t: string; list: string; weeks: number }; link: string },
  b: Brand,
): Email {
  const subject = `Your week: ${d.moves} moves${d.held ? ', one No. 1 held' : ''}`;
  const preheader = `${d.biggest.t} ${d.biggest.move.startsWith('▲') ? `climbed ${d.biggest.move.replace('▲ ', '')} places` : 'moved'}${d.held ? `, and ${d.held.t} held No. 1 for a ${ordinal(d.held.weeks)} week` : ''}.`;
  const stat = (n: number, label: string) =>
    `<td width="33%" valign="top" style="padding: 14px; background: #141A18; font-family: ${DISPLAY}; font-weight: 800; font-size: 26px; color: ${C.text};">${n}<div style="font-family: ${BODY}; font-weight: 400; font-size: 12px; color: ${C.text3}; padding-top: 4px;">${esc(label)}</div></td>`;
  const block = (k: string, t: string, m: string) =>
    `<tr><td style="padding: 12px 0; border-bottom: 1px solid ${C.rule};"><div style="font-family: ${BODY}; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${C.text3};">${esc(k)}</div><div style="font-family: ${DISPLAY}; font-weight: 800; font-size: 15px; text-transform: uppercase; color: ${C.text}; padding-top: 6px;">${esc(t)}</div><div style="font-family: ${BODY}; font-size: 12.5px; color: ${C.text3}; padding-top: 2px;">${esc(m)}</div></td></tr>`;
  const html = layout(
    subject,
    preheader,
    [
      kicker(`Your week · ${d.week}`),
      hero([`${d.moves} moves.`, ...(d.held ? ['One No. 1 held.'] : [])]),
      `<tr><td style="padding: 6px 0 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="6" border="0"><tr>${stat(d.moves, 'places moved')}${stat(d.pollsClosed, d.pollsClosed === 1 ? 'poll closed' : 'polls closed')}${stat(d.joined, d.joined === 1 ? 'person joined' : 'people joined')}</tr></table></td></tr>`,
      block('Biggest move', `${d.biggest.t} ${d.biggest.move}`, `${d.biggest.list}${d.biggest.by ? ` · @${d.biggest.by} moved it` : ''}`),
      d.held ? block('Held No. 1', d.held.t, `${d.held.list} · ${ordinal(d.held.weeks)} week`) : '',
      `<tr><td style="height: 18px;"></td></tr>`,
      button('See your week', d.link),
      footer('Your weekly recap comes on Sundays. Turn it off in Settings, Notifications.', b, { href: `${b.site}app/settings/notif`, label: 'Stop emails like this' }),
    ].join('\n'),
    b,
  );
  const text = plain([subject, preheader, `${d.moves} places moved · ${d.pollsClosed} polls closed · ${d.joined} joined`, `Biggest move: ${d.biggest.t} ${d.biggest.move} (${d.biggest.list})`, d.held && `Held No. 1: ${d.held.t} (${d.held.list}, ${ordinal(d.held.weeks)} week)`, `See your week: ${d.link}`, 'Your weekly recap comes on Sundays. Turn it off in Settings, Notifications.', `See · ${b.address}`]);
  return { subject, preheader, html, text };
}

const ordinal = (n: number) => (['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'][n - 1] ?? `${n}th`);

/* ---------------------------------------------------------------- 5 · a poll you voted in closed */

export function pollResults(d: { question: string; category: string; votes: number; results: { t: string; by?: string; pct: number }[]; yourPick?: string; link: string }, b: Brand): Email {
  const win = d.results[0];
  const yours = d.yourPick === win.t;
  const subject = `Results: ${d.question}`;
  const preheader = `${yours ? 'Your pick won' : 'The winner'}: ${win.t}, with ${win.pct}% of ${d.votes.toLocaleString('en')} votes.`;
  const bars = d.results
    .slice(0, 4)
    .map(
      (r, i) =>
        `<tr><td style="padding: 6px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-family: ${DISPLAY}; font-weight: 800; font-size: 13px; text-transform: uppercase; color: ${i === 0 ? C.violetText : C.text};">${esc(r.t)}</td><td width="50" align="right" style="font-family: ${DISPLAY}; font-weight: 800; font-size: 13px; color: ${C.text2};">${r.pct}%</td></tr><tr><td colspan="2" style="padding-top: 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="${Math.max(1, r.pct)}%" height="6" bgcolor="${i === 0 ? C.violet : '#2B3331'}" style="font-size: 0; line-height: 0;">&nbsp;</td><td bgcolor="#141A18" style="font-size: 0; line-height: 0;">&nbsp;</td></tr></table></td></tr></table></td></tr>`,
    )
    .join('\n');
  const html = layout(
    subject,
    preheader,
    [
      kicker(`Poll · ${d.category} · closed`, C.violetText),
      hero([d.question]),
      `<tr><td style="padding: 4px 0 16px;"><div style="font-family: ${BODY}; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${C.violetText};">Winner${yours ? ' · your pick' : ''}</div><div style="font-family: ${DISPLAY}; font-weight: 900; font-size: 26px; text-transform: uppercase; color: ${C.text}; padding-top: 6px;">${esc(win.t)}</div><div style="font-family: ${BODY}; font-size: 13px; color: ${C.text3}; padding-top: 2px;">${win.by ? `${esc(win.by)} · ` : ''}${win.pct}% of ${d.votes.toLocaleString('en')} votes</div></td></tr>`,
      bars,
      `<tr><td style="height: 18px;"></td></tr>`,
      button('See the full results', d.link, C.violet),
      footer('You voted in this poll. You get its result when it closes.', b, { href: `${b.site}app/settings/notif`, label: 'Stop emails like this' }),
    ].join('\n'),
    b,
  );
  const text = plain([subject, preheader, d.results.slice(0, 4).map((r) => `${r.t} ${r.pct}%`).join('\n'), `See the full results: ${d.link}`, 'You voted in this poll. You get its result when it closes.', `See · ${b.address}`]);
  return { subject, preheader, html, text };
}

/* ---------------------------------------------------------------- 6 · account deletion scheduled (always sent) */

export function accountDeletion(d: { on: string; asked: string; link: string }, b: Brand): Email {
  const subject = `Your See account will be deleted on ${d.on}`;
  const preheader = 'You have 14 days to change your mind. Signing in cancels it.';
  const html = layout(
    subject,
    preheader,
    [
      kicker('Your account'),
      hero([`Your account will be deleted on ${d.on}`]),
      para(`You asked to delete your See account. We keep it for 14 days in case you change your mind. After ${esc(d.on)} your lists, polls, votes and picture are gone for good.`),
      para('Lists you shared stay with the people on them, without your name.'),
      para('Changed your mind? Sign in before then and it’s cancelled.'),
      button('Keep my account', d.link),
      footer(`You get this because you deleted your account on ${esc(d.asked)}. If you didn’t, sign in and change your password straight away.`, b),
    ].join('\n'),
    b,
  );
  const text = plain([subject, preheader, `After ${d.on} your lists, polls, votes and picture are gone for good. Lists you shared stay with the people on them, without your name.`, `Keep my account: ${d.link}`, `You get this because you deleted your account on ${d.asked}. If you didn’t, sign in and change your password straight away.`, `See · ${b.address}`]);
  return { subject, preheader, html, text };
}

/** Every email with the board's sample words: the handoff pack and the preview page use these. */
export function samples(b: Brand): Record<string, Email> {
  return {
    'sign-in-code': signInCode({ code: '482913', email: 'joey@example.com', link: `${b.site}in/sample` }, b),
    welcome: welcome({ name: 'Joey', email: 'joey@example.com' }, b),
    'list-activity': listActivity(
      {
        who: 'kemi',
        list: 'Summer in Lagos',
        category: 'Music',
        did: 'moved Soweto up to No. 2',
        rows: [
          { t: 'Essence', m: 'Wizkid · Made in Lagos', move: '–' },
          { t: 'Soweto', m: 'Victony · Outlaw', move: '▲ 2' },
          { t: 'Water', m: 'Tyla · Tyla', move: '▼ 1' },
        ],
        link: `${b.site}app/l/l2`,
      },
      b,
    ),
    'weekly-recap': weeklyRecap(
      { week: '20 to 26 October', moves: 6, pollsClosed: 2, joined: 1, biggest: { t: 'Soweto', list: 'Summer in Lagos', by: 'kemi', move: '▲ 2' }, held: { t: 'Lonely At The Top', list: 'Videos of the year', weeks: 3 }, link: `${b.site}app/you` },
      b,
    ),
    'poll-results': pollResults(
      {
        question: 'Video of the year?',
        category: 'Music',
        votes: 1204,
        yourPick: 'Lonely At The Top',
        results: [
          { t: 'Lonely At The Top', by: 'Asake', pct: 41 },
          { t: 'Water', by: 'Tyla', pct: 27 },
          { t: 'City Boys', by: 'Burna Boy', pct: 19 },
          { t: 'Rush', by: 'Ayra Starr', pct: 13 },
        ],
        link: `${b.site}app/polls`,
      },
      b,
    ),
    'account-deletion': accountDeletion({ on: '9 November', asked: '26 October', link: `${b.site}login` }, b),
  };
}

/** What each email is for, when it's sent and what turns it off (the board's notes). */
export const EMAILS = [
  { id: 'sign-in-code', name: 'Sign-in code', sent: 'Someone types an email on the sign-in screen.', off: 'Always sent; no unsubscribe.' },
  { id: 'welcome', name: 'Welcome', sent: 'The first sign-in, once.', off: 'Always sent once.' },
  { id: 'list-activity', name: 'Someone joins or edits your list', sent: 'A join or edit on a list you made, at most one per list every 30 min.', off: 'Settings, Notifications.' },
  { id: 'weekly-recap', name: 'Weekly recap', sent: 'Sunday 18:00 in your time zone, only if something moved.', off: 'Settings, Notifications.' },
  { id: 'poll-results', name: 'Poll results', sent: 'A poll you voted in closes.', off: 'Settings, Notifications.' },
  { id: 'account-deletion', name: 'Account deletion scheduled', sent: 'Delete account, confirmed with your handle.', off: 'Always sent.' },
] as const;
