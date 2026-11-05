/*
 * See on iOS and Android (PixelPhone, V3Responsive phone shell): the bottom bar (Charts, Polls, Find, You), the
 * masthead, your lists by category, a list you can rank, polls you can vote in, Find, and your page. Everything it
 * knows comes from @see/core, so it says and does what the web app does.
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, type TextStyle } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BY_ID, POLLS, PEOPLE, addToList, filledCount, listSummary, makerOf, search, slotsOf, type List } from '@see/core';
import { PlayerProvider, SettingsProvider, StoreProvider, usePlayer, useSettings, useStore } from '@see/core/react';
import { size } from '@see/tokens';
import { CategoryTag, Icon, PlusBox, Wordmark, type IconName } from './marks';
import { nativeSettings, nativeStorage } from './storage';
import { Txt, useBrandFonts } from './type';
import { Launch } from './Launch';
import { ListScreen } from './ListScreen';
import { MiniPlayer, PlayerSheet } from './Player';
import { useColors, type C } from './theme';

type Tab = 'charts' | 'polls' | 'find' | 'you';

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider storage={nativeSettings}>
        <StoreProvider storage={nativeStorage}>
          <PlayerProvider>
            <Shell />
          </PlayerProvider>
        </StoreProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function Shell() {
  const fonts = useBrandFonts();
  const { c, dark } = useColors();
  const player = usePlayer();
  const [tab, setTab] = useState<Tab>('charts');
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const say = (t: string) => {
    setNote(t);
    setTimeout(() => setNote((n) => (n === t ? '' : n)), 4000);
  };
  const violet = tab === 'polls';
  const accent = violet ? c.violet : c.flare;
  if (!fonts) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

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
          <You c={c} />
        )}
      </View>
      {!!note && (
        <View style={[s.toast, { backgroundColor: c['toast-bg'] }]} accessibilityLiveRegion="polite">
          <PlusBox height={16} color={c['toast-text']} />
          <Txt style={{ color: c['toast-text'], fontWeight: '600', fontSize: 13 }}>{note}</Txt>
        </View>
      )}
      {player.xid && player.view === 'mini' && <MiniPlayer c={c} />}
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
              <Txt style={{ fontSize: 11, fontWeight: '600', color: on ? c.text : c['text-3'] }}>{label}</Txt>
            </Pressable>
          );
        })}
      </SafeAreaView>
      {player.xid && player.view === 'sheet' && (
        <PlayerSheet
          c={c}
          say={say}
          onOpenList={(id) => {
            setOpen(id);
          }}
        />
      )}
      <Launch bg={c.bg} flare={c.flare} />
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
      {pinned.length > 0 && <Txt style={[s.label, { color: c['text-3'] }]}>Pinned</Txt>}
      {pinned.map((L) => (
        <Pressable key={L.id} onPress={() => onOpen(L.id)} style={[s.card, { backgroundColor: c['surface-1'], borderLeftColor: c.flare }]} accessibilityRole="button">
          <CategoryTag name={store.categories.find((x) => x.id === L.cat)?.name ?? L.cat} height={16} color={c.flare} />
          <Txt style={[s.hero, { color: c.text, fontSize: 22 }]}>{L.name}</Txt>
          <Txt style={{ color: c['text-3'], fontSize: 12 }}>{listSummary(L)}</Txt>
        </Pressable>
      ))}
      <Txt style={[s.label, { color: c['text-3'], paddingTop: 18 }]}>Your categories</Txt>
      {store.categories.map((cat) => {
        const lists = store.listsIn(cat.id);
        if (!lists.length) return null;
        return (
          <View key={cat.id} style={{ paddingVertical: 10, gap: 6 }}>
            <CategoryTag name={cat.name} height={24} color={c.flare} />
            {lists.map((L) => (
              <Pressable key={L.id} onPress={() => onOpen(L.id)} style={[s.row, { borderBottomColor: c['surface-1'] }]} accessibilityRole="button">
                <Txt style={{ color: c.text, fontSize: 15, fontWeight: '700', flex: 1 }}>{L.name}</Txt>
                <Txt style={{ color: c['text-3'], fontSize: 12 }}>
                  {filledCount(L)}/{L.n}
                  {L.poll ? ' · Poll' : ''}
                </Txt>
              </Pressable>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

/** Polls: violet. Results after you vote. */
function Polls({ c }: { c: C }) {
  const [votes, setVotes] = useState<Record<string, number>>({});
  return (
    <ScrollView contentContainerStyle={[s.page, { gap: 12 }]}>
      <Txt style={[s.label, { color: c['violet-text'] }]}>All polls</Txt>
      {POLLS.map((p) => {
        const mine = p.closed ? p.voted : votes[p.id];
        const voted = mine !== undefined || !!p.closed;
        return (
          <View key={p.id} style={[s.card, { backgroundColor: c['surface-1'], borderLeftColor: c.violet }]}>
            {!!p.closed && <Txt style={{ color: c['text-2'], fontSize: 13 }}>This poll is closed. Here’s how it ended.</Txt>}
            <Txt style={[s.hero, { color: c.text, fontSize: 19 }]}>{p.q}</Txt>
            {p.o.map(([label, share], i) => (
              <Pressable
                key={label}
                disabled={!!p.closed}
                onPress={() => setVotes((v) => ({ ...v, [p.id]: i }))}
                style={[s.row, { borderBottomColor: c['surface-2'] }]}
                accessibilityState={{ selected: mine === i }}
              >
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: voted ? `${share}%` : 0, backgroundColor: c['surface-2'] }} />
                <Txt style={{ flex: 1, color: mine === i ? c['violet-text'] : c.text, fontWeight: '700', fontSize: 14 }}>{label}</Txt>
                {voted && <Txt style={{ color: c['text-2'], fontWeight: '800', fontSize: 13 }}>{share}%</Txt>}
              </Pressable>
            ))}
            <Txt style={{ color: c['text-3'], fontSize: 11.5 }}>
              {p.closed ? `Voting closed on ${p.closed}.` : voted ? 'Your vote is in. Change it any time.' : 'Results after you vote'}
            </Txt>
          </View>
        );
      })}
    </ScrollView>
  );
}

/** Find: anything in See; + adds it to your pinned list. Nothing matching? Add it as your own. */
function Find({ c, say }: { c: C; say: (t: string) => void }) {
  const store = useStore();
  const player = usePlayer();
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
          style={{ flex: 1, color: c.text, fontSize: 15, fontFamily: 'InstrumentSans_400Regular' }}
          accessibilityLabel="Find songs, films, people"
          autoCorrect={false}
        />
      </View>
      {results.map((x) => (
        <View key={x.id} style={[s.row, { borderBottomColor: c['surface-1'] }]}>
          <Pressable style={{ flex: 1 }} onPress={() => player.play(x.id, { listId: null, view: 'sheet' })} accessibilityLabel={`Open ${x.t}`}>
            <Txt style={{ color: c.text, fontWeight: '800', fontSize: 14, textTransform: 'uppercase' }}>{x.t}</Txt>
            <Txt style={{ color: c['text-3'], fontSize: 12 }}>{makerOf(x)}</Txt>
          </Pressable>
          <Pressable onPress={() => add(x.id, x.t)} style={s.icon} accessibilityLabel={`Add ${x.t}${target ? ` to ${target.name}` : ''}`}>
            <PlusBox height={20} color={c.flare} />
          </Pressable>
        </View>
      ))}
      {q.trim().length > 1 && results.length === 0 && (
        <View style={{ gap: 8, paddingTop: 8 }}>
          <Txt style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>Nothing matches “{q.trim()}”</Txt>
          <Txt style={{ color: c['text-3'], fontSize: 12 }}>Check the spelling, or add it as your own item. You can link a source later.</Txt>
          <Pressable
            style={[s.btn, { backgroundColor: c.flare }]}
            onPress={() => {
              if (!target) return say('Pin a list to add your own');
              const x = store.addOwn(q, 'song');
              add(x.id, x.t);
              setQ('');
            }}
          >
            <Txt style={[s.btnText, { color: c['on-flare'] }]}>Add “{q.trim()}”</Txt>
          </Pressable>
        </View>
      )}
      <Txt style={{ color: c['text-3'], fontSize: 11.5, paddingTop: 8 }}>{target ? `+ adds to ${target.name}` : ''}</Txt>
    </ScrollView>
  );
}

/** You: at a glance, your No. 1, your people, and every list. */
function You({ c }: { c: C }) {
  const store = useStore();
  const player = usePlayer();
  const { settings } = useSettings();
  const people = [...new Set(store.lists.flatMap((L) => L.people))];
  const top = store.lists.find((L) => L.pinned && slotsOf(L)[0]);
  const no1 = top ? BY_ID[slotsOf(top)[0]!] : undefined;
  return (
    <ScrollView contentContainerStyle={[s.page, { gap: 18 }]}>
      <View>
        <Txt style={[s.hero, { color: c.text, fontSize: 30 }]}>{settings.name}</Txt>
        <Txt style={{ color: c['text-3'], fontSize: 12 }}>{settings.handle}</Txt>
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
            <Txt style={[s.hero, { color: c.text, fontSize: 26 }]}>{n}</Txt>
            <Txt style={{ color: c['text-3'], fontSize: 12 }}>{l}</Txt>
          </View>
        ))}
      </View>
      {no1 && top && (
        <Pressable
          onPress={() => (player.xid === no1.id ? player.toggle() : player.play(no1.id, { listId: top.id, view: 'mini' }))}
          style={[s.card, { backgroundColor: c['surface-1'], borderLeftColor: c.flare }]}
          accessibilityLabel={`Play ${no1.t}, your No. 1`}
        >
          <Txt style={[s.label, { color: c['text-3'] }]}>Your No. 1</Txt>
          <Txt style={{ color: c.text, fontWeight: '800', textTransform: 'uppercase' }}>{no1.t}</Txt>
          <Txt style={{ color: c['text-3'], fontSize: 12 }}>{no1.m} · plays in the bar</Txt>
        </Pressable>
      )}
      {people.length > 0 && (
        <View>
          <Txt style={[s.label, { color: c['text-3'] }]}>Your people</Txt>
          {people.map((h) => (
            <View key={h} style={[s.row, { borderBottomColor: c['surface-1'] }]}>
              <Txt style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>@{h}</Txt>
              <Txt style={{ color: c['text-3'], fontSize: 12 }}>
                {PEOPLE[h]} · on {store.lists.filter((L) => L.people.includes(h)).length} of your lists
              </Txt>
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
  toast: { position: 'absolute', left: 20, right: 20, bottom: 150, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  bar: { flexDirection: 'row', borderTopWidth: 1 },
  tab: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
});
