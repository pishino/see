import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  COLOURS,
  DEVICES,
  NOTIFICATIONS,
  QUIET_HOURS,
  READS,
  SECTIONS,
  SECTION_GROUPS,
  SERVICES,
  VERSION,
  sectionSummary,
  type SectionId,
  type Settings,
} from '@see/core';
import { useSettings } from '@see/core/react';
import { Icon } from '../../brand/Icon';
import { ProfilePicture } from '../../brand/ProfilePicture';
import { Button } from '../../components/Button';
import { Switch } from '../../components/controls';
import { useToast } from '../../components/Toast';
import { usePhone } from '../../lib/useMediaQuery';
import './you.css';

import spotify from '../../assets/logos/spotify.png';
import youtube from '../../assets/logos/youtube.png';
import netflix from '../../assets/logos/netflix.png';
import letterboxd from '../../assets/logos/letterboxd.png';
import imdb from '../../assets/logos/imdb.png';
import deezer from '../../assets/logos/deezer.png';
import reddit from '../../assets/logos/reddit.png';
import instagram from '../../assets/logos/instagram.png';
import xLogo from '../../assets/logos/x.png';
import tiktok from '../../assets/logos/tiktok.png';

const LOGOS: Record<string, string> = {
  Spotify: spotify,
  YouTube: youtube,
  Netflix: netflix,
  Letterboxd: letterboxd,
  IMDb: imdb,
  Deezer: deezer,
  Reddit: reddit,
  Instagram: instagram,
  X: xLogo,
  TikTok: tiktok,
};

const title = (id: SectionId) => SECTIONS.find((s) => s.id === id)!.title;
const isSection = (v: string | undefined): v is SectionId => !!v && SECTIONS.some((s) => s.id === v);

/**
 * Settings, from your picture. Wide screens: a two-pane page, sections on the left, the one you are in on the
 * right. Phones: the sections, then one section at a time. No Save button: a change is the change.
 */
export function SettingsView() {
  const params = useParams();
  const phone = usePhone();
  const { settings } = useSettings();
  const section = isSection(params.section) ? params.section : null;
  if (params.section && !section) return <Navigate to="/app/settings" replace />;
  if (!phone && !section) return <Navigate to="/app/settings/profile" replace />;

  if (phone) {
    return (
      <div className="st">
        {section ? (
          <>
            <Back to="/app/settings" crumb="Settings" title={title(section)} />
            <SectionBody id={section} />
          </>
        ) : (
          <>
            <Back to="/app/you" crumb="You" title="Settings" />
            <SectionNav current={null} />
            <Footer />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="st">
      <div className="st-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="t-label">You · {settings.handle}</span>
          <h1 className="t-hero" style={{ fontSize: 52 }}>
            Settings
          </h1>
        </div>
        <span className="t-meta">Changes save as you make them</span>
      </div>
      <div className="st-panes">
        <div className="st-nav">
          <SectionNav current={section} />
          <Footer />
        </div>
        <section className="st-sec" aria-labelledby="st-title">
          <div className="st-sec__head">
            <h2 id="st-title" className="t-hero" style={{ fontSize: 30 }}>
              {title(section!)}
            </h2>
            <span className="t-meta">{SECTIONS.find((s) => s.id === section)?.blurb}</span>
          </div>
          <SectionBody id={section!} />
        </section>
      </div>
    </div>
  );
}

function Back({ to, crumb, title }: { to: string; crumb: string; title: string }) {
  return (
    <Link to={to} className="st-back" aria-label={`Back to ${crumb}`}>
      <Icon name="back" size={20} color="var(--see-text)" />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="t-label" style={{ fontSize: 9.5 }}>
          {crumb}
        </span>
        <h1 className="t-hero" style={{ fontSize: 22 }}>
          {title}
        </h1>
      </span>
    </Link>
  );
}

/** Your card first (picture, name, handle), then every section with what it is set to right now. */
function SectionNav({ current }: { current: SectionId | null }) {
  const { settings } = useSettings();
  return (
    <nav aria-label="Settings">
      <Link to="/app/settings/profile" className="st-card">
        <ProfilePicture size={40} />
        <span style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <b>{settings.name}</b>
          <span className="t-meta">{settings.handle} · Edit your profile</span>
        </span>
        <Icon name="chev" size={14} color="var(--see-text-3)" />
      </Link>
      {SECTION_GROUPS.map(([label, ids], gi) => (
        <div key={gi}>
          {label ? <h2 className="t-label st-group">{label}</h2> : <div style={{ height: 14 }} />}
          {ids.map((id) => (
            <Link key={id} to={`/app/settings/${id}`} className="st-row" aria-current={id === current ? 'page' : undefined}>
              <span>
                <b>{title(id)}</b>
                <span>{sectionSummary(id, settings)}</span>
              </span>
              <Icon name="chev" size={14} color="var(--see-text-3)" />
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

function Footer() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '24px 14px 0', alignItems: 'flex-start' }}>
      <Button variant="quiet" size="sm" onClick={() => navigate('/login')}>
        Sign out
      </Button>
      <span className="t-foot">{VERSION}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- the parts every section is made of */

function Toggle<K extends keyof Settings>({ k, label, sub }: { k: K; label: string; sub?: string }) {
  const { settings, set } = useSettings();
  return (
    <div className="st-item">
      <div className="st-line">
        <span>
          <b>{label}</b>
          {sub && <div className="st-sub">{sub}</div>}
        </span>
        <Switch checked={!!settings[k]} label={label} onChange={(v) => set(k, v as Settings[K])} />
      </div>
    </div>
  );
}

function Seg<K extends keyof Settings>({ k, label, options, sub }: { k: K; label: string; options: readonly string[]; sub?: string }) {
  const { settings, set } = useSettings();
  return (
    <div className="st-item">
      <b id={`seg-${String(k)}`}>{label}</b>
      <div className="st-seg" role="radiogroup" aria-labelledby={`seg-${String(k)}`}>
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={settings[k] === o} onClick={() => set(k, o as Settings[K])}>
            {o}
          </button>
        ))}
      </div>
      {sub && <div className="st-sub">{sub}</div>}
    </div>
  );
}

function Field<K extends keyof Settings>({ k, label, sub, clean }: { k: K; label: string; sub?: string; clean: (v: string) => string }) {
  const { settings, set } = useSettings();
  return (
    <label className="st-item">
      <b>{label}</b>
      <input className="st-input" value={String(settings[k])} onChange={(e) => set(k, clean(e.target.value) as Settings[K])} />
      {sub && <span className="st-sub">{sub}</span>}
    </label>
  );
}

function LinkRow({ label, value, sub }: { label: string; value?: string; sub?: string }) {
  const toast = useToast();
  return (
    <button type="button" className="st-item rowbtn" style={{ border: 0, borderBottom: '1px solid var(--see-surface-1)', background: 'transparent', textAlign: 'left', color: 'inherit' }} onClick={() => toast(`${label}: opens in the full app`)}>
      <div className="st-line">
        <span>
          <b>{label}</b>
          {sub && <div className="st-sub">{sub}</div>}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {value && <span className="t-meta">{value}</span>}
          <Icon name="chev" size={14} color="var(--see-text-3)" />
        </span>
      </div>
    </button>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <h3 className="t-label st-label">{children}</h3>;
}

/* ---------------------------------------------------------------- the ten sections */

function SectionBody({ id }: { id: SectionId }) {
  const { settings, set } = useSettings();
  const toast = useToast();
  const [del, setDel] = useState<'closed' | 'confirm' | 'done'>('closed');
  const [typed, setTyped] = useState('');

  switch (id) {
    case 'profile':
      return (
        <>
          <div className="st-item" style={{ gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <ProfilePicture size={88} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => {
                    set('uploaded', true);
                    toast('Photo uploaded');
                  }}
                >
                  {settings.uploaded ? 'Photo uploaded · change it' : 'Upload a new photo'}
                </Button>
                <span className="st-sub">Your photo, pixelated in your colour. No two are the same.</span>
              </div>
            </div>
            <b id="colour-l">Your colour</b>
            <div className="st-swatches" role="radiogroup" aria-labelledby="colour-l">
              {COLOURS.map(([name, hex]) => (
                <button key={hex} type="button" role="radio" aria-checked={settings.colour === hex} aria-label={name} className="st-swatch" style={{ background: hex }} onClick={() => set('colour', hex)} />
              ))}
            </div>
          </div>
          <Field k="name" label="Name" clean={(v) => v.slice(0, 30)} />
          <Field
            k="handle"
            label="Handle"
            sub={`Your page is see.app/${settings.handle.replace('@', '')}`}
            clean={(v) => {
              const t = v.replace(/[^@a-zA-Z0-9_.]/g, '').slice(0, 20);
              return t.startsWith('@') ? t : `@${t}`;
            }}
          />
          <Field k="bio" label="Bio" clean={(v) => v.slice(0, 60)} />
          <Toggle k="topcats" label="Show my top categories first" sub="Your page opens on what you rank most." />
        </>
      );

    case 'account': {
      const devices = DEVICES.filter((d) => !settings.devicesSignedOut.includes(d[0]));
      return (
        <>
          <Label>Signing in</Label>
          <LinkRow label="Email" value="joey@example.com" sub="Where your sign-in codes go" />
          <div className="st-item">
            <b>Ways to sign in</b>
            <div className="st-chips">
              {Object.entries(settings.signIn).map(([name, on]) => (
                <button
                  key={name}
                  type="button"
                  className="st-chip"
                  aria-pressed={on}
                  onClick={() => {
                    const next = { ...settings.signIn, [name]: !on };
                    if (!Object.values(next).some(Boolean)) {
                      toast('Keep at least one way to sign in');
                      return;
                    }
                    set('signIn', next);
                  }}
                >
                  {on ? name : `+ Add ${name}`}
                </button>
              ))}
            </div>
            <span className="st-sub">Keep at least one. A code by email always works.</span>
          </div>
          <Label>Signed in on</Label>
          {devices.map(([name, meta, current]) => (
            <div key={name} className="st-item">
              <div className="st-line">
                <span>
                  <b>{name}</b>
                  <div className="st-sub">{meta}</div>
                </span>
                {current ? (
                  <span className="t-label" style={{ color: 'var(--see-accent-text)' }}>
                    This one
                  </span>
                ) : (
                  <Button variant="quiet" size="sm" onClick={() => set('devicesSignedOut', [...settings.devicesSignedOut, name])}>
                    Sign out
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Label>Leaving</Label>
          <div className="st-item">
            <Button variant="quiet" size="sm" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Signed out')}>
              Sign out
            </Button>
            <span className="st-sub">Your lists stay as they are.</span>
          </div>
          <div className="st-item" style={{ gap: 12 }}>
            {del === 'closed' && (
              <button type="button" className="st-danger" onClick={() => setDel('confirm')}>
                Delete account
              </button>
            )}
            {del === 'confirm' && (
              <div role="alertdialog" aria-labelledby="del-t" aria-describedby="del-d" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <b id="del-t">Delete your account?</b>
                <span id="del-d" className="st-sub">
                  Your lists, polls, votes and picture go. Lists you share stay with the people on them. Type {settings.handle} to confirm.
                </span>
                <input className="st-input" value={typed} aria-label={`Type ${settings.handle} to confirm`} onChange={(e) => setTyped(e.target.value.slice(0, 24))} autoFocus />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => {
                      setDel('closed');
                      setTyped('');
                    }}
                  >
                    Keep it
                  </Button>
                  <Button size="sm" disabled={typed !== settings.handle} style={typed === settings.handle ? { background: 'var(--see-flare-soft)' } : undefined} onClick={() => setDel('done')}>
                    Delete for good
                  </Button>
                </div>
              </div>
            )}
            {del === 'done' && (
              <div className="st-note">
                <b>Deletion scheduled.</b> You have 14 days to change your mind: signing in again cancels it.
              </div>
            )}
          </div>
        </>
      );
    }

    case 'services': {
      const last = settings.lastConn;
      return (
        <>
          {SERVICES.map((g) => (
            <div key={g.name} className="st-item">
              <div className="st-line">
                <b>{g.name}</b>
                <span className="st-sub">{g.feeds}</span>
              </div>
              <div className="st-chips">
                {g.services.map((n) => {
                  const on = !!settings.conn[n];
                  return (
                    <button
                      key={n}
                      type="button"
                      className="st-chip"
                      aria-pressed={on}
                      aria-label={`${on ? 'Disconnect' : 'Connect'} ${n}`}
                      onClick={() => {
                        set('conn', { ...settings.conn, [n]: !on });
                        set('lastConn', n);
                      }}
                    >
                      {LOGOS[n] ? <img src={LOGOS[n]} alt="" /> : <span className="slot" aria-hidden="true" />}
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="st-sub" role="status" style={{ paddingTop: 12, color: last ? 'var(--see-text-2)' : undefined }}>
            {last
              ? settings.conn[last]
                ? `${last} is connected: See reads ${READS[last]}.`
                : `${last} is disconnected. What it filled stays in your lists.`
              : 'Tap a name to connect or disconnect it. See reads; it never posts for you.'}
          </p>
        </>
      );
    }

    case 'privacy':
      return (
        <>
          <Seg k="lists" label="Who sees your lists" options={['Everyone', 'Your people', 'Only you']} sub="You can still make one list public or private from its menu." />
          <Seg k="profile" label="Your profile" options={['Public', 'Hidden from search']} />
          <Seg k="canAdd" label="Who can add you to a list" options={['Anyone', 'Your people', 'No one']} />
          <Toggle k="showVotes" label="Show how I voted in polls" sub="Off: people see the result, never your vote." />
          <Toggle k="compare" label="Let people compare their lists with mine" />
          <Label>Blocked</Label>
          {settings.blocked.length === 0 && <p className="st-sub">No one. Block someone from the ··· on their page; they aren’t told.</p>}
          {settings.blocked.map((h) => (
            <div key={h} className="st-item">
              <div className="st-line">
                <b>@{h}</b>
                <Button variant="quiet" size="sm" onClick={() => set('blocked', settings.blocked.filter((x) => x !== h))}>
                  Unblock
                </Button>
              </div>
            </div>
          ))}
        </>
      );

    case 'notif':
      return (
        <>
          <div className="st-notif" aria-hidden="true" style={{ paddingBottom: 4, borderBottom: 0 }}>
            <span />
            <span className="t-label" style={{ fontSize: 10 }}>
              Push
            </span>
            <span className="t-label" style={{ fontSize: 10 }}>
              Email
            </span>
          </div>
          {NOTIFICATIONS.filter((n) => n.optional).map((n) => {
            const v = settings.notif[n.kind];
            const put = (ch: 'push' | 'email', on: boolean) => set('notif', { ...settings.notif, [n.kind]: { ...v, [ch]: on } });
            return (
              <div key={n.kind} className="st-notif">
                <span>
                  <b style={{ fontSize: 13.5 }}>{n.label}</b>
                  {n.sub && <div className="st-sub">{n.sub}</div>}
                </span>
                <Switch checked={v.push} label={`${n.label} by push`} onChange={(on) => put('push', on)} />
                <Switch checked={v.email} label={`${n.label} by email`} onChange={(on) => put('email', on)} />
              </div>
            );
          })}
          <Label>Quiet hours</Label>
          <Seg k="quiet" label="Hold notifications" options={QUIET_HOURS} sub="They wait and arrive together in the morning." />
        </>
      );

    case 'lists':
      return (
        <>
          <Label>A new list starts as</Label>
          <Seg k="size" label="Size" options={['5', '10', '20', '50']} />
          <Seg k="timeFrame" label="Time frame" options={['All time', 'This year', 'This month']} />
          <Label>Making lists</Label>
          <Toggle k="smart" label="File new lists from their name" sub="See reads the name for the category, kind and size." />
          <Toggle k="repeat" label="Ask before a repeat list" sub="If you already have one like it, a toast offers to open it." />
        </>
      );

    case 'playback':
      return (
        <>
          <div className="st-item">
            <b>Play previews from</b>
            <span className="st-sub">The first one that has the item wins.</span>
            {settings.playOrder.map((n, i) => (
              <div key={n} className="st-line" style={{ minHeight: 40 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="t-rank" style={{ width: 16, color: 'var(--see-text-3)' }}>
                    {i + 1}
                  </span>
                  {LOGOS[n] ? <img src={LOGOS[n]} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} /> : <span className="st-chip" style={{ padding: 0, minHeight: 16, width: 16, background: 'transparent' }} />}
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{n}</span>
                </span>
                {i > 0 && (
                  <Button
                    variant="quiet"
                    size="sm"
                    aria-label={`Move ${n} up`}
                    onClick={() => {
                      const o = settings.playOrder.slice();
                      [o[i - 1], o[i]] = [o[i], o[i - 1]];
                      set('playOrder', o);
                    }}
                  >
                    Move up
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Toggle k="autoplay" label="Play the next preview by itself" />
          <Toggle k="dataSaver" label="Data saver" sub="Previews in low quality on mobile data." />
          <Seg k="previewsIn" label="Previews open in" options={['Corner player', 'Full screen']} />
        </>
      );

    case 'display':
      return (
        <>
          <Seg k="appearance" label="Appearance" options={['Dark', 'Light', 'Match device']} sub="Dark by default. Every colour works both ways." />
          <Toggle k="reduceMotion" label="Reduce motion" sub="The masthead, polls and players switch without moving." />
          <Toggle k="field" label="The field behind the page" sub="The moving + signs at the top. Off: plain ink." />
          <Seg k="text" label="Text size" options={['Default', 'Larger', 'Largest']} sub="This page shows it as you choose." />
          <Toggle k="rings" label="Always show focus rings" sub="Not only when you use a keyboard." />
        </>
      );

    case 'ads':
      return (
        <>
          <div className="st-note" style={{ marginBottom: 6 }}>
            One See for everyone. There is no ad-free plan: ads pay so every chart, poll and list size stays free and equal.
          </div>
          <LinkRow label="Why am I seeing an ad" sub="Tap AD on any ad: it says who paid and why it reached you." />
          <div className="st-item">
            <b>Topics</b>
            <span className="st-sub">Turn one off to see less of it.</span>
            <div className="st-chips">
              {Object.entries(settings.adTopics).map(([n, on]) => (
                <button
                  key={n}
                  type="button"
                  className="st-chip"
                  aria-pressed={on}
                  style={on ? { background: 'var(--see-wash-3)', boxShadow: 'none' } : { background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--see-rule)', color: 'var(--see-text-4)', textDecoration: 'line-through' }}
                  onClick={() => set('adTopics', { ...settings.adTopics, [n]: !on })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Toggle k="rankAds" label="Use what I rank to choose my ads" sub="Off: ads follow the page you are on, not you." />
        </>
      );

    case 'help':
      return (
        <>
          <LinkRow label="Help" sub="Answers, and how to reach us" />
          <LinkRow label="Report a problem" sub="With a screenshot if you like" />
          <LinkRow label="Community rules" />
          <LinkRow label="Terms" />
          <LinkRow label="Privacy policy" />
          <LinkRow label="Licences" value="Open source" />
          <div className="st-note" style={{ marginTop: 16, borderLeftColor: 'var(--see-rule)' }}>
            {VERSION}. Made in Lagos and Abuja.
          </div>
        </>
      );
  }
}
