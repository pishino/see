/*
 * The player on the phone (V3Player, phone): the sheet comes up from the bottom with the picture on top, then the
 * details, rank first; minimised, it is a bar above the tabs and keeps playing. The state is the web's, from
 * @see/core/react, so autoplay, the clock and "nothing plays from a removed source" behave the same.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { aboutOf, addToList, clock, goneLine, isVideo, kickerOf, kindOf, makerLine, moreLikeIt, nextInList, notHereLine, playWord, sourceName, sourceUrl, sourcesOf, whereItRanks, type Entry } from '@see/core';
import { silent, usePlayer, useSettings, useStore } from '@see/core/react';
import { motion } from '@see/tokens';
import { Icon, PlusBox } from './marks';
import { Picture } from './Picture';
import type { C } from './theme';
import { Txt } from './type';

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

export function PlayGlyph({ playing, size = 16, color }: { playing: boolean; size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      {playing ? (
        <>
          <Rect x={2.5} y={1.6} width={2.6} height={8.8} fill={color} />
          <Rect x={6.9} y={1.6} width={2.6} height={8.8} fill={color} />
        </>
      ) : (
        <Path d="M3 1.4L10.6 6L3 10.6Z" fill={color} />
      )}
    </Svg>
  );
}

/** The progress line; tap anywhere on it to go there. */
function Progress({ c, light = false }: { c: C; light?: boolean }) {
  const p = usePlayer();
  const [w, setW] = useState(1);
  const pct = p.duration ? p.t / p.duration : 0;
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width || 1)}
        onPress={(e) => p.seek((e.nativeEvent.locationX / w) * p.duration)}
        hitSlop={{ top: 14, bottom: 14 }}
        accessibilityRole="adjustable"
        accessibilityLabel="Position"
        accessibilityValue={{ text: `${clock(p.t)} of ${clock(p.duration)}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => p.seek(p.t + (e.nativeEvent.actionName === 'increment' ? 10 : -10))}
        style={{ height: 3, backgroundColor: light ? 'rgba(244,245,242,0.25)' : c['surface-2'] }}
      >
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: c.flare }} />
      </Pressable>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt style={{ fontSize: 11, color: light ? '#F4F5F2' : c['text-3'] }}>{clock(p.t)}</Txt>
        <Txt style={{ fontSize: 11, color: light ? '#F4F5F2' : c['text-3'] }}>{clock(p.duration)}</Txt>
      </View>
    </View>
  );
}

function AddTo({ x, c, say, onDone }: { x: Entry; c: C; say: (t: string) => void; onDone: () => void }) {
  const store = useStore();
  const fits = store.lists.filter((L) => !L.items.includes(x.id)).sort((a, b) => Number(kindOf(b) === x.k) - Number(kindOf(a) === x.k));
  return (
    <View style={{ backgroundColor: c['surface-1'] }}>
      {fits.slice(0, 6).map((L) => (
        <Pressable
          key={L.id}
          style={[s.line, { borderBottomColor: c['surface-2'], paddingHorizontal: 14 }]}
          onPress={() => {
            const r = addToList(L, x.id);
            if (!('already' in r)) {
              store.replaceList(r.list);
              say(r.below ? `Below the line on ${L.name}` : `${x.t} in at No. ${r.at + 1} on ${L.name}`);
            }
            onDone();
          }}
        >
          <PlusBox height={14} color={c.flare} />
          <Txt style={{ color: c.text, fontWeight: '600', fontSize: 14 }}>{L.name}</Txt>
        </Pressable>
      ))}
      {fits.length === 0 && <Txt style={{ color: c['text-3'], padding: 14, fontSize: 12 }}>On every list already</Txt>}
    </View>
  );
}

export function PlayerSheet({ c, say, onOpenList }: { c: C; say: (t: string) => void; onOpenList: (id: string) => void }) {
  const p = usePlayer();
  const store = useStore();
  const { settings } = useSettings();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const rise = useRef(new Animated.Value(height)).current;
  const [tab, setTab] = useState<'about' | 'play' | 'more'>('about');
  const [adding, setAdding] = useState(false);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    // reduce motion: it is simply there
    Animated.timing(rise, { toValue: 0, duration: settings.reduceMotion ? 1 : motion.sheet, easing: EASE, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rise]);
  useEffect(() => {
    setTab('about');
    setSource(null);
    setAdding(false);
  }, [p.xid]);
  // Android's back minimises; it keeps playing
  const minimise = useRef(p.setView);
  minimise.current = p.setView;
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      minimise.current('mini');
      return true;
    });
    return () => sub.remove();
  }, []);

  const x = p.entry;
  if (!x) return null;
  const places = whereItRanks(x.id, store.lists);
  const best = places[0];
  const sources = sourcesOf(x, settings.playOrder);
  const from = source ?? sources[0];
  const word = playWord(x);
  const gone = goneLine(x);
  const off = silent(x.id);
  const next = p.listId ? nextInList(store.list(p.listId), x.id) : null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, paddingTop: insets.top, transform: [{ translateY: rise }] }]} accessibilityViewIsModal>
      <View style={{ width, height: (width * 9) / 16, backgroundColor: '#000' }}>
        <Picture xid={x.id} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,15,14,0.28)' }]} />
        <Pressable onPress={() => p.setView('mini')} style={[s.icon, { position: 'absolute', left: 8, top: 8 }]} accessibilityLabel="Minimise: keeps playing">
          <Icon name="down" size={20} color="#F4F5F2" />
        </Pressable>
        {!off && (
          <Pressable onPress={p.toggle} style={[s.bigplay, { backgroundColor: c.flare }]} accessibilityLabel={p.playing ? 'Pause' : word.verb}>
            <PlayGlyph playing={p.playing} size={18} color={c['on-flare']} />
          </Pressable>
        )}
        {x.notHere && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,15,14,0.82)', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 }]} accessibilityRole="alert">
            <Txt style={{ color: '#F4F5F2', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>Preview · {sourceName(x.notHere)}</Txt>
            <Txt style={{ color: '#F4F5F2', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>{notHereLine(x)}</Txt>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {next && (
                <Pressable onPress={() => p.play(next, { listId: p.listId })} style={[s.btn, { backgroundColor: c.flare }]}>
                  <View style={s.btnIn}>
                    <Txt style={[s.btnText, { color: c['on-flare'] }]}>Play No. {(places.find((pl) => pl.listId === p.listId)?.rank ?? 0) + 1}</Txt>
                  </View>
                </Pressable>
              )}
              <Pressable onPress={() => Linking.openURL(sourceUrl(x, sourceName(x.notHere!))).catch(() => {})} style={[s.btn, { backgroundColor: 'rgba(244,245,242,0.14)' }]}>
                <View style={s.btnIn}>
                  <Txt style={[s.btnText, { color: '#F4F5F2' }]}>Open on {sourceName(x.notHere)}</Txt>
                </View>
              </Pressable>
            </View>
          </View>
        )}
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 8 }}>
          {!isVideo(x) && !off && (
            <Txt style={{ color: '#F4F5F2', fontSize: 11, fontWeight: '600', paddingBottom: 6 }}>
              {word.what} · {from}
            </Txt>
          )}
          {!off && <Progress c={c} light />}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: -8, marginRight: -12 }}>
          <Pressable style={s.icon} accessibilityLabel="Share" onPress={() => Share.share({ message: `${x.t} on See: see://entry/${x.id}` }).catch(() => {})}>
            <Icon name="share" size={18} color={c['text-2']} />
          </Pressable>
          <Pressable style={s.icon} accessibilityLabel="Close the player" onPress={p.close}>
            <Icon name="close" size={18} color={c.text} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: -30 }}>
          {best ? (
            <>
              <Txt style={{ fontSize: 64, fontWeight: '900', color: c.flare, lineHeight: 66 }} accessibilityElementsHidden>
                {best.rank}
              </Txt>
              <View>
                <Txt style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>
                  No. {best.rank} in {best.name}
                </Txt>
                <Txt style={{ color: c['text-3'], fontSize: 12 }}>
                  on {places.length} of your {places.length === 1 ? 'list' : 'lists'}
                </Txt>
              </View>
            </>
          ) : (
            <View style={{ paddingTop: 30 }}>
              <Txt style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>Not on your lists yet</Txt>
              <Txt style={{ color: c['text-3'], fontSize: 12 }}>Add puts it in the first open place</Txt>
            </View>
          )}
        </View>

        <Txt style={[s.label, { color: c['text-3'] }]}>{kickerOf(x)}</Txt>
        <Txt style={{ color: c.text, fontSize: 30, fontWeight: '900', textTransform: 'uppercase', lineHeight: 30 }}>{x.t}</Txt>
        <Txt style={{ color: c['text-3'], fontSize: 12 }}>{makerLine(x)}</Txt>
        {gone && <Txt style={{ color: c['flare-soft'], fontSize: 12 }}>{gone}</Txt>}

        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 6 }}>
          {!off && (
            <Pressable onPress={p.toggle} style={[s.btn, { backgroundColor: c.flare }]}>
              <View style={s.btnIn}>
                <PlayGlyph playing={p.playing} size={12} color={c['on-flare']} />
                <Txt style={[s.btnText, { color: c['on-flare'] }]}>{p.playing ? 'Pause' : 'Play'}</Txt>
              </View>
            </Pressable>
          )}
          <Pressable onPress={() => setAdding((a) => !a)} style={[s.btn, { backgroundColor: c['surface-2'] }]} aria-expanded={adding}>
            <View style={s.btnIn}>
              <PlusBox height={14} color={c.flare} />
              <Txt style={[s.btnText, { color: c.text }]}>Add</Txt>
            </View>
          </Pressable>
        </View>
        {adding && <AddTo x={x} c={c} say={say} onDone={() => setAdding(false)} />}

        <View style={{ flexDirection: 'row', gap: 20, borderBottomWidth: 1, borderBottomColor: c['surface-1'] }} accessibilityRole="tablist">
          {(
            [
              ['about', 'About'],
              ['play', isVideo(x) ? 'Watch' : 'Listen'],
              ['more', 'More'],
            ] as const
          ).map(([id, label]) => (
            <Pressable key={id} onPress={() => setTab(id)} accessibilityRole="tab" aria-selected={tab === id} style={{ paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: tab === id ? c.flare : 'transparent', marginBottom: -1 }}>
              <Txt style={{ color: tab === id ? c.text : c['text-3'], fontWeight: '600', fontSize: 14 }}>{label}</Txt>
            </Pressable>
          ))}
        </View>

        {tab === 'about' && (
          <View style={{ gap: 4 }}>
            <Txt style={{ color: c['text-2'], fontSize: 14, lineHeight: 21, paddingVertical: 6 }}>{aboutOf(x)}</Txt>
            {!off && (
              <>
                <Txt style={[s.label, { color: c['text-3'], paddingTop: 8 }]}>{word.what}</Txt>
                <Pressable style={[s.line, { borderBottomColor: c['surface-1'] }]} onPress={p.toggle}>
                  <Icon name="play" size={10} color={c.flare} />
                  <Txt style={{ color: c.text, fontSize: 14, fontWeight: '600', flex: 1 }}>{word.what}</Txt>
                  <Txt style={{ color: c['text-3'], fontSize: 12 }}>
                    {clock(p.duration)} · {from}
                  </Txt>
                </Pressable>
              </>
            )}
            {places.length > 0 && (
              <>
                <Txt style={[s.label, { color: c['text-3'], paddingTop: 12 }]}>Where it ranks</Txt>
                {places.map((pl) => (
                  <Pressable
                    key={pl.listId}
                    style={[s.line, { borderBottomColor: c['surface-1'] }]}
                    onPress={() => {
                      p.setView('mini');
                      onOpenList(pl.listId);
                    }}
                  >
                    <Txt style={{ color: c.flare, fontWeight: '800', fontSize: 12 }}>No. {pl.rank}</Txt>
                    <Txt style={{ color: c.text, fontSize: 14 }}>Your list · {pl.name}</Txt>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        )}

        {tab === 'play' && (
          <View>
            <Txt style={{ color: c['text-3'], fontSize: 12, paddingVertical: 8 }}>
              It plays from its source; See never hosts it. The first one that has it wins (Settings › Playback).
            </Txt>
            {sources.map((n) => (
              <Pressable
                key={n}
                style={[s.line, { borderBottomColor: c['surface-1'] }]}
                aria-selected={from === n}
                onPress={() => {
                  setSource(n);
                  say(`Plays from ${n}`);
                }}
              >
                <Txt style={{ color: c.text, fontSize: 14, fontWeight: '600', flex: 1 }}>{n}</Txt>
                <Txt style={{ color: from === n ? c.flare : c['text-3'], fontSize: 12 }}>{from === n ? 'Playing from here' : 'Play from here'}</Txt>
              </Pressable>
            ))}
            {sources.length === 0 && <Txt style={{ color: c['text-3'], fontSize: 12 }}>No source yet.</Txt>}
          </View>
        )}

        {tab === 'more' && (
          <View>
            {moreLikeIt(x).map((y) => (
              <Pressable key={y.id} style={[s.line, { borderBottomColor: c['surface-1'], minHeight: 60 }]} onPress={() => p.play(y.id, { listId: null })}>
                <Picture xid={y.id} style={{ width: 64, height: 36 }} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt numberOfLines={1} style={{ color: c.text, fontWeight: '700', fontSize: 13, textTransform: 'uppercase' }}>
                    {y.t}
                  </Txt>
                  <Txt numberOfLines={1} style={{ color: c['text-3'], fontSize: 12 }}>
                    {makerLine(y)}
                  </Txt>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

/** Minimised: a bar above the tabs. Tap it for the sheet; it keeps playing. */
export function MiniPlayer({ c }: { c: C }) {
  const p = usePlayer();
  const x = p.entry;
  if (!x) return null;
  const pct = p.duration ? (p.t / p.duration) * 100 : 0;
  return (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: c['surface-1'], borderTopWidth: 1, borderTopColor: c['surface-2'] }} accessibilityLabel="Now playing">
      <Pressable onPress={() => p.setView('sheet')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, height: '100%' }} accessibilityLabel={`Open ${x.t}`}>
        <Picture xid={x.id} style={{ width: 56, height: 56 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt numberOfLines={1} style={{ color: c.text, fontWeight: '700', fontSize: 13, textTransform: 'uppercase' }}>
            {x.t}
          </Txt>
          <Txt numberOfLines={1} style={{ color: c['text-3'], fontSize: 12 }}>
            {makerLine(x)}
          </Txt>
        </View>
      </Pressable>
      {!silent(x.id) && (
        <Pressable onPress={p.toggle} style={s.icon} accessibilityLabel={p.playing ? 'Pause' : 'Play'}>
          <PlayGlyph playing={p.playing} size={16} color={c.text} />
        </Pressable>
      )}
      <Pressable onPress={p.close} style={s.icon} accessibilityLabel="Stop and close">
        <Icon name="close" size={14} color={c['text-3']} />
      </Pressable>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: c['surface-2'] }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: c.flare }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bigplay: { position: 'absolute', left: '50%', top: '50%', width: 56, height: 56, marginLeft: -28, marginTop: -28, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  line: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1 },
  btn: { height: 36, paddingHorizontal: 16, justifyContent: 'center', transform: [{ skewX: '-12deg' }] },
  btnIn: { flexDirection: 'row', alignItems: 'center', gap: 8, transform: [{ skewX: '12deg' }] },
  btnText: { fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
});
