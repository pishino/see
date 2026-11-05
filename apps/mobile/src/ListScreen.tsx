/*
 * A list on the phone (V3RankRow, PixelPhone): rank, move, title and maker, play, and the grip. Hold the grip and
 * drag: the row lifts, the rows between make room, and letting go puts it there. Tap a row for the player sheet;
 * tap play for the bar. Screen readers get Move up and Move down on the grip.
 */
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BY_ID, filledCount, makerOf, moveEntry, moveOf, pad2, slotsOf } from '@see/core';
import { usePlayer, useStore } from '@see/core/react';
import { size } from '@see/tokens';
import { CategoryTag, Icon } from './marks';
import { PlayGlyph } from './Player';
import type { C } from './theme';
import { Txt } from './type';

const ROW = 56;
const tick = (kind: 'pick' | 'pass' | 'drop') => {
  const h =
    kind === 'pass' ? Haptics.selectionAsync() : Haptics.impactAsync(kind === 'pick' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  h.catch(() => {}); // no haptics here (web, simulators): nothing to feel
};

/** The grip: its gesture is created once and reads the latest handlers, so a re-render never drops a drag. */
function Grip({ label, c, onStart, onMove, onEnd, onStep }: { label: string; c: C; onStart: () => void; onMove: (dy: number) => void; onEnd: (dy: number) => void; onStep: (d: -1 | 1) => void }) {
  const cb = useRef({ onStart, onMove, onEnd });
  cb.current = { onStart, onMove, onEnd };
  const pr = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => cb.current.onStart(),
      onPanResponderMove: (_, g) => cb.current.onMove(g.dy),
      onPanResponderRelease: (_, g) => cb.current.onEnd(g.dy),
      onPanResponderTerminate: () => cb.current.onEnd(0),
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

export function ListScreen({ id, c, onBack }: { id: string; c: C; onBack: () => void }) {
  const store = useStore();
  const player = usePlayer();
  const L = store.list(id);
  const [drag, setDrag] = useState<{ from: number; dy: number } | null>(null);
  const slots = L ? slotsOf(L) : [];
  const filled = slots.filter(Boolean).length;
  const target = drag ? Math.max(0, Math.min(filled - 1, drag.from + Math.round(drag.dy / ROW))) : -1;

  // a light tick for every place passed
  const last = useRef(-1);
  useEffect(() => {
    if (drag && last.current !== -1 && target !== last.current) tick('pass');
    last.current = drag ? target : -1;
  }, [target, drag]);

  if (!L) {
    return (
      <View style={{ padding: size['gutter-phone'], gap: 14 }}>
        <Txt style={{ color: c.text, fontSize: 28, fontWeight: '900', textTransform: 'uppercase' }}>This list isn’t here</Txt>
        <Pressable onPress={onBack} accessibilityRole="button">
          <Txt style={{ color: c.flare, fontWeight: '800' }}>Back to charts</Txt>
        </Pressable>
      </View>
    );
  }

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
    <ScrollView scrollEnabled={!drag} contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}>
      <View style={{ paddingHorizontal: size['gutter-phone'], gap: 10, paddingBottom: 14 }}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={{ width: 44, height: 44, justifyContent: 'center' }}>
          <Icon name="back" size={22} color={c.text} />
        </Pressable>
        <CategoryTag name={store.categories.find((x) => x.id === L.cat)?.name ?? L.cat} height={18} color={c.flare} />
        <Txt style={{ color: c.text, fontSize: 34, fontWeight: '900', textTransform: 'uppercase', lineHeight: 34 }}>{L.name}</Txt>
      </View>
      <View>
        {slots.map((xid, ix) => {
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
          const off = !!x.gone || !!x.own;
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
                <Txt numberOfLines={1} style={{ color: c['text-3'], fontSize: 12 }}>
                  {makerOf(x)}
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
                  setDrag({ from: ix, dy: 0 });
                }}
                onMove={(d) => setDrag((cur) => (cur ? { ...cur, dy: d } : cur))}
                onEnd={(d) => {
                  const to = Math.max(0, Math.min(filled - 1, ix + Math.round(d / ROW)));
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
