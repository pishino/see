import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PRIVACY, TERMS, type LegalDoc } from '@see/core';
import { Wordmark } from '../../brand/marks';
import './legal.css';

/*
 * Reading Terms or Privacy (V3Behaviour 3): the header and the contents step back at 4 s, slowly; the text stays, and
 * a thin line shows how far you are. Move and they are back at once.
 */
export function Legal({ doc }: { doc: 'terms' | 'privacy' }) {
  const d: LegalDoc = doc === 'terms' ? TERMS : PRIVACY;
  const other = doc === 'terms' ? { to: '/privacy', label: 'Privacy' } : { to: '/terms', label: 'Terms' };
  const [idle, setIdle] = useState(false);
  const [read, setRead] = useState(0);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `${d.title} · See`;
    window.scrollTo({ top: 0 });
  }, [d.title]);

  useEffect(() => {
    let t = window.setTimeout(() => setIdle(true), 4000);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setIdle(true), 4000);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setRead(max > 0 ? Math.min(1, window.scrollY / max) : 1);
    };
    onScroll();
    window.addEventListener('pointermove', wake);
    window.addEventListener('keydown', wake);
    window.addEventListener('touchstart', wake, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('touchstart', wake);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="lg" data-idle={idle || undefined}>
      <div ref={bar} className="lg-read" aria-hidden="true" style={{ transform: `scaleX(${read})` }} />
      <header className="lg-head lg-fades">
        <Link to="/" aria-label="See: home">
          <Wordmark height={24} color="var(--see-flare)" />
        </Link>
        <nav className="lg-other">
          <Link to={other.to}>{other.label}</Link>
          <Link to="/app">Open See</Link>
        </nav>
      </header>
      <div className="lg-body">
        <nav className="lg-toc lg-fades" aria-label="Contents">
          <span className="t-label">Contents</span>
          {d.sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.h}
            </a>
          ))}
        </nav>
        <article className="lg-text">
          <span className="t-label">Updated {d.updated}</span>
          <h1 className="t-hero">{d.title}</h1>
          <p className="lg-intro">{d.intro}</p>
          {d.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`} className="t-title">
                {s.h}
              </h2>
              {s.p.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
