/*
 * A list on the phone (V3RankRow, PixelPhone): rank, move, title and maker, play, and the grip. Hold the grip and
 * drag: the row lifts, the rows between make room, and letting go puts it there. Tap a row for the player sheet;
 * tap play for the bar. Screen readers get Move up and Move down on the grip.
 */
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, Share, StyleSheet, TextInput, View, type HostInstance, type ScrollViewInstance } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BY_ID, SIZE_STOPS, belowTheLine, filledCount, goneLine, kindFor, kindOf, makerOf, moveEntry, moveOf, pad2, placeAt, search, slotsOf, type List } from '@see/core';
import { silent, usePlayer, useStore } from '@see/core/react';
import { size } from '@see/tokens';
import { CategoryTag, Icon } from './marks';
import { PlayGlyph } from './Player';
import { NoList } from './Access';
import { useNav } from './nav';
import { Sheet } from './Sheet';
import type { C } from './theme';
import { Txt } from './type';

const ROW = 56;
const tick = (kind: 'pick' | 'pass' | 'drop') => {
  const h =
    kind === 'pass' ? Haptics.selectionAsync() : Haptics.impactAsync(kind === 'pick' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  h.catch(() => {}); // no haptics here (web, simulators): nothing to feel
};

/** The grip: its gesture is created once and reads the latest handlers, so a re-render never drops a drag. */
function Grip({ label, c, onStart, onMove, onEnd, onStep }: { label: string; c: C; onStart: () => void; onMove: (dy: number, y: number) => void; onEnd: () => void; onStep: (d: -1 | 1) => void }) {
  const cb = useRef({ onStart, onMove, onEnd });
  cb.current = { onStart, onMove, onEnd };
  const pr = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => cb.current.onStart(),
      onPanResponderMove: (_, g) => cb.current.onMove(g.dy, g.moveY),
      onPanResponderRelease: () => cb.current.onEnd(),
      onPanResponderTerminate: () => cb.current.onEnd(),
    }),
  ).current;
  return (
    <View
      {...pr.panHandlers}
      style={s.grip}
      accessible
      accessibilityLabel={label}
      accessibilityHint="Drag to move it, or use the actions"
      accessibilityActions={[
        { name: 'up', label: 'Move up' },
        { name: 'down', label: 'Move down' },
      ]}
      onAccessibilityAction={(e) => onStep(e.nativeEvent.actionName === 'up' ? -1 : 1)}
    >
      <Icon name="grip" size={20} color={c['text-3']} />
    </View>
  );
}

export function ListScreen({ id, c }: { id: string; c: C }) {
  const store = useStore();
  const nav = useNav();
  const onBack = nav.pop;
  const [menu, setMenu] = useState<'menu' | 'size' | null>(null);
  const player = usePlayer();
  const L = store.list(id);
  const [drag, setDrag] = useState<{ from: number; dy: number } | null>(null);
  // autoscroll: near the top or bottom edge while dragging, the list scrolls (faster the closer you are) and the
  // lifted row stays under your finger, so a long list can be reordered end to end in one drag
  const scroller = useRef<ScrollViewInstance>(null);
  const frame = useRef<HostInstance>(null);
  const view = useRef({ y: 0, top: 0, h: 0, content: 0 });
  const live = useRef({ gesture: 0, start: 0, finger: 0, raf: 0 });
  const total = () => live.current.gesture + view.current.y - live.current.start;
  const follow = () => {
    const v = view.current;
    const g = live.current;
    const EDGE = 72;
    let speed = 0;
    if (g.finger) {
      const above = g.finger - v.top;
      const below = v.top + v.h - g.finger;
      if (above < EDGE) speed = -Math.min(14, Math.ceil((EDGE - above) / 5));
      else if (below < EDGE) speed = Math.min(14, Math.ceil((EDGE - below) / 5));
    }
    const next = Math.max(0, Math.min(Math.max(0, v.content - v.h), v.y + speed));
    if (next !== v.y) {
      v.y = next;
      scroller.current?.scrollTo({ y: next, animated: false });
      setDrag((cur) => (cur ? { ...cur, dy: total() } : cur));
    }
    g.raf = requestAnimationFrame(follow);
  };
  useEffect(() => () => cancelAnimationFrame(live.current.raf), []);
  const slots = L ? slotsOf(L) : [];
  const filled = slots.filter(Boolean).length;
  const target = drag ? Math.max(0, Math.min(filled - 1, drag.from + Math.round(drag.dy / ROW))) : -1;

  // a light tick for every place passed
  const last = useRef(-1);
  useEffect(() => {
    if (drag && last.current !== -1 && target !== last.current) tick('pass');
    last.current = drag ? target : -1;
  }, [target, drag]);

  if (!L && !store.ready) return <Skeleton c={c} />;
  if (!L) return <NoList id={id} c={c} />;

  const shiftFor = (ix: number) => {
    if (!drag || ix === drag.from) return 0;
    if (drag.from < target && ix > drag.from && ix <= target) return -ROW;
    if (drag.from > target && ix >= target && ix < drag.from) return ROW;
    return 0;
  };
  const moveBy = (from: number, d: -1 | 1) => {
    const to = from + d;
    if (to < 0 || to >= filled) return;
    store.replaceList(moveEntry(L, from, to));
  };

  return (
    <View
      ref={frame}
      style={{ flex: 1 }}
      onLayout={(e) => {
        view.current.h = e.nativeEvent.layout.height;
        frame.current?.measureInWindow((_x, y) => (view.current.top = y));
      }}
    >
    <ScrollView
      ref={scroller}
      scrollEnabled={!drag}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      onScroll={(e) => (view.current.y = e.nativeEvent.contentOffset.y)}
      onContentSizeChange={(_w, h) => (view.current.content = h)}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
    >
      <View style={{ paddingHorizontal: size['gutter-phone'], gap: 10, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={{ width: 44, height: 44, justifyContent: 'center' }}>
            <Icon name="back" size={22} color={c.text} />
          </Pressable>
          <Pressable onPress={() => setMenu('menu')} accessibilityRole="button" accessibilityLabel={`More for ${L.name}`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="dots" size={20} color={c['text-2']} />
          </Pressable>
        </View>
        <CategoryTag name={store.categories.find((x) => x.id === L.cat)?.name ?? L.cat} height={18} color={c.flare} />
        <Txt style={{ color: c.text, fontSize: 34, fontWeight: '900', textTransform: 'uppercase', lineHeight: 34 }}>{L.name}</Txt>
      </View>
      <View>
        {slots.map((xid, ix) => {
          if (!xid && ix === slots.indexOf(null) && !drag) return <SlotFind key={`open-${ix}`} L={L} ix={ix} c={c} />;
          if (!xid) {
            return (
              <View key={`open-${ix}`} style={[s.row, { borderBottomColor: c['surface-1'] }]}>
                <Txt style={[s.rank, { color: c.slot }]}>{pad2(ix + 1)}</Txt>
                <Txt style={{ color: c['text-off'], fontSize: 14 }}>No. {ix + 1} is open</Txt>
              </View>
            );
          }
          const x = BY_ID[xid];
          if (!x) return null;
          const lifted = drag?.from === ix;
          const shown = lifted ? target : ix + shiftFor(ix) / ROW; // the rank each row will have if you let go now
          const mv = moveOf(L, xid, ix);
          const playing = player.xid === xid;
          const off = silent(xid);
          const dy = lifted ? Math.max(-ix * ROW, Math.min((filled - 1 - ix) * ROW, drag!.dy)) : shiftFor(ix);
          return (
            <View
              key={xid}
              style={[
                s.row,
                {
                  borderBottomColor: c['surface-1'],
                  backgroundColor: lifted ? c['surface-2'] : playing ? 'rgba(255,74,28,0.08)' : c.bg,
                  transform: [{ translateY: dy }],
                  zIndex: lifted ? 2 : 0,
                  elevation: lifted ? 8 : 0,
                  shadowColor: '#000',
                  shadowOpacity: lifted ? 0.45 : 0,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 8 },
                },
              ]}
            >
              <Txt style={[s.rank, { color: shown === 0 ? c.flare : c.text }]}>{pad2(shown + 1)}</Txt>
              <Txt style={{ width: 34, fontSize: 11, fontWeight: '800', color: MOVE[mv.tone](c) }} accessibilityLabel={mv.aria}>
                {mv.t}
              </Txt>
              <Pressable
                style={{ flex: 1, minWidth: 0, height: '100%', justifyContent: 'center' }}
                onPress={() => player.play(xid, { listId: L.id, view: 'sheet' })}
                accessibilityLabel={`No. ${ix + 1}: ${x.t}, ${makerOf(x)}. Open`}
              >
                <Txt numberOfLines={1} style={{ color: off ? c['text-3'] : c.text, fontSize: 15, fontWeight: '700', textTransform: 'uppercase' }}>
                  {x.t}
                </Txt>
                <Txt numberOfLines={1} style={{ color: x.gone ? c['flare-soft'] : c['text-3'], fontSize: 12 }}>
                  {x.gone ? goneLine(x, ix + 1) : x.notHere ? `${makerOf(x)} · not available here` : makerOf(x)}
                </Txt>
              </Pressable>
              <Pressable
                disabled={off}
                style={[s.icon, { opacity: off ? 0.35 : 1 }]}
                onPress={() => (playing ? player.toggle() : player.play(xid, { listId: L.id, view: 'mini' }))}
                accessibilityLabel={off ? `${x.t}: nothing to play` : `${playing && player.playing ? 'Pause' : 'Play'} ${x.t}`}
              >
                <PlayGlyph playing={playing && player.playing} size={14} color={playing ? c.flare : c['text-2']} />
              </Pressable>
              <Grip
                c={c}
                label={`Move ${x.t}, No. ${ix + 1}`}
                onStart={() => {
                  tick('pick');
                  live.current = { gesture: 0, start: view.current.y, finger: 0, raf: requestAnimationFrame(follow) };
                  setDrag({ from: ix, dy: 0 });
                }}
                onMove={(d, y) => {
                  live.current.gesture = d;
                  live.current.finger = y;
                  setDrag((cur) => (cur ? { ...cur, dy: total() } : cur));
                }}
                onEnd={() => {
                  cancelAnimationFrame(live.current.raf);
                  const to = Math.max(0, Math.min(filled - 1, ix + Math.round(total() / ROW)));
                  if (to !== ix) {
                    store.replaceList(moveEntry(L, ix, to));
                    tick('drop');
                  }
                  setDrag(null);
                }}
                onStep={(d) => moveBy(ix, d)}
              />
            </View>
          );
        })}
      </View>
      <Txt style={{ color: c['text-3'], fontSize: 11.5, padding: size['gutter-phone'] }}>
        {filledCount(L)} of {L.n} · saved as you go
      </Txt>
    </ScrollView>
    {menu === 'menu' && (
      <Sheet c={c} onClose={() => setMenu(null)} label={`More for ${L.name}`}>
        {(
          [
            [L.pinned ? 'Unpin from Charts' : 'Pin to Charts', () => {
              store.togglePin(L.id);
              nav.say(L.pinned ? 'Unpinned' : 'Pinned to Charts');
              setMenu(null);
            }],
            ['Share the list', () => {
              Share.share({ message: `${L.name} on See: see://list/${L.id}` }).catch(() => {});
              setMenu(null);
            }],
            [`Size: top ${L.n}`, () => setMenu('size')],
          ] as [string, () => void][]
        ).map(([t, f]) => (
          <Pressable key={t} onPress={f} accessibilityRole="menuitem" style={{ minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: c['surface-2'] }}>
            <Txt style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{t}</Txt>
          </Pressable>
        ))}
      </Sheet>
    )}
    {menu === 'size' && (
      <Sheet c={c} onClose={() => setMenu(null)} label="Size">
        <Txt style={{ color: c['text-3'], fontSize: 11, fontWeight: '600', letterSpacing: 1.2 }}>SIZE</Txt>
        {SIZE_STOPS.map((n) => (
          <Pressable
            key={n}
            accessibilityRole="radio"
            aria-checked={L.n === n}
            onPress={() => {
              const cut = belowTheLine({ ...L, n });
              store.setSize(L.id, n);
              setMenu(null);
              nav.say(cut ? `Top ${n}: ${cut} below the line` : `Top ${n}`);
            }}
            style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: c['surface-2'] }}
          >
            <Txt style={{ color: L.n === n ? c.text : c['text-2'], fontSize: 15, fontWeight: L.n === n ? '800' : '600' }}>Top {n}</Txt>
            {L.n === n && <Icon name="check" size={14} color={c.flare} />}
          </Pressable>
        ))}
      </Sheet>
    )}
    </View>
  );
}

/** The first open place: type to find it; nothing matches, and it is yours to add. */
function SlotFind({ L, ix, c }: { L: List; ix: number; c: C }) {
  const store = useStore();
  const nav = useNav();
  const [q, setQ] = useState('');
  const results = q.trim() ? search(q, kindOf(L)).filter((x) => !L.items.includes(x.id)).slice(0, 5) : [];
  const put = (xid: string, t: string) => {
    const r = placeAt(L, ix, xid);
    if ('already' in r) return nav.say(`Already on ${L.name}`);
    store.replaceList(r.list);
    nav.say(r.below ? `Below the line on ${L.name}` : `${t} in at No. ${r.at + 1}`);
    setQ('');
  };
  return (
    <View>
      <View style={[s.row, { borderBottomColor: c['surface-1'] }]}>
        <Txt style={[s.rank, { color: c['flare-soft'] }]}>{pad2(ix + 1)}</Txt>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={`Type to find No. ${ix + 1}`}
          placeholderTextColor={c['text-3']}
          accessibilityLabel={`Find No. ${ix + 1}`}
          autoCorrect={false}
          style={{ flex: 1, height: '100%', color: c.text, fontSize: 15, fontFamily: 'InstrumentSans_400Regular' }}
        />
        <Icon name="search" size={14} color={c['text-3']} />
      </View>
      {results.map((x) => (
        <Pressable key={x.id} onPress={() => put(x.id, x.t)} style={{ paddingLeft: 58, paddingVertical: 10, backgroundColor: c['surface-1'], borderBottomWidth: 1, borderBottomColor: c['surface-2'] }} accessibilityLabel={`Put ${x.t} at No. ${ix + 1}`}>
          <Txt style={{ color: c.text, fontWeight: '800', fontSize: 14, textTransform: 'uppercase' }}>{x.t}</Txt>
          <Txt style={{ color: c['text-3'], fontSize: 12 }}>
            {makerOf(x)}
            {x.y ? ` · ${x.y}` : ''}
          </Txt>
        </Pressable>
      ))}
      {q.trim().length > 1 && results.length === 0 && (
        <Pressable
          onPress={() => {
            const x = store.addOwn(q, kindFor(L, store.categories.find((k) => k.id === L.cat)?.name));
            put(x.id, x.t);
          }}
          style={{ paddingLeft: 58, paddingVertical: 10, backgroundColor: c['surface-1'] }}
          accessibilityRole="button"
        >
          <Txt style={{ color: c.text, fontWeight: '800', fontSize: 14 }}>Add “{q.trim()}”</Txt>
          <Txt style={{ color: c['text-3'], fontSize: 12 }}>Nothing matches. Rank it as your own; you can link a source later.</Txt>
        </Pressable>
      )}
    </View>
  );
}

const MOVE: Record<'up' | 'down' | 'same' | 'new' | 'none', (c: C) => string> = {
  up: (c) => c.up,
  down: (c) => c['flare-soft'],
  same: (c) => c['text-off'],
  new: (c) => c['text-2'],
  none: (c) => c['text-off'],
};

const s = StyleSheet.create({
  row: { height: ROW, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, paddingLeft: size['gutter-phone'], paddingRight: 4 },
  rank: { width: 28, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  icon: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  grip: { width: 44, height: ROW, alignItems: 'center', justifyContent: 'center' },
});

/** The page's shape while saved lists load (L1): title, then rows, in greys. Nothing jumps when they land. */
export function Skeleton({ c, rows = 8 }: { c: C; rows?: number }) {
  return (
    <View style={{ padding: size['gutter-phone'], gap: 14 }} accessibilityLabel="Loading your lists" accessibilityRole="progressbar">
      <View style={{ width: 90, height: 18, backgroundColor: c['surface-1'] }} />
      <View style={{ width: '80%', height: 34, backgroundColor: c['surface-1'] }} />
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ height: ROW - 14, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: 1 - i * 0.08 }}>
          <View style={{ width: 24, height: 14, backgroundColor: c['surface-2'] }} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ width: `${60 + ((i * 17) % 30)}%`, height: 12, backgroundColor: c['surface-1'] }} />
            <View style={{ width: '35%', height: 10, backgroundColor: c['surface-1'] }} />
          </View>
        </View>
      ))}
    </View>
  );
}
