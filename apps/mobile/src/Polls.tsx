/*
 * Polls on the phone (V3PollsApp, V3PollPhone): your polls in tabs, making one in three steps, playing two at a
 * time until one is left, the winner filling the screen, what everyone picked, the results, and the next poll.
 * The same game as the web, from @see/core, kept with your lists.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import {
  BY_ID,
  ENDS,
  MAKE_STEPS,
  MODES,
  PICK_RUN,
  POLL_EMPTY,
  POLL_MIN,
  POLL_SEED,
  POLL_TABS,
  VOTE_SAYS,
  WHO,
  endingOf,
  freshGame,
  gameOf,
  itemsFromList,
  leftOf,
  newPoll,
  pairOf,
  pasteItems,
  pickSide,
  pollCard,
  pollGroups,
  votePause,
  type Game,
  type List,
  type Mode,
  type PollDef,
  type PollTab,
} from '@see/core';
import { useSettings, useStore } from '@see/core/react';
import { size } from '@see/tokens';
import { PlusField } from './Field';
import { PlusBox, Wordmark } from './marks';
import { Button } from './Screens';
import type { C } from './theme';
import { Txt } from './type';

const TONES = ['#191C2B', '#1E1A2E', '#17202A', '#211A26'];
const label = { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const };

function listPolls(lists: List[]): PollDef[] {
  return lists
    .filter((L) => L.poll)
    .map((L) => ({ id: `list-${L.id}`, q: `${L.name}: what’s No. 1?`, cat: L.cat, mode: 'stay' as Mode, by: 'you', ends: 'Open', items: itemsFromList(L, (id) => BY_ID[id] && { t: BY_ID[id].t, m: BY_ID[id].m }) }))
    .filter((p) => p.items.length >= POLL_MIN);
}

export function Polls({ c }: { c: C }) {
  const store = useStore();
  const all = useMemo(() => [...listPolls(store.lists), ...POLL_SEED, ...(store.polls ?? [])], [store.lists, store.polls]);
  const games = store.games ?? {};
  const groups = pollGroups(all, games);
  const [tab, setTab] = useState<PollTab>('play');
  const [view, setView] = useState<'home' | 'make' | 'play'>('home');
  const [pid, setPid] = useState<string | null>(null);
  const [mast, setMast] = useState({ w: 0, h: 0 });
  const p = all.find((x) => x.id === pid);
  const open = (x: PollDef) => {
    setPid(x.id);
    setView('play');
  };
  const next = () => {
    const n = all.find((x) => x.id !== pid && !x.closed && !gameOf(x, games).done);
    if (n) open(n);
    else setView('home');
  };

  if (view === 'make') return <MakePoll c={c} onCancel={() => setView('home')} onMade={(x) => (store.dispatch({ type: 'addPoll', poll: x }), setTab('made'), open(x))} />;
  if (view === 'play' && p) return <PlayPoll key={p.id} c={c} p={p} game={gameOf(p, games)} others={all.filter((x) => x.id !== p.id)} games={games} onOpen={open} onNext={next} onBack={() => setView('home')} />;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: size['gutter-phone'], paddingTop: 0, paddingBottom: 40, gap: 12 }}>
      <View style={{ marginHorizontal: -size['gutter-phone'], paddingHorizontal: size['gutter-phone'], paddingTop: 16, paddingBottom: 18, overflow: 'hidden' }} onLayout={(e) => setMast({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <PlusField width={mast.w} height={mast.h} color={c.violet} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Wordmark height={30} color={c.violet} />
            <PlusBox height={24} color={c.violet} />
          </View>
          <Pressable onPress={() => setView('make')} accessibilityLabel="Make a poll" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <PlusBox height={26} color={c.violet} />
          </Pressable>
        </View>
      </View>
      <Txt style={[label, { color: c['violet-text'] }]}>Your polls</Txt>
      <View style={{ flexDirection: 'row', gap: 20, borderBottomWidth: 1, borderBottomColor: c['surface-2'] }} accessibilityRole="tablist">
        {POLL_TABS.map(([k, name]) => (
          <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="tab" aria-selected={tab === k} style={{ paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: tab === k ? c.violet : 'transparent', marginBottom: -1 }}>
            <Txt style={{ color: tab === k ? c.text : c['text-3'], fontWeight: '600', fontSize: 14 }}>
              {name} <Txt style={{ color: c['text-3'], fontSize: 13 }}>{groups[k].length}</Txt>
            </Txt>
          </Pressable>
        ))}
      </View>
      {groups[tab].map((x) => {
        const k = pollCard(x, gameOf(x, games));
        return (
          <Pressable key={x.id} onPress={() => open(x)} accessibilityLabel={`${x.q}, ${k.act}`} style={{ backgroundColor: c['surface-1'], padding: 14, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt style={[label, { color: c['violet-text'], flexShrink: 1 }]}>{k.kick}</Txt>
              <Txt style={[label, { color: c['text-3'] }]}>{k.ends}</Txt>
            </View>
            <Txt style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{k.q}</Txt>
            <Txt style={{ color: c['text-3'], fontSize: 12 }}>{k.meta}</Txt>
            <Txt style={{ color: c.text, fontSize: 12.5, fontWeight: '700' }}>{k.act}</Txt>
          </Pressable>
        );
      })}
      {groups[tab].length === 0 && (
        <View style={{ gap: 10 }}>
          <Txt style={{ color: c['text-3'], fontSize: 13 }}>{POLL_EMPTY[tab]}</Txt>
          <Button label="Make a poll" c={c} violet onPress={() => setView('make')} />
        </View>
      )}
    </ScrollView>
  );
}

function PlayPoll({ c, p, game, others, games, onOpen, onNext, onBack }: { c: C; p: PollDef; game: Game; others: PollDef[]; games: Record<string, Game>; onOpen: (x: PollDef) => void; onNext: () => void; onBack: () => void }) {
  const store = useStore();
  const { settings } = useSettings();
  const n = p.items.length;
  const [hist, setHist] = useState<Game[]>([]);
  const [phase, setPhase] = useState(game.done || p.closed ? 4 : 0);
  const [wside, setWside] = useState<'a' | 'b'>('a');
  const [times, setTimes] = useState<number[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const wait = game.done ? 0 : votePause(times, now, PICK_RUN);
  useEffect(() => {
    if (!wait) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [wait]);
  const save = (g: Game | null) => store.dispatch({ type: 'saveGame', id: p.id, game: g });
  const pick = (side: 'a' | 'b') => {
    if (game.done || p.closed) return;
    const t = Date.now();
    if (votePause(times, t, PICK_RUN)) return;
    setTimes((ts) => [...ts.slice(-40), t]);
    setNow(t);
    const g = pickSide(game, side);
    setHist((h) => [...h, game]);
    save(g);
    if (g.done) {
      setWside(side);
      if (settings.reduceMotion) setPhase(4);
      else {
        setPhase(1);
        setTimeout(() => setPhase(3), 1200);
        setTimeout(() => setPhase(4), 2600);
      }
    }
  };
  const done = game.done;
  const unplayedClosed = !!p.closed && !done;
  let pr = pairOf(game);
  if (done) {
    const lastOut = game.out.length ? game.out[game.out.length - 1] : null;
    pr = wside === 'a' ? [game.winner, lastOut] : [lastOut, game.winner];
  }
  const e = endingOf(p, game);
  const left = leftOf(game, n);
  const half = (side: 'a' | 'b', k: number) => {
    const i = side === 'a' ? pr[0] : pr[1];
    const it = i === null || i === undefined ? ['', ''] : p.items[i];
    const isWin = done && side === wside;
    if (done && !isWin) return null;
    const kick = done ? `Your winner · of ${n}` : game.mode === 'stay' ? (side === 'a' ? (game.out.length ? 'Stays' : 'First') : 'New') : `Round ${game.roundNo}`;
    return (
      <Pressable key={side} disabled={done || unplayedClosed || wait > 0} onPress={() => pick(side)} accessibilityLabel={it[0] ? `Pick ${it[0]}` : undefined} style={{ flex: 1, backgroundColor: TONES[k], padding: 22, justifyContent: 'flex-end', gap: 6, opacity: wait ? 0.45 : 1, borderTopWidth: isWin ? 3 : 0, borderTopColor: c.violet }}>
        <Txt style={[label, { color: c['violet-text'] }]}>{kick}</Txt>
        <Txt style={{ color: c.text, fontSize: done ? 40 : 30, fontWeight: '900', textTransform: 'uppercase', lineHeight: done ? 40 : 31 }}>{it[0]}</Txt>
        {!!it[1] && <Txt style={{ color: c['text-2'], fontSize: 14 }}>{it[1]}</Txt>}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: size['gutter-phone'], paddingTop: 6, paddingBottom: 12, gap: 4 }}>
        <Pressable onPress={onBack} accessibilityRole="button" style={{ minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start' }}>
          <Txt style={{ color: c['text-2'], fontWeight: '600', textDecorationLine: 'underline', textDecorationColor: c.violet }}>Your polls</Txt>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt style={[label, { color: c['violet-text'] }]}>
            {p.cat} · {p.mode === 'stay' ? 'One stays' : 'In pairs'}
          </Txt>
          <Txt style={[label, { color: c['text-3'] }]}>{done || p.closed ? 'Done' : `${left} left`}</Txt>
        </View>
        <Txt style={{ color: c.text, fontSize: 24, fontWeight: '900', textTransform: 'uppercase', lineHeight: 25 }}>{p.q}</Txt>
      </View>
      <View style={{ height: 3, backgroundColor: c['surface-2'] }}>
        <View style={{ width: `${Math.round((done ? 1 : (n - left) / Math.max(1, n - 1)) * 100)}%`, height: '100%', backgroundColor: c.violet }} />
      </View>
      {wait > 0 && <Txt style={{ color: c.text, fontSize: 12.5, padding: 12, backgroundColor: c['surface-2'] }}>{VOTE_SAYS(wait)}</Txt>}
      {phase < 4 || (!done && !unplayedClosed) ? (
        <View style={{ flex: 1 }}>
          {half('a', 0)}
          {!done && (
            <View style={{ position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -24, width: 48, height: 48, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', zIndex: 2 }} pointerEvents="none">
              <Txt style={{ color: c.text, fontWeight: '900', fontSize: 14 }}>OR</Txt>
            </View>
          )}
          {half('b', 1)}
          {done && phase >= 3 && (
            <View style={{ position: 'absolute', left: 22, right: 22, top: 22, gap: 4 }}>
              <Txt style={[label, { color: c['violet-text'] }]}>Everyone so far</Txt>
              <Txt style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{e.crowd}</Txt>
              <Txt style={{ color: c['text-2'], fontSize: 13 }}>{e.match}</Txt>
            </View>
          )}
          {!done && !unplayedClosed && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: size['gutter-phone'], paddingVertical: 12 }}>
              <Pressable
                disabled={!hist.length}
                onPress={() => {
                  const prev = hist[hist.length - 1];
                  if (prev) (save(prev), setHist((h) => h.slice(0, -1)));
                }}
              >
                <Txt style={{ color: hist.length ? c['text-2'] : c['text-off'], fontWeight: '600', textDecorationLine: 'underline', textDecorationColor: c.violet }}>Undo</Txt>
              </Pressable>
              <Pressable onPress={() => pick(Math.random() < 0.5 ? 'a' : 'b')}>
                <Txt style={{ color: c['text-2'], fontWeight: '600', textDecorationLine: 'underline', textDecorationColor: c.violet }}>Can’t choose</Txt>
              </Pressable>
              <Txt style={{ color: c['text-3'], fontSize: 12 }}>Tap the one you pick</Txt>
            </View>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: size['gutter-phone'], gap: 10, paddingBottom: 40 }}>
          {unplayedClosed ? (
            <Txt style={{ color: c['text-2'], fontSize: 14 }}>This poll is closed. Here’s how it ended.</Txt>
          ) : (
            <View style={{ backgroundColor: '#191C2B', padding: 18, gap: 4, borderTopWidth: 3, borderTopColor: c.violet }}>
              <Txt style={[label, { color: c['violet-text'] }]}>Your winner · of {n}</Txt>
              <Txt style={{ color: c.text, fontSize: 28, fontWeight: '900', textTransform: 'uppercase' }}>{game.winner !== null ? p.items[game.winner][0] : ''}</Txt>
              <Txt style={[label, { color: c['violet-text'], paddingTop: 10 }]}>Everyone so far</Txt>
              <Txt style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{e.crowd}</Txt>
              <Txt style={{ color: c['text-2'], fontSize: 13 }}>{e.match}</Txt>
            </View>
          )}
          <Txt style={[label, { color: c['text-3'], paddingTop: 8 }]}>Everyone’s top 5 · {e.people}</Txt>
          {e.top.map((r) => (
            <View key={r.i} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Txt style={{ color: c['text-3'], fontWeight: '800', width: 22 }}>{r.n}.</Txt>
                <Txt style={{ color: c.text, flex: 1, fontWeight: r.you ? '700' : '600' }}>{r.t}</Txt>
                <Txt style={{ color: c['text-2'], fontWeight: '700' }}>{r.pct}%</Txt>
              </View>
              <View style={{ marginLeft: 32, height: 6, width: `${r.w * 0.85}%`, backgroundColor: r.you ? c.violet : '#4A4775' }} />
            </View>
          ))}
          {e.mine.length > 0 && <Txt style={[label, { color: c['text-3'], paddingTop: 8 }]}>Your top 3</Txt>}
          {e.mine.map((r) => (
            <View key={r.n} style={{ flexDirection: 'row', gap: 10, alignItems: 'baseline' }}>
              <Txt style={{ color: r.n === 1 ? c['violet-text'] : c['text-3'], fontWeight: '800', width: 22 }}>{r.n}</Txt>
              <Txt style={{ color: c.text, fontWeight: '800', textTransform: 'uppercase' }}>{r.t}</Txt>
              <Txt style={{ color: c['text-3'], fontSize: 12 }}>{r.note}</Txt>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8, paddingTop: 10, flexWrap: 'wrap' }}>
            <Button label="Next poll" c={c} violet onPress={onNext} />
            {!p.closed && <Button label="Play again" c={c} violet onPress={() => (save(freshGame(p, String(Date.now() % 97))), setHist([]), setPhase(0))} />}
          </View>
          <Txt style={[label, { color: c['text-3'], paddingTop: 12 }]}>Your other polls</Txt>
          {others.slice(0, 4).map((x) => {
            const gx = gameOf(x, games);
            return (
              <Pressable key={x.id} onPress={() => onOpen(x)} style={{ backgroundColor: c['surface-1'], padding: 12, gap: 4 }}>
                <Txt style={[label, { color: c['violet-text'] }]}>
                  {x.cat}
                  {x.by === 'you' ? ' · yours' : ''}
                </Txt>
                <Txt style={{ color: c.text, fontWeight: '700' }}>{x.q}</Txt>
                <Txt style={{ color: c.text, fontSize: 12.5, fontWeight: '700' }}>{gx.done || x.closed ? 'See results' : gx.out.length ? 'Keep going' : 'Play'}</Txt>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function MakePoll({ c, onCancel, onMade }: { c: C; onCancel: () => void; onMade: (p: PollDef) => void }) {
  const store = useStore();
  const [step, setStep] = useState(1);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(store.categories[0]?.id ?? 'MUSIC');
  const [items, setItems] = useState<[string, string][]>([]);
  const [add, setAdd] = useState('');
  const [mode, setMode] = useState<Mode>('stay');
  const [who, setWho] = useState<string>('Everyone');
  const [ends, setEnds] = useState<string>('In 3 days');
  const ok = step === 1 ? q.trim().length > 2 : step === 2 ? items.length >= POLL_MIN : true;
  const put = (xs: [string, string][]) => setItems((cur) => [...cur, ...xs.filter(([t]) => t && !cur.some(([u]) => u.toLowerCase() === t.toLowerCase()))]);
  const chip = (on: boolean, text: string, onPress: () => void) => (
    <Pressable key={text} onPress={onPress} aria-pressed={on} style={{ minHeight: 36, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: on ? c.violet : c['surface-1'] }}>
      <Txt style={{ color: on ? c['on-violet'] : c.text, fontWeight: '600', fontSize: 13 }}>{text}</Txt>
    </Pressable>
  );
  const field = { height: 52, backgroundColor: c['surface-1'], borderBottomWidth: 2, borderBottomColor: c.violet, color: c.text, fontSize: 18, paddingHorizontal: 14, fontFamily: 'InstrumentSans_600SemiBold' };
  return (
    <ScrollView contentContainerStyle={{ padding: size['gutter-phone'], gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt style={[label, { color: c['violet-text'] }]}>
          New poll · {MAKE_STEPS[step - 1]} · step {step} of 3
        </Txt>
        <Pressable onPress={onCancel}>
          <Txt style={{ color: c['text-2'], fontWeight: '600', textDecorationLine: 'underline' }}>Cancel</Txt>
        </Pressable>
      </View>
      {step === 1 && (
        <>
          <Txt style={[label, { color: c['text-3'] }]}>What are you asking?</Txt>
          <TextInput value={q} onChangeText={(v) => setQ(v.slice(0, 80))} autoFocus placeholder="Best Afrobeats song of the decade?" placeholderTextColor={c['text-off']} style={field} accessibilityLabel="What are you asking?" />
          <Txt style={[label, { color: c['text-3'] }]}>Where it goes</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{store.categories.map((k) => chip(cat === k.id, k.name, () => setCat(k.id)))}</View>
        </>
      )}
      {step === 2 && (
        <>
          <Txt style={[label, { color: c['text-3'] }]}>
            What’s in it? · {items.length} in it · at least {POLL_MIN}
          </Txt>
          <TextInput
            value={add}
            onChangeText={(v) => setAdd(v.slice(0, 300))}
            placeholder="Type one, or paste a list"
            placeholderTextColor={c['text-off']}
            multiline
            onSubmitEditing={() => (put(pasteItems(add)), setAdd(''))}
            blurOnSubmit
            style={[field, { height: 64 }]}
            accessibilityLabel="What’s in it?"
          />
          <Button label="Add" c={c} violet onPress={() => (put(pasteItems(add)), setAdd(''))} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{items.map(([t], i) => chip(false, `${t} ✕`, () => setItems(items.filter((_, k) => k !== i))))}</View>
          <Txt style={[label, { color: c['text-3'] }]}>Or fill it from</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {store.lists.map((L) => chip(false, `${L.name} · ${L.items.filter(Boolean).length}`, () => put(itemsFromList(L, (id) => BY_ID[id] && { t: BY_ID[id].t, m: BY_ID[id].m }))))}
          </View>
        </>
      )}
      {step === 3 && (
        <>
          <Txt style={[label, { color: c['text-3'] }]}>How it’s played</Txt>
          {MODES.map(([m, name, text]) => (
            <Pressable key={m} onPress={() => setMode(m)} aria-pressed={mode === m} style={{ backgroundColor: mode === m ? '#1A1D2C' : c['surface-1'], padding: 14, gap: 4, borderLeftWidth: 3, borderLeftColor: mode === m ? c.violet : 'transparent' }}>
              <Txt style={{ color: c.text, fontWeight: '800' }}>{name}</Txt>
              <Txt style={{ color: c['text-3'], fontSize: 12.5 }}>{text}</Txt>
            </Pressable>
          ))}
          <Txt style={[label, { color: c['text-3'] }]}>Who can play</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{WHO.map((x) => chip(who === x, x, () => setWho(x)))}</View>
          <Txt style={[label, { color: c['text-3'] }]}>It ends</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{ENDS.map((x) => chip(ends === x, x, () => setEnds(x)))}</View>
        </>
      )}
      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 6 }}>
        {step > 1 && <Button label="Back" c={c} violet onPress={() => setStep(step - 1)} />}
        <Button label={step === 3 ? 'Start it' : 'Next'} c={c} violet disabled={!ok} onPress={() => (step < 3 ? setStep(step + 1) : onMade(newPoll({ q, cat, items, mode, who, ends })))} />
      </View>
    </ScrollView>
  );
}
