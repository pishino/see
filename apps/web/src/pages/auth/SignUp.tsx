import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthFrame, GoArrow, useAuthToast } from './AuthFrame';
import spotify from '../../assets/logos/spotify.png';
import youtube from '../../assets/logos/youtube.png';
import netflix from '../../assets/logos/netflix.png';
import letterboxd from '../../assets/logos/letterboxd.png';
import google from '../../assets/logos/google.png';

const CATS = ['MUSIC', 'FILMS', 'SHOWS', 'BOOKS', 'PODCASTS', 'GAMES', 'TEAMS'];
const SERVICES: [string, string | null][] = [
  ['Spotify', spotify],
  ['YouTube', youtube],
  ['Netflix', netflix],
  ['Letterboxd', letterboxd],
  ['Apple Music', null],
  ['Goodreads', null],
];
const SUGGESTIONS: [string, string][] = [
  ['Lonely At The Top', 'Asake'],
  ['Water', 'Tyla'],
  ['Rush', 'Ayra Starr'],
];
const CHECK_D = 'M6.2 11.6 2.6 8l1.4-1.4 2.2 2.2L12 3l1.4 1.4z';

/** Sign up, four steps on the flood: what you rank, the code, what you use, your first list. */
export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [toast, toastNode] = useAuthToast();

  const lastPicked = picked[picked.length - 1] ?? null;
  const word = step === 1 ? hover ?? lastPicked ?? '+' : lastPicked ?? 'MUSIC';
  const back = () => (step > 1 ? setStep(step - 1) : navigate('/'));

  return (
    <AuthFrame word={word} step={step} onBack={back} toast={toastNode}>
      {step === 1 && (
        <div className="au-body" key="s1">
          <h1 className="au-h">What do you rank?</h1>
          <div className="au-chips" role="group" aria-label="What you rank" onPointerLeave={() => setHover(null)}>
            {CATS.map((c) => (
              <button
                key={c}
                type="button"
                className="au-chip"
                aria-pressed={picked.includes(c)}
                onPointerEnter={() => setHover(c)}
                onFocus={() => setHover(c)}
                onBlur={() => setHover(null)}
                onClick={() => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))}
              >
                {c}
              </button>
            ))}
          </div>
          <form
            className="au-f"
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\S+@\S+\.\S+$/.test(email)) {
                toast('Type your email');
                return;
              }
              toast('Code sent');
              setStep(2);
            }}
          >
            <input type="email" placeholder="Email" aria-label="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="submit" className="au-go" aria-label="Continue">
              <GoArrow />
            </button>
          </form>
          <div className="au-alt">
            <button type="button" className="au-pill" onClick={() => setStep(3)}>
              <span className="au-slot" aria-hidden="true" />
              Apple
            </button>
            <button type="button" className="au-pill" onClick={() => setStep(3)}>
              <span className="au-lg">
                <img src={google} alt="" />
              </span>
              Google
            </button>
            <button type="button" className="au-sw" onClick={() => navigate('/login')}>
              Log in
            </button>
          </div>
          <p className="au-legal">
            By continuing you accept the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy notice</Link>.
          </p>
        </div>
      )}
      {step === 2 && <CodeStep email={email || 'joey@example.com'} onDone={() => setStep(3)} toast={toast} />}
      {step === 3 && <ConnectStep onNext={() => setStep(4)} />}
      {step === 4 && (
        <FirstListStep
          category={lastPicked ?? 'MUSIC'}
          onDone={() => {
            toast('Your list is saved');
            window.setTimeout(() => navigate('/app'), 600);
          }}
        />
      )}
    </AuthFrame>
  );
}

function CodeStep({ email, onDone, toast }: { email: string; onDone: () => void; toast: (s: string) => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);
  const latest = useRef({ onDone, toast });
  latest.current = { onDone, toast };
  useEffect(() => {
    if (digits.every(Boolean)) {
      latest.current.toast('Verified');
      const t = window.setTimeout(() => latest.current.onDone(), 500);
      return () => window.clearTimeout(t);
    }
  }, [digits]);
  return (
    <div className="au-body" key="s2">
      <h1 className="au-h">Enter the code</h1>
      <span className="au-s">Sent to {email}</span>
      <div className="au-code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="au-dg"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            value={d}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(-1);
              setDigits((ds) => ds.map((x, j) => (j === i ? v : x)));
              if (v) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !d) refs.current[i - 1]?.focus();
            }}
            onPaste={(e) => {
              const v = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
              if (v.length > 1) {
                e.preventDefault();
                setDigits((ds) => ds.map((x, j) => v[j] ?? x));
              }
            }}
          />
        ))}
      </div>
      <button type="button" className="au-sw" onClick={() => toast('Sent again')}>
        Send again
      </button>
    </div>
  );
}

function ConnectStep({ onNext }: { onNext: () => void }) {
  const [linked, setLinked] = useState<string[]>([]);
  return (
    <div className="au-body" key="s3">
      <h1 className="au-h">Link what you use</h1>
      <div className="au-rows">
        {SERVICES.map(([name, logo]) => {
          const on = linked.includes(name);
          return (
            <div className="au-row" key={name}>
              {logo ? (
                <span className="au-lg">
                  <img src={logo} alt="" />
                </span>
              ) : (
                <span className="au-slot" aria-hidden="true" />
              )}
              <span className="n">{name}</span>
              <button
                type="button"
                className="au-link"
                aria-pressed={on}
                aria-label={on ? `${name}: linked` : `Link ${name}`}
                onClick={() => setLinked((l) => (on ? l.filter((x) => x !== name) : [...l, name]))}
              >
                {on && (
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d={CHECK_D} fill="currentColor" />
                  </svg>
                )}
                {on ? 'Linked' : 'Link'}
              </button>
            </div>
          );
        })}
      </div>
      <div className="au-next">
        <button type="button" className="au-btn" onClick={onNext}>
          Continue
        </button>
        <button type="button" className="au-sw" onClick={onNext}>
          Skip
        </button>
      </div>
    </div>
  );
}

function FirstListStep({ category, onDone }: { category: string; onDone: () => void }) {
  const [size, setSize] = useState(10);
  const [first, setFirst] = useState('');
  const [done, setDone] = useState(false);
  return (
    <div className="au-body" key="s4">
      <h1 className="au-h">
        Top {size} {category.toLowerCase()}
      </h1>
      <div className="au-chips" role="group" aria-label="Size">
        {[5, 10, 20, 50].map((n) => (
          <button key={n} type="button" className="au-chip" aria-pressed={size === n} onClick={() => setSize(n)}>
            Top {n}
          </button>
        ))}
      </div>
      <div className="au-f au-find" data-done={done}>
        <span className="au-no" aria-hidden="true">
          01
        </span>
        <input
          type="text"
          placeholder="Find No. 1"
          aria-label="Find No. 1"
          value={first}
          onChange={(e) => {
            setFirst(e.target.value);
            setDone(false);
          }}
        />
      </div>
      {!done && (
        <div className="au-sugs">
          {SUGGESTIONS.filter(([t, by]) => !first || `${t} ${by}`.toLowerCase().includes(first.toLowerCase())).map(([t, by]) => (
            <button
              key={t}
              type="button"
              className="au-sug"
              onClick={() => {
                setFirst(t);
                setDone(true);
              }}
            >
              <b>{t}</b>
              <span>{by}</span>
            </button>
          ))}
        </div>
      )}
      <div className="au-next">
        <button type="button" className="au-btn" onClick={onDone}>
          Start ranking
        </button>
      </div>
    </div>
  );
}
