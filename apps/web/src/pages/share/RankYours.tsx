import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  BY_ID,
  agreement,
  canLock,
  crowdOrder,
  decodeTemplate,
  encodeTemplate,
  fillMarkdown,
  itemOf,
  leftToPlace,
  lockIn,
  pad2,
  placeNext,
  search,
  startRank,
  suggestCategory,
  takeBack,
  undoLast,
  withOrder,
  type Template,
} from '@see/core';
import { useStore } from '@see/core/react';
import { Wordmark } from '../../brand/marks';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import './share.css';

/** Where a template link points, on this site. */
export const templateLink = (t: Template) => `${location.origin}${import.meta.env.BASE_URL}t/${encodeTemplate(t)}`;
export const embedLink = (t: Template) => `${location.origin}${import.meta.env.BASE_URL}embed/${encodeTemplate(t)}`;

/**
 * Rank yours (V3IntReddit, V3IntEmbed): top first, one tap per place; tap a placed one to take it back. Lock in
 * saves it to your See and posts nothing; Reply with yours is the only thing that puts your order anywhere. The
 * crowd's order shows after you lock in, when the place keeps one (`crowd`); it never moves yours.
 */
export function RankYours({ t, crowdName = 'community', crowd, onLocked }: { t: Template; crowdName?: string; crowd?: number[][]; onLocked?: (order: number[]) => void }) {
  const store = useStore();
  const toast = useToast();
  const [s, setS] = useState(startRank);
  const [saved, setSaved] = useState<string | null>(null);
  const items = useMemo(() => t.items.map((r) => itemOf(r, BY_ID)), [t]);
  const left = leftToPlace(s, t);
  const crowdOrd = crowd && crowd.length ? crowdOrder([...crowd, ...(s.locked ? [s.order] : [])], t.items.length) : null;
  const agree = crowdOrd ? agreement(s.order, crowdOrd) : null;

  const lock = () => {
    const next = lockIn(s, t);
    if (next === s) return;
    setS(next);
    // saved to your See as a list of your own, in your order; nothing is posted
    const cats = store.categories.map((c) => c.id);
    const cat = suggestCategory(`${t.kind} ${t.name}`, cats) ?? cats[0] ?? 'MUSIC';
    if (!cats.includes(cat)) store.addCategory(cat);
    const ids = next.order.map((i) => {
      const x = items[i];
      return x.id ?? (search(x.t).find((y) => y.t === x.t)?.id || store.addOwn(x.t, 'song').id);
    });
    const L = store.addList(cat, t.name, t.n);
    store.replaceList({ ...L, items: ids });
    setSaved(L.id);
    onLocked?.(next.order);
  };

  const reply = () => {
    const text = fillMarkdown({ template: t, order: s.order, agree, crowdName }, templateLink(withOrder(t, s.order)), BY_ID);
    navigator.clipboard?.writeText(text).catch(() => {});
    toast('Your reply is copied: paste it in the thread');
  };

  if (s.locked) {
    return (
      <section aria-label="Locked in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="t-label">Locked in · saved to your See</span>
        <div className={crowdOrd ? 'tp-cols' : undefined}>
          <div>
            <h3 className="t-label" style={{ paddingBottom: 6 }}>
              Yours
            </h3>
            {s.order.map((i, k) => (
              <div key={i} className="tp-row">
                <span className="t-rank" style={{ color: k === 0 ? 'var(--see-accent)' : undefined }}>
                  {pad2(k + 1)}
                </span>
                <span>
                  <b className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                    {items[i].t}
                  </b>
                  <span className="t-meta" style={{ display: 'block' }}>
                    {items[i].m}
                  </span>
                </span>
                <span>{crowdOrd && crowdOrd[k] === i ? <span className="t-label tp-crowd">Same</span> : null}</span>
              </div>
            ))}
          </div>
          {crowdOrd && (
            <div className="tp-crowd">
              <h3 className="t-label tp-crowd" style={{ paddingBottom: 6 }}>
                The {crowdName} · {crowd!.length + 1}
              </h3>
              {crowdOrd.slice(0, s.order.length).map((i, k) => (
                <div key={i} className="tp-row">
                  <span className="t-rank">{pad2(k + 1)}</span>
                  <b className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                    {items[i].t}
                  </b>
                  <span />
                </div>
              ))}
            </div>
          )}
        </div>
        {agree !== null && (
          <p className="dlg-p">
            You and the {crowdName} agree on <b>{agree} of {t.items.length}</b>. Yours stays exactly as you set it.
          </p>
        )}
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" onClick={reply}>
            Reply with yours
          </Button>
          {saved && (
            <Link className="btn btn--sm btn--quiet" to={`/app/l/${saved}`}>
              Open in See
            </Link>
          )}
        </span>
      </section>
    );
  }

  return (
    <section aria-label="Ranking" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="t-label">
          Your order · {s.order.length} of {t.items.length}
        </span>
        {s.order.length > 0 && (
          <Button size="sm" variant="quiet" onClick={() => setS(undoLast(s))}>
            Undo
          </Button>
        )}
      </div>
      <div>
        {s.order.map((i, k) => (
          <button key={i} type="button" className="tp-row" onClick={() => setS(takeBack(s, i))} aria-label={`No. ${k + 1}: ${items[i].t}. Take it back`}>
            <span className="t-rank" style={{ color: k === 0 ? 'var(--see-accent)' : undefined }}>
              {pad2(k + 1)}
            </span>
            <span>
              <b className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                {items[i].t}
              </b>
              <span className="t-meta" style={{ display: 'block' }}>
                {items[i].m}
              </span>
            </span>
            <span />
          </button>
        ))}
      </div>
      {left.length > 0 && (
        <>
          <span className="t-meta">
            Tap one below for No. {s.order.length + 1} · left to place · {left.length}
          </span>
          <div className="tp-items">
            {left.map((i) => (
              <button key={i} type="button" className="tp-chip" onClick={() => setS(placeNext(s, i))} aria-label={`${items[i].t}: No. ${s.order.length + 1}`}>
                <b>{items[i].t}</b>
                <span>{items[i].m}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <span className="t-meta">{s.order.length ? 'Tap a placed one to take it back.' : 'Nothing posts until you say so.'}</span>
      <Button onClick={lock} disabled={!canLock(s, t)} style={{ alignSelf: 'flex-start' }}>
        Lock in
      </Button>
    </section>
  );
}

function Head({ t, compact = false }: { t: Template; compact?: boolean }) {
  return (
    <>
      <span className="t-label">
        Template · {t.items.length} {t.kind}
      </span>
      <h1 className="t-hero" style={{ fontSize: compact ? 28 : 44 }}>
        {t.name}
      </h1>
      <span className="t-label" style={{ color: 'var(--see-accent-text)' }}>
        Top {t.n}
      </span>
    </>
  );
}

/** A template link (see.app/t/…): the list, someone's locked order if the link carries one, and Rank yours. */
export function TemplatePage() {
  const { code = '' } = useParams();
  const t = decodeTemplate(code);
  const [ranking, setRanking] = useState(false);
  if (!t) {
    return (
      <div className="tp">
        <Wordmark height={26} color="var(--see-flare)" />
        <h1 className="t-hero" style={{ fontSize: 40 }}>
          This link can’t be read
        </h1>
        <p className="dlg-p">It may have been cut short when it was pasted. Ask whoever shared it for the link again.</p>
      </div>
    );
  }
  const items = t.items.map((r) => itemOf(r, BY_ID));
  return (
    <div className="tp">
      <Link to="/app" aria-label="See">
        <Wordmark height={26} color="var(--see-flare)" />
      </Link>
      <Head t={t} />
      {t.order && !ranking && (
        <section aria-label="Their order">
          <span className="t-label">Their top {Math.min(5, t.order.length)} · locked</span>
          {t.order.slice(0, 5).map((i, k) => (
            <div key={i} className="tp-row">
              <span className="t-rank">{pad2(k + 1)}</span>
              <b className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                {items[i]?.t}
              </b>
              <span />
            </div>
          ))}
        </section>
      )}
      {ranking ? (
        <RankYours t={t} />
      ) : (
        <>
          <span className="t-label">In it</span>
          <div className="tp-items">
            {items.map((x, i) => (
              <span key={i} className="tp-chip">
                <b>{x.t}</b>
                <span>{x.m}</span>
              </span>
            ))}
          </div>
          <p className="dlg-p">Your order, top first. The community’s order opens after you lock in.</p>
          <Button onClick={() => setRanking(true)} style={{ alignSelf: 'flex-start' }}>
            Rank yours
          </Button>
          <span className="t-meta">Nothing posts until you say so. Made in See.</span>
        </>
      )}
    </div>
  );
}

/** Rank it in the article (V3IntEmbed): full ranks in place; ?v=compact shows the writer's locked chart. */
export function EmbedPage() {
  const { code = '' } = useParams();
  const [params] = useSearchParams();
  const t = decodeTemplate(code);
  if (!t) return <div className="tp tp--embed">This list can’t be read.</div>;
  const full = templateLink({ ...t, order: undefined });
  if (params.get('v') === 'compact' && t.order) {
    const items = t.items.map((r) => itemOf(r, BY_ID));
    return (
      <div className="tp tp--embed">
        <span className="t-label">The writer’s top {Math.min(5, t.order.length)} · locked</span>
        <h1 className="t-hero" style={{ fontSize: 26 }}>
          {t.name}
        </h1>
        <div>
          {t.order.slice(0, 5).map((i, k) => (
            <div key={i} className="tp-row">
              <span className="t-rank" style={{ color: k === 0 ? 'var(--see-accent)' : undefined }}>
                {pad2(k + 1)}
              </span>
              <span>
                <b className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                  {items[i]?.t}
                </b>
                <span className="t-meta" style={{ display: 'block' }}>
                  {items[i]?.m}
                </span>
              </span>
              <span />
            </div>
          ))}
        </div>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a className="btn btn--sm" href={full} target="_blank" rel="noreferrer">
            Rank yours
          </a>
          {t.items.length > 5 && <span className="t-meta">{t.items.length - 5} more in See</span>}
        </span>
      </div>
    );
  }
  return (
    <div className="tp tp--embed">
      <span className="t-label">
        From the article · {t.items.length} {t.kind.toLowerCase()}
      </span>
      <h1 className="t-hero" style={{ fontSize: 26 }}>
        Rank the {t.items.length} {t.kind.toLowerCase()}
      </h1>
      <RankYours t={t} crowdName="readers" />
    </div>
  );
}

/**
 * A published chart (V3WebList): the list as you ranked it, on the web for anyone with the link. Only you and the
 * people on the list can rank it; anyone can rank their own copy.
 */
export function ChartPage() {
  const { code = '' } = useParams();
  const t = decodeTemplate(code);
  if (!t || !t.order) {
    return (
      <div className="tp">
        <Wordmark height={26} color="var(--see-flare)" />
        <h1 className="t-hero" style={{ fontSize: 40 }}>
          This chart can’t be read
        </h1>
      </div>
    );
  }
  const items = t.items.map((r) => itemOf(r, BY_ID));
  const order = t.order;
  return (
    <div className="tp">
      <Link to="/" aria-label="See">
        <Wordmark height={26} color="var(--see-flare)" />
      </Link>
      <span className="t-label">
        Top {t.n} · {t.kind} · a published chart
      </span>
      <h1 className="t-hero" style={{ fontSize: 44 }}>
        {t.name}
      </h1>
      <div>
        {order.map((i, k) => (
          <a key={i} className="tp-row" href={`https://www.google.com/search?q=${encodeURIComponent(`${items[i]?.t} ${items[i]?.m}`)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <span className="t-rank" style={{ color: k === 0 ? 'var(--see-accent)' : undefined }}>
              {pad2(k + 1)}
            </span>
            <span>
              <b className="t-row-sm" style={{ textTransform: 'uppercase' }}>
                {items[i]?.t}
              </b>
              <span className="t-meta" style={{ display: 'block' }}>
                {items[i]?.m}
              </span>
            </span>
            <span />
          </a>
        ))}
        {Array.from({ length: Math.max(0, t.n - order.length) }, (_, k) => (
          <div key={`o${k}`} className="tp-row">
            <span className="t-rank" style={{ color: 'var(--see-slot)' }}>
              {pad2(order.length + k + 1)}
            </span>
            <span className="t-meta">Open</span>
            <span />
          </div>
        ))}
      </div>
      <span className="t-meta">
        {order.length} of {t.n} · only whoever made it and the people on it can rank it
      </span>
      <span style={{ display: 'flex', gap: 8 }}>
        <Link className="btn btn--sm" to={`/t/${encodeTemplate({ ...t, order: undefined })}`}>
          Rank yours
        </Link>
        <Link className="btn btn--sm btn--quiet" to="/app">
          Open See
        </Link>
      </span>
    </div>
  );
}
export const chartLink = (t: Template) => `${location.origin}${import.meta.env.BASE_URL}chart/${encodeTemplate(t)}`;
