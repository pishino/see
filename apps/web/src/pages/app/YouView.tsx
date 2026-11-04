import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfilePicture } from '../../brand/ProfilePicture';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { useStore } from '../../data/store';
import { readAppearance, setAppearance, type Appearance } from '../../lib/appearance';

/** You: your page and the settings that matter here. Dark by default; light is a choice. */
export function YouView() {
  const store = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [look, setLook] = useState<Appearance>(readAppearance);
  useEffect(() => setAppearance(look), [look]);
  const lists = store.lists.length;
  return (
    <div className="you">
      <div className="you__who">
        <ProfilePicture size={72} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 className="t-hero" style={{ fontSize: 36 }}>
            Joey
          </h1>
          <span className="t-meta">
            @joey · {lists} lists · {store.categories.length} categories
          </span>
        </div>
      </div>

      <section aria-labelledby="look">
        <h2 id="look" className="t-label" style={{ paddingBottom: 8 }}>
          Display
        </h2>
        <div className="set-row">
          <span style={{ fontSize: 15, fontWeight: 600 }}>Appearance</span>
          <div className="chip-row" role="radiogroup" aria-label="Appearance">
            {(
              [
                ['dark', 'Dark'],
                ['light', 'Light'],
                ['system', 'Match device'],
              ] as [Appearance, string][]
            ).map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={look === v} aria-pressed={look === v} className="choice" onClick={() => setLook(v)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button
          variant="quiet"
          size="sm"
          onClick={() => {
            store.reset();
            toast('Lists back to the start');
          }}
        >
          Reset lists
        </Button>
        <Button variant="quiet" size="sm" onClick={() => navigate('/login')}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
