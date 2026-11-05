import { useMemo, useState } from 'react';
import { EMAILS, samples } from '@see/emails';
import { Wordmark } from '../brand/marks';
import './share/share.css';

/** The six emails (V3Emails), as a mail client shows them, with when each is sent and what turns it off. */
export function EmailsPreview() {
  const all = useMemo(() => samples({ site: `${location.origin}${import.meta.env.BASE_URL}`, address: '[postal address]' }), []);
  const [id, setId] = useState<string>(EMAILS[0].id);
  const e = all[id];
  const meta = EMAILS.find((x) => x.id === id)!;
  return (
    <div className="tp" style={{ maxWidth: 1200 }}>
      <Wordmark height={24} color="var(--see-flare)" />
      <span className="t-label">Emails · the six See sends</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 280px) minmax(0, 1fr)', gap: 24 }}>
        <nav aria-label="Emails" style={{ display: 'flex', flexDirection: 'column' }}>
          {EMAILS.map((x, i) => (
            <button key={x.id} type="button" className="tp-row" aria-pressed={x.id === id} onClick={() => setId(x.id)} style={{ gridTemplateColumns: '28px 1fr', background: x.id === id ? 'var(--see-surface-1)' : undefined }}>
              <span className="t-rank">{i + 1}</span>
              <span>
                <b className="t-row-sm">{x.name}</b>
                <span className="t-meta" style={{ display: 'block', whiteSpace: 'normal' }}>
                  {x.sent}
                </span>
              </span>
            </button>
          ))}
        </nav>
        <section aria-label={meta.name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="t-meta" style={{ whiteSpace: 'normal' }}>
            <b style={{ color: 'var(--see-text)' }}>From</b> See &lt;hello@see.app&gt; · <b style={{ color: 'var(--see-text)' }}>Subject</b> {e.subject}
          </span>
          <span className="t-meta" style={{ whiteSpace: 'normal' }}>
            <b style={{ color: 'var(--see-text)' }}>Preview</b> {e.preheader} · <b style={{ color: 'var(--see-text)' }}>Turned off by</b> {meta.off}
          </span>
          <iframe title={meta.name} srcDoc={e.html} style={{ width: '100%', height: 900, border: '1px solid var(--see-rule)', background: '#0B0F0E' }} />
        </section>
      </div>
    </div>
  );
}
