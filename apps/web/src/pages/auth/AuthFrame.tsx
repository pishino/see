import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wordmark, PLUS_12 } from '../../brand/marks';
import { useMediaQuery } from '../../lib/useMediaQuery';
import './auth.css';

const BACK_D = 'M19 10H6.8l5-5L10.4 3.6 3 11l7.4 7.4 1.4-1.4-5-5H19z';
export const GO_D = 'M3 9h10.2l-4-4L10.6 3.6 17 10l-6.4 6.4-1.4-1.4 4-4H3z';

let measureCtx: CanvasRenderingContext2D | null = null;
function textWidth(text: string, px: number) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  if (!measureCtx) return text.length * px * 0.8;
  measureCtx.font = `900 ${px}px Archivo, sans-serif`;
  return measureCtx.measureText(text.toUpperCase()).width;
}

/** The box beside see: a plus, or the name of what you rank. Its width follows the word. */
export function AuthMark({ word }: { word: string }) {
  const phone = useMediaQuery('(max-width: 720px)');
  const h = phone ? 17.92 : 29.12;
  const [, force] = useState(0);
  // re-measure once the display face has loaded
  useEffect(() => {
    document.fonts?.ready.then(() => force((n) => n + 1));
  }, []);
  const plus = !word || word === '+';
  const w = plus ? (h * 38) / 28 : Math.ceil(textWidth(word, h * 0.74) + h * 0.62);
  return (
    <Link to="/" className="au-mk" aria-label="See: home">
      <Wordmark height={phone ? 22.4 : 29.12} color="var(--see-on-flare)" className="au-mk__see" />
      <span className="au-box" style={{ width: w }} aria-hidden="true">
        <span className="au-lab">
          {plus ? (
            <svg viewBox="0 0 12 12" style={{ width: (h * 17) / 28, height: (h * 17) / 28 }}>
              <path d={PLUS_12} fill="currentColor" />
            </svg>
          ) : (
            word
          )}
        </span>
      </span>
    </Link>
  );
}

export function useAuthToast() {
  const [text, setText] = useState('');
  const [on, setOn] = useState(false);
  const t = useRef(0);
  const show = useCallback((s: string) => {
    setText(s);
    setOn(true);
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setOn(false), 1800);
  }, []);
  const node = (
    <div className="au-toast" data-on={on} role="status" aria-live="polite">
      {text}
    </div>
  );
  return [show, node] as const;
}

/** The orange flood every sign-up and log-in screen stands on. */
export function AuthFrame({
  word,
  step,
  onBack,
  children,
  toast,
}: {
  word: string;
  step?: number;
  onBack?: () => void;
  children: ReactNode;
  toast?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <main className="au">
      <AuthMark word={word} />
      {step !== undefined && (
        <ol className="au-steps" aria-label={`Step ${step} of 4`}>
          {[1, 2, 3, 4].map((i) => (
            <li key={i} data-on={i <= step} />
          ))}
        </ol>
      )}
      <button type="button" className="au-back" aria-label="Back" onClick={onBack ?? (() => navigate(-1))}>
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <path d={BACK_D} fill="currentColor" />
        </svg>
      </button>
      {children}
      {toast}
    </main>
  );
}

export function GoArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d={GO_D} fill="var(--see-on-flare)" />
    </svg>
  );
}
