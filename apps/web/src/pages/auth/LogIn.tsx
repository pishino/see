import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFrame, GoArrow, useAuthToast } from './AuthFrame';
import google from '../../assets/logos/google.png';

/** The figure on the last-used account, on the 8-cell grid. */
const ME_D = 'M2 1h4v1H2zM1 2h1v3H1zM6 2h1v3H6zM3 3h2v1H3zM2 5h4v1H2zM1 6h6v2H1z';

/** Log in: the account last used on this device first, then email or a provider. */
export default function LogIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [toast, toastNode] = useAuthToast();
  const go = () => {
    toast('Signed in');
    window.setTimeout(() => navigate('/app'), 500);
  };
  return (
    <AuthFrame word="+" toast={toastNode} onBack={() => navigate('/')}>
      <div className="au-body">
        <h1 className="au-h">Log in</h1>
        <button type="button" className="au-me" onClick={go} aria-label="Continue as @joey, with Google">
          <span
            aria-hidden="true"
            style={{ width: 40, height: 40, background: 'var(--see-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <svg width="22" height="22" viewBox="0 0 8 8" shapeRendering="crispEdges">
              <path d={ME_D} fill="var(--see-flare)" />
            </svg>
          </span>
          <span className="t">
            <b>Continue as @joey</b>
            <span>Google</span>
          </span>
          <span className="au-mego">
            <GoArrow />
          </span>
        </button>
        <form
          className="au-f"
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(email)) {
              toast('Type your email');
              return;
            }
            toast('Code sent');
          }}
        >
          <input type="email" placeholder="Email" aria-label="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="au-go" aria-label="Continue">
            <GoArrow />
          </button>
        </form>
        <div className="au-alt">
          <button type="button" className="au-pill" onClick={go}>
            <span className="au-slot" aria-hidden="true" />
            Apple
          </button>
          <button type="button" className="au-pill" onClick={go}>
            <span className="au-lg">
              <img src={google} alt="" />
            </span>
            Google
          </button>
          <button type="button" className="au-sw" onClick={() => navigate('/signup')}>
            Sign up
          </button>
        </div>
      </div>
    </AuthFrame>
  );
}
