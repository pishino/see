import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BLOCK_SAYS, REPORT_REASONS, newReport, personOf, sharedLists, type ReportReason } from '@see/core';
import { useSettings } from '@see/core/react';
import { Avatar } from '../../brand/Avatar';
import { Icon } from '../../brand/Icon';
import { CategoryTag } from '../../brand/marks';
import { Button } from '../../components/Button';
import { PlusCta, Switch } from '../../components/controls';
import { useToast } from '../../components/Toast';
import { useStore } from '../../data/store';
import { usePhone } from '../../lib/useMediaQuery';
import './you.css';
import './safety.css';

/** A dialog in the middle of the page on wide screens, a sheet from the bottom on phones. Escape or Cancel closes it. */
export function Dialog({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, input')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} className="dlg">
        {children}
      </div>
    </>
  );
}

/** Report: six reasons, one tap. Hide it from me is on by default; Also block is one switch away. */
function ReportDialog({ handle, onClose, onBlocked }: { handle: string; onClose: () => void; onBlocked: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [hide, setHide] = useState(true);
  const [block, setBlock] = useState(false);
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <Dialog label="Report sent" onClose={onClose}>
        <h2 className="t-hero dlg-h">Report sent</h2>
        <p className="dlg-p">{BLOCK_SAYS.sent(handle)}</p>
        <div className="dlg-acts">
          <Button onClick={onClose}>Done</Button>
        </div>
      </Dialog>
    );
  }
  return (
    <Dialog label={`Report @${handle}`} onClose={onClose}>
      <span className="t-label">Report @{handle}</span>
      <h2 className="t-hero dlg-h">What’s wrong?</h2>
      <div role="radiogroup" aria-label="What’s wrong" className="dlg-reasons">
        {REPORT_REASONS.map((r) => (
          <button key={r} type="button" role="radio" aria-checked={reason === r} className="dlg-reason" onClick={() => setReason(r)}>
            <span className="dlg-dot" aria-hidden="true" />
            {r}
          </button>
        ))}
      </div>
      {reason === 'Something else' && (
        <input className="st-input" placeholder="A line to explain" aria-label="A line to explain" value={note} onChange={(e) => setNote(e.target.value)} />
      )}
      <div className="st-line dlg-sw">
        <span>Hide it from me while you look</span>
        <Switch checked={hide} onChange={setHide} label="Hide it from me while you look" />
      </div>
      <div className="st-line dlg-sw">
        <span>Also block @{handle}</span>
        <Switch checked={block} onChange={setBlock} label={`Also block @${handle}`} />
      </div>
      <div className="dlg-acts">
        <Button variant="quiet" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!reason}
          onClick={() => {
            // a server takes the report; nothing is sent until here, and they are never told who reported
            newReport({ kind: 'person', handle }, reason!, { note, hide, block });
            if (block) onBlocked();
            setSent(true);
          }}
        >
          Send report
        </Button>
      </div>
    </Dialog>
  );
}

/** Block: says exactly what changes before it happens. Cancel is the easy one. */
function BlockDialog({ handle, onClose, onBlock }: { handle: string; onClose: () => void; onBlock: () => void }) {
  return (
    <Dialog label={`Block @${handle}?`} onClose={onClose}>
      <h2 className="t-hero dlg-h">Block @{handle}?</h2>
      <p className="dlg-p">{BLOCK_SAYS.confirm(handle)}</p>
      <p className="dlg-p t-meta" style={{ whiteSpace: 'normal' }}>
        They can’t: {BLOCK_SAYS.cant} {BLOCK_SAYS.lists}
      </p>
      <div className="dlg-acts">
        <Button size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="quiet" size="sm" className="dlg-block" onClick={onBlock}>
          Block
        </Button>
      </div>
    </Dialog>
  );
}

/** Every name is a page: their picture, their lists by category, the lists you share, and the ··· menu. */
export function PersonView() {
  const { handle = '' } = useParams();
  const store = useStore();
  const { settings, set } = useSettings();
  const toast = useToast();
  const phone = usePhone();
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState<'report' | 'block' | null>(null);
  const person = personOf(handle);
  if (!person) return <Navigate to="/app/you" replace />;
  const h = person.handle;
  const blocked = settings.blocked.includes(h);
  const following = settings.following.includes(h);
  const shared = sharedLists(h, store.lists);
  const doBlock = () => {
    set('blocked', [...settings.blocked.filter((x) => x !== h), h]);
    set('following', settings.following.filter((x) => x !== h));
    store.dispatch({ type: 'removePerson', handle: h });
    setDialog(null);
  };

  if (blocked) {
    return (
      <div className="yp">
        <div className="yp-head">
          <Avatar handle={h} size={phone ? 54 : 72} ring={false} />
          <div className="yp-who">
            <h1 className="t-hero" style={{ fontSize: phone ? 22 : 36 }}>
              @{h}
            </h1>
            <span className="t-meta">Blocked</span>
          </div>
        </div>
        <div className="ps-state">
          <h2 className="t-title">{BLOCK_SAYS.done(h)}</h2>
          <p className="dlg-p">They can’t find you or see your lists.</p>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => {
              set('blocked', settings.blocked.filter((x) => x !== h));
              toast(`Unblocked @${h}`);
            }}
          >
            Unblock
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="yp">
      <div className="yp-head">
        <Avatar handle={h} size={phone ? 54 : 72} ring={false} />
        <div className="yp-who">
          <h1 className="t-hero" style={{ fontSize: phone ? 22 : 36 }}>
            {person.name}
          </h1>
          <span className="t-meta">@{h} · Member</span>
        </div>
        <PlusCta label={following ? 'Following' : 'Follow'} done={following} onClick={() => set('following', following ? settings.following.filter((x) => x !== h) : [...settings.following, h])} />
        <span style={{ position: 'relative' }}>
          <button type="button" className="icon-btn" aria-label={`More for @${h}`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <Icon name="dots" size={20} color="var(--see-text-2)" />
          </button>
          {menu && (
            <div role="menu" className="menu" style={{ right: 0, top: 46 }} onMouseLeave={() => setMenu(false)}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  navigator.clipboard?.writeText(`${location.origin}/open?link=see://u/${h}`).catch(() => {});
                  setMenu(false);
                  toast('Link to their page copied');
                }}
              >
                Share their page
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenu(false);
                  toast(shared.length ? `You share ${shared.length} ${shared.length === 1 ? 'list' : 'lists'} with @${h}` : `Nothing in common yet`);
                }}
              >
                Compare lists
              </button>
              <hr />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenu(false);
                  setDialog('report');
                }}
              >
                Report @{h}
              </button>
              <button
                type="button"
                role="menuitem"
                style={{ color: 'var(--see-flare-soft)' }}
                onClick={() => {
                  setMenu(false);
                  setDialog('block');
                }}
              >
                Block @{h}
              </button>
            </div>
          )}
        </span>
      </div>

      <div className="yp-bar">
        <span className="t-row-sm" style={{ fontWeight: 600, fontFamily: 'var(--see-font-body)' }}>
          {person.lists.reduce((n, [, ls]) => n + ls.length, 0)} lists · {shared.length} with you · {person.polls} polls
        </span>
      </div>

      {person.lists.map(([cat, names]) => (
        <section key={cat} className="yp-cat" aria-label={cat}>
          <CategoryTag name={cat} height={14} />
          <div className="yp-chips">
            {names.map((n) => (
              <span key={n} className="yp-chip">
                {n}
              </span>
            ))}
          </div>
        </section>
      ))}

      {shared.length > 0 && (
        <section className="yp-cat" aria-labelledby="shared-l">
          <h2 id="shared-l" className="t-label">
            Lists you share
          </h2>
          <div className="yp-chips">
            {shared.map((L) => (
              <Link key={L.id} to={`/app/l/${L.id}`} className="yp-chip">
                {L.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {dialog === 'report' && <ReportDialog handle={h} onClose={() => setDialog(null)} onBlocked={doBlock} />}
      {dialog === 'block' && <BlockDialog handle={h} onClose={() => setDialog(null)} onBlock={doBlock} />}
    </div>
  );
}
