import { useEffect, useState } from 'react';
import { LOGOBOX, logoBoxFrame } from '@see/brand';

/*
 * Launch (V3LogoBox C, V3Handoff "launch 520 + 8 × 55 + 380, steps(8)"): see in the box holds, squeezes to the + box
 * in eight frames, then fades and the masthead takes over. Once per visit; reduced motion skips it.
 */
const KEY = 'see.launched';

function shouldPlay(): boolean {
  try {
    if (sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* no storage: play it */
  }
  const reduce = document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  return !reduce;
}

export function Launch() {
  const [on] = useState(shouldPlay);
  const [frame, setFrame] = useState(0);
  const [out, setOut] = useState(false);
  const [gone, setGone] = useState(!on);

  useEffect(() => {
    if (!on) return;
    const ts: number[] = [];
    for (let i = 1; i < LOGOBOX.steps; i++) ts.push(window.setTimeout(() => setFrame(i), LOGOBOX.hold + i * LOGOBOX.beat));
    const end = LOGOBOX.hold + LOGOBOX.steps * LOGOBOX.beat;
    ts.push(window.setTimeout(() => setOut(true), end));
    ts.push(window.setTimeout(() => setGone(true), end + LOGOBOX.out));
    return () => ts.forEach(clearTimeout);
  }, [on]);

  if (gone) return null;
  const f = logoBoxFrame(frame / (LOGOBOX.steps - 1));
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--see-z-launch)' as unknown as number,
        background: 'var(--see-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: out ? 0 : 1,
        transition: `opacity ${LOGOBOX.out}ms cubic-bezier(.5,0,.8,.4)`,
        pointerEvents: out ? 'none' : 'auto',
      }}
    >
      <svg viewBox={LOGOBOX.viewBox} style={{ width: 'min(64vw, 420px)', display: 'block' }}>
        <path d={f.box + f.holes} fill="var(--see-flare)" fillRule="evenodd" />
      </svg>
    </div>
  );
}
