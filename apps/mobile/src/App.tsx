/*
 * See on iOS and Android (PixelPhone, V3Responsive phone shell): the bottom bar (Charts, Polls, Find, You), the
 * masthead, your lists by category, a list you can rank, polls you can vote in, Find, and your page. Everything it
 * knows comes from @see/core, so it says and does what the web app does.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import * as Linking from 'expo-linking';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BY_ID, PEOPLE, SEED_ACTIVITY, addToList, filledCount, listSummary, makerOf, search, slotsOf, type List } from '@see/core';
import { PlayerProvider, SettingsProvider, StoreProvider, usePlayer, useSettings, useStore } from '@see/core/react';
import { size } from '@see/tokens';
import { CategoryTag, Icon, PlusBox, Wordmark, type IconName } from './marks';
import { nativeSettings, nativeStorage } from './storage';
import { Txt, useBrandFonts } from './type';
import { Launch } from './Launch';
import { ListScreen, Skeleton } from './ListScreen';
import { JoinScreen } from './Access';
import { PlusField } from './Field';
import { MiniPlayer, PlayerSheet } from './Player';
import { useColors, type C } from './theme';
import { Polls } from './Polls';
import { ProfilePicture } from './ProfilePicture';
import { SettingsScreen } from './Settings';
import { Auth } from './Auth';
import { usePushDelivery } from './notify';
import { Sheet } from './Sheet';
import { NavCtx, useNav, type Nav, type Route, type Tab } from './nav';
import { ActivityScreen, Button, CategoryScreen, CreateSheet, PersonScreen, useFollowLink } from './Screens';

const SESSION = 'see.session.v1';
const SEEN = 'see.activity.seen';
const SESSION_AT = 'see.session.at';
const SESSION_DAYS = 30;

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider storage={nativeSettings}>
        <StoreProvider storage={nativeStorage}>
          <PlayerProvider>
            <Root />
          </PlayerProvider>
        </StoreProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

/** Signed in, the app; signed out, sign up or log in. The launch plays over whichever opens. */
function Root() {
  const fonts = useBrandFonts();
  const { c, dark } = useColors();
  const { settings } = useSettings();
  const [session, setSession] = useState<'wait' | 'in' | 'out'>('wait');
  const [ended, setEnded] = useState(false);
  const [authMode, setAuthMode] = useState<'up' | 'in'>('up');
  useEffect(() => {
    AsyncStorage.multiGet([SESSION, SESSION_AT]).then(
      ([[, v], [, at]]) => {
        setSession(v === 'in' ? 'in' : 'out');
        if (v !== 'in') return;
        // a long time away (A5): signed out to keep the account safe; a sheet over where you were, not a bounce
        if (at && Date.now() - Number(at) > SESSION_DAYS * 86_400_000) setEnded(true);
        else AsyncStorage.setItem(SESSION_AT, String(Date.now())).catch(() => {});
      },
      () => setSession('out'),
    );
  }, []);
  const signIn = () => {
    setSession('in');
    setEnded(false);
    AsyncStorage.multiSet([
      [SESSION, 'in'],
      [SESSION_AT, String(Date.now())],
    ]).catch(() => {});
  };
  const signOut = () => {
    setSession('out');
    setEnded(false);
    setAuthMode('in');
    AsyncStorage.removeItem(SESSION).catch(() => {});
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={session === 'out' ? 'dark' : dark ? 'light' : 'dark'} />
      {fonts && session === 'in' && <Shell onSignOut={signOut} />}
      {fonts && session === 'out' && <Auth onIn={signIn} initialMode={authMode} />}
      {fonts && session === 'in' && ended && (
        <Sheet c={c} onClose={() => {}} label="Session ended">
          <Txt style={{ color: c['text-3'], fontSize: 11, fontWeight: '600', letterSpacing: 1.2 }}>SESSION ENDED</Txt>
          <Txt style={[s.hero, { color: c.text, fontSize: 26 }]}>Sign in again</Txt>
          <Txt style={{ color: c['text-2'], fontSize: 14, lineHeight: 21 }}>
            It’s been a while, so we signed you out to keep your account safe. Your lists are exactly as you left them.
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Button label="Continue with Google" c={c} onPress={signIn} />
            <Txt style={{ color: c['text-3'], fontSize: 11, fontWeight: '600' }}>Last used</Txt>
          </View>
          <Pressable onPress={signOut} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
            <Txt style={{ color: c.text, fontWeight: '700', textDecorationLine: 'underline' }}>Use email instead</Txt>
          </Pressable>
        </Sheet>
      )}
      <Launch bg={c.bg} flare={c.flare} reduce={settings.reduceMotion} />
    </View>
  );
}

function Shell({ onSignOut }: { onSignOut: () => void }) {
  const { c } = useColors();
  const player = usePlayer();
  const [tab, setTabState] = useState<Tab>('charts');
  const [stack, setStack] = useState<Route[]>([]);
  const [creating, setCreating] = useState<{ name: string; cat?: string } | null>(null);
  const [seen, setSeen] = useState(true);
  const [note, setNote] = useState('');
  const [covers, setCovers] = useState(0);
  const insets = useSafeAreaInsets();
  const top = stack[stack.length - 1];
  const say = (t: string) => {
    setNote(t);
    setTimeout(() => setNote((n) => (n === t ? '' : n)), 4000);
  };
  useEffect(() => {
    AsyncStorage.getItem(SEEN).then((v) => setSeen(v === '1'), () => {});
  }, []);
  const nav = useMemo<Nav>(
    () => ({
      push: (r) => {
        if (r.k === 'activity') {
          setSeen(true);
          AsyncStorage.setItem(SEEN, '1').catch(() => {});
        }
        // settings move within themselves; everything else stacks
        setStack((st) => (r.k === 'settings' && st[st.length - 1]?.k === 'settings' ? [...st.slice(0, -1), r] : [...st, r]));
      },
      pop: () => setStack((st) => st.slice(0, -1)),
      tab: (t) => {
        setTabState(t);
        setStack([]);
      },
      create: (name = '', cat) => setCreating({ name, cat }),
      say,
      signOut: onSignOut,
      cover: () => {
        setCovers((n) => n + 1);
        return () => setCovers((n) => n - 1);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSignOut],
  );

  // Android's back steps out one level: a legal page to Help, a section to Settings, any other page off the stack
  const here = useRef(stack);
  here.current = stack;
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const t = here.current[here.current.length - 1];
      if (!t) return false;
      if (t.k === 'settings' && (t.page === 'terms' || t.page === 'privacy')) nav.push({ k: 'settings', page: 'help' });
      else if (t.k === 'settings' && t.page !== 'home') nav.push({ k: 'settings', page: 'home' });
      else nav.pop();
      return true;
    });
    return () => sub.remove();
  }, [nav]);

  // see:// links (a notification, a shared list, someone's page) open where they point
  const url = Linking.useLinkingURL();
  const followLink = useRef<(l: string) => void>(() => {});
  // push: register this phone, and a tapped notification opens where it points
  usePushDelivery((l) => followLink.current(l));
  useEffect(() => {
    if (url && url.startsWith('see://')) followLink.current(url);
  }, [url]);

  // offline is a condition, not a dead end: a quiet banner, and one toast when you're back
  const net = useNetInfo();
  const offline = net.isConnected === false;
  const was = useRef(offline);
  useEffect(() => {
    if (was.current && !offline) say('Back online · your changes are saved');
    was.current = offline;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline]);

  const unread = seen ? 0 : SEED_ACTIVITY.filter((a) => a.unread).length;
  const violet = tab === 'polls' && !top;
  const accent = violet ? c.violet : c.flare;

  return (
    <NavCtx.Provider value={nav}>
      <LinkFollower set={(f) => (followLink.current = f)} />
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
        {offline && (
          <View style={[s.banner, { backgroundColor: c['surface-2'], borderLeftColor: c['text-off'] }]} accessibilityRole="alert">
            <Txt style={{ color: c.text, fontSize: 12.5, lineHeight: 18 }}>
              You’re offline. Every list you’ve opened still opens, ranks and plays what’s saved; changes stay on this phone until you’re back.
            </Txt>
          </View>
        )}
        <View style={{ flex: 1 }}>
          {top?.k === 'list' ? (
            <ListScreen key={top.id} id={top.id} c={c} />
          ) : top?.k === 'cat' ? (
            <CategoryScreen id={top.id} c={c} />
          ) : top?.k === 'activity' ? (
            <ActivityScreen c={c} />
          ) : top?.k === 'join' ? (
            <JoinScreen key={top.code} code={top.code} c={c} />
          ) : top?.k === 'person' ? (
            <PersonScreen key={top.h} h={top.h} c={c} />
          ) : top?.k === 'settings' ? (
            <SettingsScreen page={top.page} go={(page) => nav.push({ k: 'settings', page })} onClose={nav.pop} c={c} say={say} />
          ) : tab === 'charts' ? (
            <Charts c={c} />
          ) : tab === 'polls' ? (
            <Polls c={c} />
          ) : tab === 'find' ? (
            <Find c={c} say={say} />
          ) : (
            <You c={c} unread={unread} />
          )}
        </View>
        {player.xid && player.view === 'mini' && <MiniPlayer c={c} />}
        <SafeAreaView edges={['bottom']} style={[s.bar, { backgroundColor: c.bg, borderTopColor: c['surface-1'] }]}>
          {(
            [
              ['charts', 'Charts', 'list'],
              ['polls', 'Polls', 'poll'],
              ['+', 'New list', 'plus'],
              ['find', 'Find', 'search'],
              ['you', 'You', 'person'],
            ] as [Tab | '+', string, IconName][]
          ).map(([k, label, icon]) => {
            if (k === '+') {
              return (
                <Pressable key={k} onPress={() => nav.create()} style={s.tab} accessibilityRole="button" accessibilityLabel={label}>
                  <View style={{ height: 2 }} />
                  <PlusBox height={30} color={accent} />
                  <View style={{ height: 13 }} />
                </Pressable>
              );
            }
            const on = tab === k && !top;
            return (
              <Pressable key={k} onPress={() => nav.tab(k)} style={s.tab} accessibilityRole="tab" aria-selected={on} accessibilityLabel={label}>
                <View style={{ height: 2, alignSelf: 'stretch', marginHorizontal: 14, backgroundColor: on ? accent : 'transparent' }} />
                <Icon name={icon} size={20} color={on ? c.text : c['text-3']} />
                <Txt style={{ fontSize: 11, fontWeight: '600', color: on ? c.text : c['text-3'] }}>{label}</Txt>
              </Pressable>
            );
          })}
        </SafeAreaView>
        {player.xid && player.view === 'sheet' && <PlayerSheet c={c} say={say} onOpenList={(id) => nav.push({ k: 'list', id })} />}
        {creating && <CreateSheet c={c} initialName={creating.name} initialCat={creating.cat} onClose={() => setCreating(null)} />}
        {/* above the tabs (and the bar that plays); with a sheet or the player open, at the top, so it never covers them */}
        {!!note && (
          <View
            style={[
              s.toast,
              { backgroundColor: c['toast-bg'] },
              covers > 0 || (player.xid && player.view === 'sheet') ? { top: insets.top + 8 } : { bottom: (player.xid && player.view === 'mini' ? 136 : 80) + insets.bottom },
            ]}
            accessibilityLiveRegion="polite"
            pointerEvents="none"
          >
            <PlusBox height={16} color={c['toast-text']} />
            <Txt style={{ color: c['toast-text'], fontWeight: '600', fontSize: 13, flexShrink: 1 }}>{note}</Txt>
          </View>
        )}
      </SafeAreaView>
    </NavCtx.Provider>
  );
}

/** Hands the shell a link follower that can use the nav (it lives inside the provider). */
function LinkFollower({ set }: { set: (f: (l: string) => void) => void }) {
  const follow = useFollowLink();
  set(follow);
  return null;
}

/** Charts: what you pinned, then your categories. */
function Charts({ c }: { c: C }) {
  const store = useStore();
  const [mast, setMast] = useState({ w: 0, h: 0 });
  const nav = useNav();
  const onOpen = (id: string) => nav.push({ k: 'list', id });
  const pinned = store.lists.filter((L) => L.pinned);
  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={{ marginHorizontal: -size['gutter-phone'], marginTop: -12, paddingHorizontal: size['gutter-phone'], paddingTop: 16, paddingBottom: 22, overflow: 'hidden' }} onLayout={(e) => setMast({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <PlusField width={mast.w} height={mast.h} color={c.flare} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Wordmark height={30} color={c.flare} />
          <PlusBox height={24} color={c.flare} />
        </View>
      </View>
      {!store.ready && <Skeleton c={c} rows={6} />}
      {store.ready && store.lists.length === 0 && (
        <View style={{ gap: 12, paddingVertical: 12 }}>
          <Txt style={[s.hero, { color: c.text, fontSize: 28 }]}>Your first list</Txt>
          <Txt style={{ color: c['text-2'], fontSize: 14, lineHeight: 21 }}>Name something you’d rank: a year of songs, the films you love, shows to start. See files it for you.</Txt>
          <Button label="Make a list" c={c} onPress={() => nav.create()} />
          <Txt style={[s.label, { color: c['text-3'], paddingTop: 10 }]}>Or start from one of these</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {['Songs of the year', 'Films I love', 'Shows to start'].map((n) => (
              <Pressable key={n} onPress={() => nav.create(n)} style={{ minHeight: 34, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: c['surface-1'] }}>
                <Txt style={{ color: c.text, fontSize: 12.5, fontWeight: '600' }}>{n}</Txt>
              </Pressable>
            ))}
          </View>
        </View>
      )}
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
            <Pressable onPress={() => nav.push({ k: 'cat', id: cat.id })} accessibilityRole="button" accessibilityLabel={`Open ${cat.name.toLowerCase()}`} style={{ alignSelf: 'flex-start' }}>
              <CategoryTag name={cat.name} height={24} color={c.flare} />
            </Pressable>
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
function You({ c, unread }: { c: C; unread: number }) {
  const store = useStore();
  const nav = useNav();
  const onSettings = () => nav.push({ k: 'settings', page: 'home' });
  const player = usePlayer();
  const { settings } = useSettings();
  const people = [...new Set(store.lists.flatMap((L) => L.people))];
  const top = store.lists.find((L) => L.pinned && slotsOf(L)[0]);
  const no1 = top ? BY_ID[slotsOf(top)[0]!] : undefined;
  return (
    <ScrollView contentContainerStyle={[s.page, { gap: 18 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable onPress={onSettings} accessibilityRole="button" accessibilityLabel="Your picture: edit your profile">
          <ProfilePicture size={64} />
          <View style={[s.edit, { backgroundColor: c.flare }]}>
            <Txt style={{ color: c['on-flare'], fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 }}>EDIT</Txt>
          </View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Txt style={[s.hero, { color: c.text, fontSize: 26 }]}>{settings.name}</Txt>
          <Txt style={{ color: c['text-3'], fontSize: 12 }}>{settings.handle}</Txt>
          {!!settings.bio && <Txt style={{ color: c['text-2'], fontSize: 13 }}>{settings.bio}</Txt>}
        </View>
        <Pressable onPress={() => nav.push({ k: 'activity' })} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={unread ? `Activity: ${unread} new` : 'Activity'}>
          <Icon name="bell" size={22} color={c.text} />
          {unread > 0 && (
            <View style={{ position: 'absolute', right: 5, top: 5, minWidth: 14, height: 14, paddingHorizontal: 3, backgroundColor: c.flare, alignItems: 'center', justifyContent: 'center' }}>
              <Txt style={{ color: c['on-flare'], fontSize: 9.5, fontWeight: '900' }}>{unread}</Txt>
            </View>
          )}
        </Pressable>
      </View>
      <Pressable onPress={onSettings} accessibilityRole="button" style={[s.row, { borderBottomColor: c['surface-1'], borderTopWidth: 1, borderTopColor: c['surface-1'] }]}>
        <Txt style={{ flex: 1, color: c.text, fontSize: 14, fontWeight: '600' }}>Settings</Txt>
        <Icon name="chev" size={14} color={c['text-3']} />
      </Pressable>
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
            <Pressable key={h} onPress={() => nav.push({ k: 'person', h })} style={[s.row, { borderBottomColor: c['surface-1'] }]} accessibilityLabel={`@${h}: open their page`}>
              <Txt style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>@{h}</Txt>
              <Txt style={{ color: c['text-3'], fontSize: 12 }}>
                {PEOPLE[h]} · on {store.lists.filter((L) => L.people.includes(h)).length} of your lists
              </Txt>
            </Pressable>
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
  edit: { position: 'absolute', left: -2, bottom: -6, height: 14, paddingHorizontal: 5, justifyContent: 'center', transform: [{ skewX: '-9deg' }] },
  banner: { marginHorizontal: 20, marginTop: 8, padding: 12, borderLeftWidth: 3 },
  toast: { position: 'absolute', left: 20, right: 20, zIndex: 60, elevation: 12, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  bar: { flexDirection: 'row', borderTopWidth: 1 },
  tab: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
});
