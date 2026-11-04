import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { PlusBox } from '../brand/marks';

interface ToastMsg {
  id: number;
  text: string;
  undo?: () => void;
}

const ToastCtx = createContext<(text: string, undo?: () => void) => void>(() => {});

/** One toast at a time. It holds 2 s, or 3.6 s when it has Undo; the box ticks beside it. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const [frame, setFrame] = useState(0);
  const timer = useRef<number>(0);
  const show = useCallback((text: string, undo?: () => void) => {
    window.clearTimeout(timer.current);
    setMsg({ id: Date.now(), text, undo });
    timer.current = window.setTimeout(() => setMsg(null), undo ? 3600 : 2000);
  }, []);

  // the box turns its plus into a tick: six frames, 45 ms apart
  useEffect(() => {
    if (!msg) return;
    setFrame(0);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFrame(5);
      return;
    }
    let f = 0;
    const iv = window.setInterval(() => {
      f += 1;
      setFrame(f);
      if (f >= 5) window.clearInterval(iv);
    }, 45);
    return () => window.clearInterval(iv);
  }, [msg]);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div role="status" aria-live="polite">
        {msg && (
          <div className="toast" key={msg.id}>
            <PlusBox height={20} frame={frame} color="var(--see-flare)" />
            <span>{msg.text}</span>
            {msg.undo && (
              <button
                type="button"
                onClick={() => {
                  msg.undo?.();
                  setMsg(null);
                }}
              >
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
