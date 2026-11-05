import { useEffect, useState } from 'react';
import { art, artFor, type ArtItem } from '@see/brand';
import { SPOT, adFor, spotDue, type Ad } from '@see/core';
import { useSettings } from '@see/core/react';
import './ads.css';

/*
 * Ads inside what is there (V3Ads, V3AdsMotion): one on a screen at most, always tagged AD in grey, never in
 * flare or violet, never ranked or added to a list. Video ads are muted, loop twice at most, stop while you type,
 * drag or vote, and hold still for reduced motion. The advertisers are the boards' invented ones.
 */
export function AdTag() {
  return (
    <span className="ad-tag" aria-label="Advertisement">
      AD
    </span>
  );
}

export function useAd(place: Ad['place'], where: { cat?: string; q?: string; xid?: string } = {}) {
  const { settings } = useSettings();
  return adFor(place, settings.adTopics, where);
}

/** The sponsor line in a category's header: a name and the AD tag; no pictures, no colours of theirs. */
export function SponsorLine({ cat }: { cat: string }) {
  const ad = useAd('sponsor', { cat });
  if (!ad) return null;
  return (
    <a className="ad-line" href={ad.url} target="_blank" rel="noreferrer sponsored">
      <AdTag /> {ad.line}
    </a>
  );
}

/** A video ad in the category band (desktop; phones carry it in the masthead row): drawn with motion, muted. */
export function VideoAd({ cat }: { cat: string }) {
  const ad = useAd('video', { cat });
  const { settings } = useSettings();
  const [loops, setLoops] = useState(0);
  const [sound, setSound] = useState(false);
  if (!ad) return null;
  const still = settings.reduceMotion || loops >= 2;
  const it: ArtItem = artFor(ad.id);
  return (
    <a className="ad-video" href={ad.url} target="_blank" rel="noreferrer sponsored" data-still={still || undefined} aria-label={`Advertisement: ${ad.name}. ${ad.line}`}>
      <canvas
        ref={(cv) => {
          if (!cv || cv.dataset.drawn) return;
          cv.dataset.drawn = '1';
          cv.width = 320;
          cv.height = 180;
          const c = cv.getContext('2d');
          if (c) art(c, it, 0, 0, 320, 180);
        }}
        onAnimationIteration={() => setLoops((n) => n + 1)}
        aria-hidden="true"
      />
      <span className="ad-video__line">
        <AdTag /> <b>{ad.name}</b> · {ad.line}
      </span>
      <button
        type="button"
        className="ad-video__sound"
        onClick={(e) => {
          e.preventDefault();
          setSound((s) => !s);
        }}
        aria-pressed={sound}
        aria-label={sound ? 'Sound off for this ad' : 'Sound on for this ad'}
      >
        {sound ? '♪' : '♪̸'}
      </button>
    </a>
  );
}

/** Details already say where a thing plays; one more line says where to buy it. Only on an item you opened. */
export function BuyLine({ xid }: { xid: string }) {
  const ad = useAd('buy', { xid });
  if (!ad) return null;
  return (
    <a className="ad-buy" href={ad.url} target="_blank" rel="noreferrer sponsored">
      <AdTag /> <b>{ad.name}</b> · {ad.line}
    </a>
  );
}

/** The search ad: only when the search matches it, at the far end of the stack. It opens; it never goes in a slot. */
export function SearchAd({ q }: { q: string }) {
  const ad = useAd('search', { q });
  if (!ad) return null;
  return (
    <a className="ad-search" href={ad.url} target="_blank" rel="noreferrer sponsored">
      <AdTag />
      <span>
        <b>{ad.name}</b>
        <span className="t-meta" style={{ display: 'block' }}>
          {ad.line}
        </span>
      </span>
    </a>
  );
}

const SPOT_KEY = 'see.ads.spot';
const lastSpot = () => {
  try {
    return Number(localStorage.getItem(SPOT_KEY) ?? 0);
  } catch {
    return 0;
  }
};

/**
 * A 15-second spot between previews, in the player you already have: the bar turns grey while it runs, Skip after
 * 5 seconds, never inside a preview, at most one every 30 minutes.
 */
export function useSpot(onDone: () => void) {
  const ad = useAd('spot');
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!left) return;
    const t = window.setTimeout(() => (left <= 1 ? (setLeft(0), onDone()) : setLeft(left - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [left, onDone]);
  const start = () => {
    if (!ad || !spotDue(lastSpot(), Date.now())) return false;
    try {
      localStorage.setItem(SPOT_KEY, String(Date.now()));
    } catch {
      /* this visit only */
    }
    setLeft(SPOT.seconds);
    return true;
  };
  const view = left ? (
    <div className="ad-spot" role="status" aria-live="polite">
      <AdTag /> <b>{ad?.name}</b> · {ad?.line}
      <span className="ad-spot__bar" aria-hidden="true">
        <i style={{ width: `${((SPOT.seconds - left) / SPOT.seconds) * 100}%` }} />
      </span>
      {SPOT.seconds - left >= SPOT.skipAfter ? (
        <button type="button" onClick={() => (setLeft(0), onDone())}>
          Skip
        </button>
      ) : (
        <span className="t-meta">Skip in {SPOT.skipAfter - (SPOT.seconds - left)}</span>
      )}
    </div>
  ) : null;
  return { start, view, running: left > 0 };
}
