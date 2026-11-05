/*
 * See on iOS and Android (PixelPhone, V3Responsive phone shell): the bottom bar (Charts, Polls, Find, You), the
 * masthead, your lists by category, a list you can rank, polls you can vote in, Find, and your page. Everything it
 * knows comes from @see/core, so it says and does what the web app does.
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme, type TextStyle } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BY_ID, POLLS, PEOPLE, addToList, filledCount, listSummary, makerOf, moveEntry, moveOf, pad2, search, slotsOf, type List } from '@see/core';
import { SettingsProvider, StoreProvider, useSettings, useStore } from '@see/core/react';
import { colors, size, type ColorRole } from '@see/tokens';
import { CategoryTag, Icon, PlusBox, Wordmark, type IconName } from './marks';
import { nativeSettings, nativeStorage } from './storage';

type C = Record<ColorRole, string>;
type Tab = 'charts' | 'polls' | 'find' | 'you';

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider storage={nativeSettings}>
        <StoreProvider storage={nativeStorage}>
          <Shell />
        </StoreProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function useColors(): { c: C; dark: boolean } {
  const { settings } = useSettings();
  const device = useColorScheme();
  const dark = settings.appearance === 'Match device' ? device !== 'light' : settings.appearance !== 'Light';
  return { c: colors(dark ? 'dark' : 'light'), dark };
}

function Shell() {
  const { c, dark } = useColors();
  const [tab, setTab] = useState<Tab>('charts');
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const say = (t: string) => {
    setNote(t);
    setTimeout(() => setNote((n) => (n === t ? '' : n)), 4000);
  };
  const violet = tab === 'polls';
  const accent = violet ? c.violet : c.flare;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        {open ? (
          <ListScreen id={open} c={c} onBack={() => setOpen(null)} />
        ) : tab === 'charts' ? (
          <Charts c={c} onOpen={setOpen} />
        ) : tab === 'polls' ? (
          <Polls c={c} />
        ) : tab === 'find' ? (
          <Find c={c} say={say} />
        ) : (
          <You c={c} onOpen={setOpen} />
        )}
      </View>
      {!!note && (
        <View style={[s.toast, { backgroundColor: c['toast-bg'] }]} accessibilityLiveRegion="polite">
          <PlusBox height={16} color={c['toast-text']} />
          <Text style={{ color: c['toast-text'], fontWeight: '600', fontSize: 13 }}>{note}</Text>
        </View>
      )}
      <SafeAreaView edges={['bottom']} style={[s.bar, { backgroundColor: c.bg, borderTopColor: c['surface-1'] }]}>
        {(
          [
            ['charts', 'Charts', 'list'],
            ['polls', 'Polls', 'poll'],
            ['find', 'Find', 'search'],
            ['you', 'You', 'person'],
          ] as [Tab, string, IconName][]
        ).map(([k, label, icon]) => {
          const on = tab === k && !open;
          return (
            <Pressable
              key={k}
              onPress={() => {
                setTab(k);
                setOpen(null);
              }}
              style={s.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={label}
            >
              <View style={{ height: 2, alignSelf: 'stretch', marginHorizontal: 18, backgroundColor: on ? accent : 'transparent' }} />
              <Icon name={icon} size={20} color={on ? c.text : c['text-3']} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: on ? c.text : c['text-3'] }}>{label}</Text>
            </Pressable>
          );
        })}
      </SafeAreaView>
    </SafeAreaView>
  );
}

/** Charts: what you pinned, then your categories. */
function Charts({ c, onOpen }: { c: C; onOpen: (id: string) => void }) {
  const store = useStore();
  const pinned = store.lists.filter((L) => L.pinned);
  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 18 }}>
        <Wordmark height={30} color={c.flare} />
        <PlusBox height={24} color={c.flare} />
      </View>
      {pinned.length > 0 && <Text style={[s.label, { color: c['text-3'] }]}>Pinned</Text>}
      {pinned.map((L) => (
        <Pressable key={L.id} onPress={() => onOpen(L.id)} style={[s.card, { backgroundColor: c['surface-1'], borderLeftColor: c.flare }]} accessibilityRole="button">
          <CategoryTag name={store.categories.find((x) => x.id === L.cat)?.name ?? L.cat} height={16} color={c.flare} />
          <Text style={[s.hero, { color: c.text, fontSize: 22 }]}>{L.name}</Text>
          <Text style={{ color: c['text-3'], fontSize: 12 }}>{listSummary(L)}</Text>
        </Pressable>
      ))}
      <Text style={[s.label, { color: c['text-3'], paddingTop: 18 }]}>Your categories</Text>
      {store.categories.map((cat) => {
        const lists = store.listsIn(cat.id);
        if (!lists.length) return null;
        return (
          <View key={cat.id} style={{ paddingVertical: 10, gap: 6 }}>
            <CategoryTag name={cat.name} height={24} color={c.flare} />
            {lists.map((L) => (
              <Pressable key={L.id} onPress={() => onOpen(L.id)} style={[s.row, { borderBottomColor: c['surface-1'] }]} accessibilityRole="button">
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', flex: 1 }}>{L.name}</Text>
                <Text style={{ color: c['text-3'], fontSize: 12 }}>
                  {filledCount(L)}/{L.n}
                  {L.poll ? ' · Poll' : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const MOVE_INK = (c: C) => ({ up: c.up, down: c['flare-soft'], same: c['text-off'], new: c['text-2'], none: c['text-off'] });

/** A list: rank, move, title, maker. Tap a row to pick it, then move it with ▲ ▼ (drag comes with gestures). */
function ListScreen({ id, c, onBack }: { id: string; c: C; onBack: () => void }) {
  const store = useStore();
  const L = store.list(id);
  const [sel, setSel] = useState<number | null>(null);
  if (!L) {
    return (
      <View style={s.page}>
        <Text style={[s.hero, { color: c.text, fontSize: 28 }]}>This list isn’t here</Text>
        <Pressable onPress={onBack} style={[s.btn, { backgroundColor: c.flare }]}>
          <Text style={[s.btnText, { color: c['on-flare'] }]}>Back to charts</Text>
        </Pressable>
      </View>
    );
  }
  const slots = slotsOf(L);
  const ink = MOVE_INK(c);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= slots.length || !slots[from]) return;
    store.replaceList(moveEntry(L, from, to));
    setSel(to);
  };
  return (
    <ScrollView contentContainerStyle={[s.page, { paddingHorizontal: 0 }]}>
      <View style={{ paddingHorizontal: size['gutter-phone'], gap: 10, paddingBottom: 14 }}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={{ width: 44, height: 44, justifyContent: 'center' }}>
          <Icon name="back" size={22} color={c.text} />
        </Pressable>
        <CategoryTag name={store.categories.find((x) => x.id === L.cat)?.name ?? L.cat} height={18} color={c.flare} />
        <Text style={[s.hero, { color: c.text, fontSize: 34 }]}>{L.name}</Text>
      </View>
      {slots.map((xid, ix) => {
        if (!xid) {
          return (
            <View key={`open-${ix}`} style={[s.lrow, { borderBottomColor: c['surface-1'] }]}>
              <Text style={[s.rank, { color: c.slot }]}>{pad2(ix + 1)}</Text>
              <Text style={{ color: c['text-off'], fontSize: 14 }}>No. {ix + 1} is open</Text>
            </View>
          );
        }
        const x = BY_ID[xid];
        if (!x) return null;
        const mv = moveOf(L, xid, ix);
        const on = sel === ix;
        return (
          <Pressable
            key={xid}
            onPress={() => setSel(on ? null : ix)}
            style={[s.lrow, { borderBottomColor: c['surface-1'], backgroundColor: on ? c['surface-1'] : 'transparent' }]}
            accessibilityLabel={`No. ${ix + 1}: ${x.t}, ${makerOf(x)}`}
            accessibilityHint="Tap, then move it up or down"
          >
            <Text style={[s.rank, { color: ix === 0 ? c.flare : c.text }]}>{pad2(ix + 1)}</Text>
            <Text style={{ width: 34, fontSize: 11, fontWeight: '800', color: ink[mv.tone] }} accessibilityLabel={mv.aria}>
              {mv.t}
            </Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: x.gone ? c['text-3'] : c.text, fontSize: 15, fontWeight: '700', textTransform: 'uppercase' }}>
                {x.t}
              </Text>
              <Text numberOfLines={1} style={{ color: c['text-3'], fontSize: 12 }}>
                {makerOf(x)}
              </Text>
            </View>
            {on && (
              <View style={{ flexDirection: 'row' }}>
                <Pressable onPress={() => move(ix, ix - 1)} style={s.icon} accessibilityLabel={`Move ${x.t} up`}>
                  <Text style={{ color: c.text, fontSize: 16 }}>▲</Text>
                </Pressable>
                <Pressable onPress={() => move(ix, ix + 1)} style={s.icon} accessibilityLabel={`Move ${x.t} down`}>
                  <Text style={{ color: c.text, fontSize: 16 }}>▼</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        );
      })}
      <Text style={{ color: c['text-3'], fontSize: 11.5, padding: size['gutter-phone'] }}>
        {filledCount(L)} of {L.n} · saved as you go
      </Text>
    </ScrollView>
  );
}

/** Polls: violet. Results after you vote. */
function Polls({ c }: { c: C }) {
  const [votes, setVotes] = useState<Record<string, number>>({});
  return (
    <ScrollView contentContainerStyle={[s.page, { gap: 12 }]}>
      <Text style={[s.label, { color: c['violet-text'] }]}>All polls</Text>
      {POLLS.map((p) => {
        const mine = p.closed ? p.voted : votes[p.id];
        const voted = mine !== undefined || !!p.closed;
        return (
          <View key={p.id} style={[s.card, { backgroundColor: c['surface-1'], borderLeftColor: c.violet }]}>
            {!!p.closed && <Text style={{ color: c['text-2'], fontSize: 13 }}>This poll is closed. Here’s how it ended.</Text>}
            <Text style={[s.hero, { color: c.text, fontSize: 19 }]}>{p.q}</Text>
            {p.o.map(([label, share], i) => (
              <Pressable
                key={label}
                disabled={!!p.closed}
                onPress={() => setVotes((v) => ({ ...v, [p.id]: i }))}
                style={[s.row, { borderBottomColor: c['surface-2'] }]}
                accessibilityState={{ selected: mine === i }}
              >
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: voted ? `${share}%` : 0, backgroundColor: c['surface-2'] }} />
                <Text style={{ flex: 1, color: mine === i ? c['violet-text'] : c.text, fontWeight: '700', fontSize: 14 }}>{label}</Text>
                {voted && <Text style={{ color: c['text-2'], fontWeight: '800', fontSize: 13 }}>{share}%</Text>}
              </Pressable>
            ))}
            <Text style={{ color: c['text-3'], fontSize: 11.5 }}>
              {p.closed ? `Voting closed on ${p.closed}.` : voted ? 'Your vote is in. Change it any time.' : 'Results after you vote'}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

/** Find: anything in See; + adds it to your pinned list. Nothing matching? Add it as your own. */
function Find({ c, say }: { c: C; say: (t: string) => void }) {
  const store = useStore();
  const [q, setQ] = useState('');
  const results = useMemo(() => search(q), [q]);
  const target: List | undefined = store.lists.find((L) => L.pinned);
  const add = (xid: string, title: string) => {
    if (!target) return say(`${title}: pin a list to add to it`);
    const r = addToList(target, xid);
    if ('already' in r) return say(`Already on ${target.name}`);
    store.replaceList(r.list);
    say(r.below ? `Below the line on ${target.name}` : `${title} in at No. ${r.at + 1}`);
  };
  return (
    <ScrollView contentContainerStyle={[s.page, { gap: 6 }]} keyboardShouldPersistTaps="handled">
      <View style={[s.field, { borderColor: c.flare, backgroundColor: c['surface-1'] }]}>
        <Icon name="search" size={18} color={c['text-3']} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Find songs, films, people"
          placeholderTextColor={c['text-3']}
          style={{ flex: 1, color: c.text, fontSize: 15 }}
          accessibilityLabel="Find songs, films, people"
          autoCorrect={false}
        />
      </View>
      {results.map((x) => (
        <View key={x.id} style={[s.row, { borderBottomColor: c['surface-1'] }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 14, textTransform: 'uppercase' }}>{x.t}</Text>
            <Text style={{ color: c['text-3'], fontSize: 12 }}>{makerOf(x)}</Text>
          </View>
          <Pressable onPress={() => add(x.id, x.t)} style={s.icon} accessibilityLabel={`Add ${x.t}${target ? ` to ${target.name}` : ''}`}>
            <PlusBox height={20} color={c.flare} />
          </Pressable>
        </View>
      ))}
      {q.trim().length > 1 && results.length === 0 && (
        <View style={{ gap: 8, paddingTop: 8 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>Nothing matches “{q.trim()}”</Text>
          <Text style={{ color: c['text-3'], fontSize: 12 }}>Check the spelling, or add it as your own item. You can link a source later.</Text>
          <Pressable
            style={[s.btn, { backgroundColor: c.flare }]}
            onPress={() => {
              if (!target) return say('Pin a list to add your own');
              const x = store.addOwn(q, 'song');
              add(x.id, x.t);
              setQ('');
            }}
          >
            <Text style={[s.btnText, { color: c['on-flare'] }]}>Add “{q.trim()}”</Text>
          </Pressable>
        </View>
      )}
      <Text style={{ color: c['text-3'], fontSize: 11.5, paddingTop: 8 }}>{target ? `+ adds to ${target.name}` : ''}</Text>
    </ScrollView>
  );
}

/** You: at a glance, your No. 1, your people, and every list. */
function You({ c, onOpen }: { c: C; onOpen: (id: string) => void }) {
  const store = useStore();
  const { settings } = useSettings();
  const people = [...new Set(store.lists.flatMap((L) => L.people))];
  const top = store.lists.find((L) => L.pinned && slotsOf(L)[0]);
  const no1 = top ? BY_ID[slotsOf(top)[0]!] : undefined;
  return (
    <ScrollView contentContainerStyle={[s.page, { gap: 18 }]}>
      <View>
        <Text style={[s.hero, { color: c.text, fontSize: 30 }]}>{settings.name}</Text>
        <Text style={{ color: c['text-3'], fontSize: 12 }}>{settings.handle}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(
          [
            [store.lists.length, 'Lists'],
            [store.lists.filter((L) => L.poll).length, 'Polls'],
            [people.length, 'People'],
          ] as const
        ).map(([n, l]) => (
          <View key={l} style={[s.stat, { backgroundColor: c['surface-1'] }]}>
            <Text style={[s.hero, { color: c.text, fontSize: 26 }]}>{n}</Text>
            <Text style={{ color: c['text-3'], fontSize: 12 }}>{l}</Text>
          </View>
        ))}
      </View>
      {no1 && top && (
        <Pressable onPress={() => onOpen(top.id)} style={[s.card, { backgroundColor: c['surface-1'], borderLeftColor: c.flare }]}>
          <Text style={[s.label, { color: c['text-3'] }]}>Your No. 1</Text>
          <Text style={{ color: c.text, fontWeight: '800', textTransform: 'uppercase' }}>{no1.t}</Text>
          <Text style={{ color: c['text-3'], fontSize: 12 }}>{no1.m}</Text>
        </Pressable>
      )}
      {people.length > 0 && (
        <View>
          <Text style={[s.label, { color: c['text-3'] }]}>Your people</Text>
          {people.map((h) => (
            <View key={h} style={[s.row, { borderBottomColor: c['surface-1'] }]}>
              <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>@{h}</Text>
              <Text style={{ color: c['text-3'], fontSize: 12 }}>
                {PEOPLE[h]} · on {store.lists.filter((L) => L.people.includes(h)).length} of your lists
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const display: TextStyle = { fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 };

const s = StyleSheet.create({
  page: { paddingHorizontal: size['gutter-phone'], paddingTop: 12, paddingBottom: 40 },
  hero: display,
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', paddingBottom: 8 },
  card: { padding: 16, gap: 8, borderLeftWidth: 3, marginBottom: 10 },
  row: { minHeight: size['hit-min'], flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, paddingVertical: 8 },
  lrow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, paddingHorizontal: size['gutter-phone'] },
  rank: { width: 30, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  icon: { width: size['hit-min'], height: size['hit-min'], alignItems: 'center', justifyContent: 'center' },
  btn: { alignSelf: 'flex-start', height: size['button-sm'], paddingHorizontal: 16, justifyContent: 'center', transform: [{ skewX: '-12deg' }] },
  btnText: { fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, transform: [{ skewX: '12deg' }] },
  field: { height: size.field, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderWidth: 1, marginBottom: 6 },
  stat: { flex: 1, padding: 14, gap: 2 },
  toast: { position: 'absolute', left: 20, right: 20, bottom: 96, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  bar: { flexDirection: 'row', borderTopWidth: 1 },
  tab: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
});
