import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '@see/core/react';
import { PEOPLE, filledCount } from '@see/core';
import { Avatar } from '../../brand/Avatar';
import { Icon } from '../../brand/Icon';
import { CategoryTag } from '../../brand/marks';
import { ProfilePicture } from '../../brand/ProfilePicture';
import { ButtonLink } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { useStore } from '../../data/store';
import { usePhone } from '../../lib/useMediaQuery';
import { useUi } from './ui';
import './you.css';

/**
 * Your page: your picture (the way into Settings), the bell, every list by category, your people.
 * No gear icon anywhere: the picture and the Settings line are the doors.
 */
export function YouView() {
  const store = useStore();
  const { settings } = useSettings();
  const ui = useUi();
  const toast = useToast();
  const navigate = useNavigate();
  const phone = usePhone();
  const people = [...new Set(store.lists.flatMap((L) => L.people))];
  const handle = settings.handle.replace(/^@/, '');

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
              navigator.clipboard?.writeText(`${location.origin}/u/${handle}`).catch(() => {});
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

      {people.length > 0 && (
        <section aria-labelledby="yp-people">
          <h2 id="yp-people" className="t-label" style={{ paddingBottom: 8 }}>
            Your people
          </h2>
          {people.map((h) => {
            const on = store.lists.filter((L) => L.people.includes(h)).length;
            return (
              <div key={h} className="yp-person">
                <Avatar handle={h} size={26} ring={false} />
                <span className="t-row-sm">@{h}</span>
                <span className="t-meta" aria-label={PEOPLE[h]}>
                  On {on} of your lists
                </span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
