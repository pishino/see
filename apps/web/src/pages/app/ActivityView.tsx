import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { routeOf } from '@see/core';
import { Icon } from '../../brand/Icon';
import { ButtonLink } from '../../components/Button';
import { useUi } from './ui';
import './you.css';

/**
 * Activity: today, this week, earlier. Each line says what happened and where to go; the accent line is the way
 * there. New lines sit on a lighter band with the accent dot; opening Activity marks them seen.
 */
export function ActivityList({ onGo }: { onGo?: () => void }) {
  const ui = useUi();
  const groups = ['Today', 'This week', 'Earlier'] as const;
  // opening Activity marks everything seen; the band stays on what was new for this look
  const [fresh] = useState(() => new Set(ui.activity.filter((a) => a.unread).map((a) => a.id)));
  const { markSeen } = ui;
  useEffect(() => markSeen(), [markSeen]);
  return (
    <div className="act">
      {groups.map((g) => {
        const rows = ui.activity.filter((a) => a.group === g);
        if (!rows.length) return null;
        return (
          <section key={g} aria-label={g}>
            <h2 className="t-label act-group">{g}</h2>
            {rows.map((a) => (
              <div key={a.id} className="act-row" data-unread={fresh.has(a.id)}>
                <Icon name={a.icon} size={16} color="var(--see-text-2)" style={{ marginTop: 2 }} />
                <p>
                  {fresh.has(a.id) && <span className="visually-hidden">New: </span>}
                  {a.text}
                </p>
                <time>{a.when}</time>
                <Link to={routeOf(a.link)} onClick={onGo}>
                  {a.action}
                </Link>
              </div>
            ))}
          </section>
        );
      })}
      <div style={{ paddingTop: 20 }}>
        <ButtonLink to="/app/settings/notif" variant="quiet" size="sm" onClick={onGo}>
          Settings
        </ButtonLink>
      </div>
    </div>
  );
}

/** Phones: Activity is its own page, from the bell on your page. */
export function ActivityView() {
  return (
    <div className="st">
      <Link to="/app/you" className="st-back" aria-label="Back to You">
        <Icon name="back" size={20} color="var(--see-text)" />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="t-label" style={{ fontSize: 9.5 }}>
            You
          </span>
          <h1 className="t-hero" style={{ fontSize: 22 }}>
            Activity
          </h1>
        </span>
      </Link>
      <ActivityList />
    </div>
  );
}
