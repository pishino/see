import { useEffect, useRef, useState } from 'react';
import { BY_ID, KIND_PL, embedSnippet, kindOf, slotsOf, shareUrl, templateOf, withOrder, type List, type Place } from '@see/core';
import { drawListCard } from '../../brand/card';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { Dialog } from '../app/PersonView';
import { chartLink, embedLink, templateLink } from './RankYours';
import './share.css';

/*
 * Share (V3IntMap): one link, anywhere. The link carries the list, never your order, never your handle. Places
 * that can run See get it running (Reddit, Discord, an embed); places that only show a picture get the card.
 * Nothing posts until you press post there.
 */
const PLACES: [Place, string][] = [
  ['reddit', 'Reddit'],
  ['discord', 'Discord'],
  ['x', 'X'],
  ['threads', 'Threads'],
  ['bluesky', 'Bluesky'],
  ['whatsapp', 'WhatsApp'],
  ['email', 'Email'],
];

const DISCORD_APP = import.meta.env.VITE_DISCORD_APP_ID as string | undefined;

export function ShareSheet({ L, onClose }: { L: List; onClose: () => void }) {
  const toast = useToast();
  const k = kindOf(L);
  const t = templateOf(L, BY_ID, k && k !== 'mixed' ? KIND_PL[k] : 'Items');
  const link = templateLink(t);
  const mine = slotsOf(L).filter((x): x is string => !!x);
  const myOrder = mine.map((id) => t.items.indexOf(BY_ID[id]?.own ? `~${BY_ID[id].t}|${BY_ID[id].m}` : id)).filter((i) => i >= 0);
  const card = useRef<HTMLCanvasElement>(null);
  const [embed, setEmbed] = useState<'full' | 'compact'>('full');

  useEffect(() => {
    const draw = () =>
      card.current &&
      drawListCard(card.current, {
        name: L.name,
        kicker: `Top ${L.n} · ${t.kind}`,
        rows: mine.slice(0, 3).map((id) => ({ t: BY_ID[id]?.t ?? '', m: BY_ID[id]?.m ?? '' })),
        firstId: mine[0],
      });
    draw();
    document.fonts?.ready.then(draw).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  const copy = (text: string, said: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    toast(said);
  };
  const saveCard = () =>
    card.current?.toBlob(async (b) => {
      if (!b) return;
      const file = new File([b], `${L.name.replace(/[^\w ]+/g, '').replace(/ /g, '-').toLowerCase() || 'see'}.png`, { type: 'image/png' });
      // phones: the system share sheet takes the picture and the link together
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: link }).catch(() => {});
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(a.href);
      toast('The card is saved');
    }, 'image/png');
  const snippet = embedSnippet(embed === 'full' ? embedLink(t) : embedLink(withOrder(t, myOrder)), L.name, embed === 'compact');

  return (
    <Dialog label={`Share ${L.name}`} onClose={onClose}>
      <span className="t-label">Share · one link, anywhere</span>
      <h2 className="t-hero dlg-h">{L.name}</h2>
      <p className="dlg-p">The link carries the list, never your order or your name. Whoever opens it ranks their own.</p>

      <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button size="sm" onClick={() => copy(link, 'Link copied')}>
          Copy the link
        </Button>
        <Button size="sm" variant="quiet" onClick={() => copy(chartLink(withOrder(t, myOrder)), 'Link to your published chart copied')}>
          Copy your published chart
        </Button>
      </span>

      <span className="t-label" style={{ paddingTop: 6 }}>
        Where it goes
      </span>
      <div className="sh-places">
        {PLACES.map(([p, name]) =>
          p === 'discord' ? (
            <button key={p} type="button" className="sh-place" onClick={() => copy(shareUrl('discord', t, link, BY_ID), 'Copied: paste it in any channel that has See')}>
              {name}
            </button>
          ) : (
            <a key={p} className="sh-place" href={shareUrl(p, t, link, BY_ID)} target="_blank" rel="noreferrer">
              {name}
            </a>
          ),
        )}
      </div>
      <p className="t-meta" style={{ whiteSpace: 'normal' }}>
        Reddit gets the list as a post. Discord: paste the command in a server that added See
        {DISCORD_APP ? (
          <>
            {' '}
            (
            <a href={`https://discord.com/oauth2/authorize?client_id=${DISCORD_APP}&scope=applications.commands%20bot`} target="_blank" rel="noreferrer">
              add See to a server
            </a>
            )
          </>
        ) : null}
        . The rest get the card and the link.
      </p>

      <span className="t-label" style={{ paddingTop: 6 }}>
        The card
      </span>
      <canvas ref={card} className="sh-card" aria-label={`A picture of ${L.name}: your top three`} />
      <Button size="sm" variant="quiet" onClick={saveCard} style={{ alignSelf: 'flex-start' }}>
        Save the card
      </Button>

      <span className="t-label" style={{ paddingTop: 6 }}>
        Put it in a page
      </span>
      <span style={{ display: 'flex', gap: 6 }}>
        {(['full', 'compact'] as const).map((v) => (
          <button key={v} type="button" className="choice" aria-pressed={embed === v} onClick={() => setEmbed(v)}>
            {v === 'full' ? 'Full · readers rank' : 'Compact · your top 5'}
          </button>
        ))}
      </span>
      <textarea className="sh-code" readOnly value={snippet} aria-label="Embed code" onFocus={(e) => e.currentTarget.select()} />
      <Button size="sm" variant="quiet" onClick={() => copy(snippet, 'Embed code copied')} style={{ alignSelf: 'flex-start' }}>
        Copy the embed
      </Button>
    </Dialog>
  );
}
