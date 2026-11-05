import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '@see/core/react';
import { BY_ID, PEOPLE, filledCount, makerLine, slotsOf } from '@see/core';
import { Avatar } from '../../brand/Avatar';
import { Icon } from '../../brand/Icon';
import { CategoryTag } from '../../brand/marks';
import { LOGOS } from '../../brand/logos';
import { ProfilePicture } from '../../brand/ProfilePicture';
import { ButtonLink } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { useStore } from '../../data/store';
import { usePhone } from '../../lib/useMediaQuery';
import { PersonLink } from './PersonLink';
import { usePlayer } from './player';
import { PlayGlyph } from './PlayerView';
import { useUi } from './ui';
import './you.css';

/**
 * Your page (V3ProfileWeb): your picture (the way into Settings), the bell, you at a glance, your No. 1 (it plays in
 * the corner), what you connected (See only reads them), your people, and every list by category.
 * No gear icon anywhere: the picture and the Settings line are the doors.
 */
export function YouView() {
  const store = useStore();
  const { settings } = useSettings();
  const ui = useUi();
  const toast = useToast();
  const navigate = useNavigate();
  const phone = usePhone();
  const player = usePlayer();
  const people = [...new Set(store.lists.flatMap((L) => L.people))];
  const handle = settings.handle.replace(/^@/, '');
  const polls = store.lists.filter((L) => L.poll).length;
  // your No. 1: whatever sits at the top of your pinned list (the first list, if nothing is pinned)
  const top = store.lists.find((L) => L.pinned && slotsOf(L)[0]) ?? store.lists.find((L) => slotsOf(L)[0]);
  const no1 = top ? BY_ID[slotsOf(top)[0]!] : undefined;
  const connected = Object.keys(settings.conn).filter((k) => settings.conn[k]);

  return (
    <div className="yp">
      <div className="yp-head">
        <Link to="/app/settings/profile" className="yp-pic" aria-label="Your picture: edit your profile">
          <ProfilePicture size={phone ? 54 : 72} />
          <span className="yp-edit" aria-hidden="true">
            EDIT
          </span>
        </Link>
        <div className="yp-who">
          <h1 className="t-hero" style={{ fontSize: phone ? 22 : 36 }}>
            {settings.name}
          </h1>
          <span className="t-meta">
            @{handle} · Ranking since 2025
          </span>
          {settings.bio && !phone && <span style={{ fontSize: 14, color: 'var(--see-text-2)' }}>{settings.bio}</span>}
        </div>
        <button
          type="button"
          className="icon-btn yp-bell"
          onClick={() => (phone ? navigate('/app/activity') : ui.openActivity())}
          aria-label={ui.unread ? `Activity: ${ui.unread} new` : 'Activity'}
          style={{ width: 44, height: 44 }}
        >
          <Icon name="bell" size={22} color="var(--see-text)" />
          {ui.unread > 0 && <b aria-hidden="true">{ui.unread}</b>}
        </button>
      </div>

      <div className="yp-grid">
        <div className="yp-col">
          <div className="yp-stats">
            {(
              [
                [store.lists.length, 'Lists'],
                [polls, 'Polls'],
                [people.length, 'People'],
              ] as const
            ).map(([n, l]) => (
              <div key={l} className="yp-stat">
                <span className="t-hero">{n}</span>
                <span className="t-meta">{l}</span>
              </div>
            ))}
          </div>

          {no1 && top && (
            <div className="yp-cat">
              <span className="t-label">Your No. 1</span>
              <button
                type="button"
                className="yp-no1"
                onClick={() => (player.xid === no1.id ? player.toggle() : player.play(no1.id, { listId: top.id, view: 'mini' }))}
                aria-label={`${player.xid === no1.id && player.playing ? 'Pause' : 'Play'} ${no1.t}, your No. 1`}
              >
                <PlayGlyph playing={player.xid === no1.id && player.playing} size={20} color="var(--see-accent)" />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <b className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                    {no1.t}
                  </b>
                  <span className="t-meta">{no1.m || makerLine(no1)} · plays in the corner</span>
                </span>
              </button>
            </div>
          )}

          <div className="yp-cat">
            <span className="t-label">Connected</span>
            {connected.length ? (
              <div className="yp-chips">
                {connected.map((n) => (
                  <Link key={n} to="/app/settings/services" className="yp-chip yp-conn">
                    {LOGOS[n] ? <img src={LOGOS[n]} alt="" width={18} height={18} /> : <i aria-hidden="true" />}
                    {n}
                  </Link>
                ))}
              </div>
            ) : (
              <Link to="/app/settings/services" className="t-meta" style={{ color: 'var(--see-text-2)' }}>
                Nothing connected yet. See only reads what you connect.
              </Link>
            )}
          </div>
        </div>

        {people.length > 0 && (
          <section className="yp-col" aria-labelledby="yp-people">
            <h2 id="yp-people" className="t-label">
              Your people
            </h2>
            <div>
              {people.map((h) => {
                const on = store.lists.filter((L) => L.people.includes(h)).length;
                return (
                  <PersonLink key={h} handle={h} className="yp-person" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <Avatar handle={h} size={26} ring={false} />
                    <span className="t-row-sm">@{h}</span>
                    <span className="t-meta" aria-label={PEOPLE[h]}>
                      On {on} of your lists
                    </span>
                  </PersonLink>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <section className="yp-cat" aria-label="Panels and saved lists">
        <span className="t-label">Panels</span>
        <div className="yp-chips">
          <Link to="/app/g/lagos-desk" className="yp-chip">
            The Lagos music desk <span>7 members</span>
          </Link>
        </div>
        {(settings.savedLists ?? []).length > 0 && (
          <>
            <span className="t-label" style={{ paddingTop: 8 }}>
              Saved lists
            </span>
            <div className="yp-chips">
              {settings.savedLists.map((k) => {
                const [h, n] = k.split('/');
                return (
                  <Link key={k} to={`/app/u/${h}/l/${encodeURIComponent(n)}`} className="yp-chip">
                    {n} <span>@{h}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      <div className="yp-bar">
        <span className="t-row-sm" style={{ fontWeight: 600, fontFamily: 'var(--see-font-body)' }}>
          {store.lists.length} lists · {store.categories.length} categories
        </span>
        <div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Share your page"
            onClick={() => {
              navigator.clipboard?.writeText(`${location.origin}${import.meta.env.BASE_URL}u/${handle}`).catch(() => {});
              toast('Link to your page copied');
            }}
          >
            <Icon name="share" size={18} color="var(--see-text-2)" />
          </button>
          <ButtonLink to="/app/settings" variant="quiet" size="sm">
            Settings
          </ButtonLink>
        </div>
      </div>

      {store.categories.map((c) => {
        const lists = store.listsIn(c.id);
        if (!lists.length) return null;
        return (
          <section key={c.id} className="yp-cat" aria-label={c.name}>
            <Link to={`/app/c/${encodeURIComponent(c.id)}`} aria-label={`Open ${c.name.toLowerCase()}`} style={{ alignSelf: 'flex-start' }}>
              <CategoryTag name={c.name} height={14} decorative />
            </Link>
            <div className="yp-chips">
              {lists.map((L) => {
                const n = filledCount(L);
                return (
                  <Link key={L.id} to={`/app/l/${L.id}`} className="yp-chip">
                    {L.name}
                    <span>{n === L.n ? n : `${n}/${L.n}`}</span>
                    {L.poll && <span style={{ color: 'var(--see-violet-text)', fontWeight: 600 }}>Poll</span>}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

    </div>
  );
}
