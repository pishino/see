/*
 * Settings on the phone (V3Settings): the same ten sections as the web, from @see/core, in the same groups, each
 * line saying what it is set to now. No Save button: a change is the change, kept in this phone's storage.
 */
import { useState } from 'react';
import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import {
  COLOURS,
  DEVICES,
  NOTIFICATIONS,
  PRIVACY,
  QUIET_HOURS,
  READS,
  SECTIONS,
  SECTION_GROUPS,
  SERVICES,
  TERMS,
  VERSION,
  sectionSummary,
  type SectionId,
  type Settings,
} from '@see/core';
import { useSettings } from '@see/core/react';
import { size } from '@see/tokens';
import { Choices, Label, LinkRow, QuietButton, Row, Switch, SwitchRow } from './controls';
import { Icon } from './marks';
import { ProfilePicture } from './ProfilePicture';
import { useNav } from './nav';
import { usePushPermission } from './push';
import { Sheet } from './Sheet';
import type { C } from './theme';
import { Txt } from './type';

export type SettingsPage = SectionId | 'home' | 'terms' | 'privacy';

function Head({ title, back, onBack, c }: { title: string; back: string; onBack: () => void; c: C }) {
  return (
    <View style={{ gap: 6, paddingBottom: 8 }}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={`Back to ${back}`} style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
        <Icon name="back" size={20} color={c.text} />
        <Txt style={{ color: c['text-2'], fontSize: 13, fontWeight: '600' }}>{back}</Txt>
      </Pressable>
      <Txt style={{ color: c.text, fontSize: 30, fontWeight: '900', textTransform: 'uppercase', lineHeight: 32 }} accessibilityRole="header">
        {title}
      </Txt>
    </View>
  );
}

export function SettingsScreen({ page, go, onClose, c, say }: { page: SettingsPage; go: (p: SettingsPage) => void; onClose: () => void; c: C; say: (t: string) => void }) {
  const { settings } = useSettings();
  if (page === 'terms' || page === 'privacy') return <Legal doc={page} c={c} onBack={() => go('help')} />;
  if (page === 'home') {
    return (
      <ScrollView contentContainerStyle={{ padding: size['gutter-phone'], paddingTop: 4, paddingBottom: 60 }}>
        <Head title="Settings" back="You" onBack={onClose} c={c} />
        <Pressable onPress={() => go('profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }} accessibilityRole="button" accessibilityLabel="Your profile">
          <ProfilePicture size={54} />
          <View>
            <Txt style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{settings.name}</Txt>
            <Txt style={{ color: c['text-3'], fontSize: 12 }}>{settings.handle}</Txt>
          </View>
        </Pressable>
        {SECTION_GROUPS.map(([group, ids]) => (
          <View key={group || 'more'}>
            {group ? <Label c={c}>{group}</Label> : <View style={{ height: 22 }} />}
            {ids.map((id) => {
              const sec = SECTIONS.find((x) => x.id === id)!;
              return <LinkRow key={id} title={sec.title} sub={sectionSummary(id, settings)} onPress={() => go(id)} c={c} />;
            })}
          </View>
        ))}
        <Txt style={{ color: c['text-3'], fontSize: 11.5, paddingTop: 20 }}>{VERSION}</Txt>
      </ScrollView>
    );
  }
  const sec = SECTIONS.find((x) => x.id === page)!;
  return (
    <ScrollView contentContainerStyle={{ padding: size['gutter-phone'], paddingTop: 4, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <Head title={sec.title} back="Settings" onBack={() => go('home')} c={c} />
      <Txt style={{ color: c['text-3'], fontSize: 13, paddingBottom: 8 }}>{sec.blurb}</Txt>
      <Section id={page} c={c} say={say} go={go} />
    </ScrollView>
  );
}

function Field<K extends 'name' | 'handle' | 'bio'>({ k, label, sub, clean, c }: { k: K; label: string; sub?: string; clean: (v: string) => string; c: C }) {
  const { settings, set } = useSettings();
  return (
    <Row title={label} sub={sub} c={c}>
      <TextInput
        value={settings[k]}
        onChangeText={(v) => set(k, clean(v) as Settings[K])}
        accessibilityLabel={label}
        autoCapitalize={k === 'handle' ? 'none' : 'sentences'}
        autoCorrect={k === 'bio'}
        style={{ marginTop: 8, height: size.field, paddingHorizontal: 14, backgroundColor: c['surface-1'], color: c.text, fontSize: 15, fontFamily: 'InstrumentSans_400Regular' }}
      />
    </Row>
  );
}

function Section({ id, c, say, go }: { id: SectionId; c: C; say: (t: string) => void; go: (p: SettingsPage) => void }) {
  const { settings, set } = useSettings();
  const [del, setDel] = useState<'closed' | 'confirm' | 'done'>('closed');
  const [typed, setTyped] = useState('');
  const [push, askPush] = usePushPermission();
  const nav = useNav();
  const [asking, setAsking] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const toggle = <K extends keyof Settings>(k: K, title: string, sub?: string) => (
    <SwitchRow title={title} sub={sub} on={!!settings[k]} onChange={(v) => set(k, v as Settings[K])} c={c} />
  );
  const choose = <K extends keyof Settings>(k: K, title: string, options: readonly string[], sub?: string) => (
    <Row title={title} sub={sub} c={c}>
      <Choices value={String(settings[k])} options={options} onChange={(v) => set(k, v as Settings[K])} label={title} c={c} />
    </Row>
  );

  switch (id) {
    case 'profile':
      return (
        <>
          <Row title="Your picture" sub="Your colour, pixelated. No two are the same." c={c}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 10 }}>
              <ProfilePicture size={72} />
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Picture colour">
                {COLOURS.map(([name, hex]) => (
                  <Pressable
                    key={hex}
                    onPress={() => set('colour', hex)}
                    accessibilityRole="radio"
                    accessibilityLabel={name}
                    aria-checked={settings.colour === hex}
                    style={{ width: 30, height: 30, backgroundColor: hex, borderWidth: settings.colour === hex ? 3 : 0, borderColor: c.text }}
                  />
                ))}
              </View>
            </View>
          </Row>
          <Field k="name" label="Name" clean={(v) => v.slice(0, 30)} c={c} />
          <Field
            k="handle"
            label="Handle"
            sub={`Your page is see.app/${settings.handle.replace('@', '')}`}
            clean={(v) => {
              const t = v.replace(/[^@a-zA-Z0-9_.]/g, '').slice(0, 20);
              return t.startsWith('@') ? t : `@${t}`;
            }}
            c={c}
          />
          <Field k="bio" label="Bio" clean={(v) => v.slice(0, 60)} c={c} />
          {toggle('topcats', 'Show my top categories first', 'Your page opens on what you rank most.')}
        </>
      );

    case 'account': {
      const devices = DEVICES.filter((d) => !settings.devicesSignedOut.includes(d[0]));
      return (
        <>
          <Label c={c}>Signing in</Label>
          <Row title="Email" sub="Where your sign-in codes go" c={c} end={<Txt style={{ color: c['text-3'], fontSize: 12 }}>joey@example.com</Txt>} />
          <Row title="Ways to sign in" sub="Keep at least one. A code by email always works." c={c}>
            <View style={{ gap: 2, paddingTop: 6 }}>
              {Object.entries(settings.signIn).map(([name, on]) => (
                <View key={name} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
                  <Txt style={{ color: on ? c.text : c['text-3'], fontSize: 13.5, fontWeight: '600' }}>{name}</Txt>
                  <Switch
                    on={on}
                    label={`Sign in with ${name}`}
                    c={c}
                    onChange={() => {
                      const next = { ...settings.signIn, [name]: !on };
                      if (!Object.values(next).some(Boolean)) return say('Keep at least one way to sign in');
                      set('signIn', next);
                    }}
                  />
                </View>
              ))}
            </View>
          </Row>
          <Label c={c}>Signed in on</Label>
          {devices.map(([name, meta, current]) => (
            <Row
              key={name}
              title={name}
              sub={meta}
              c={c}
              end={
                current ? (
                  <Txt style={{ color: c['flare-text'], fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>This one</Txt>
                ) : (
                  <QuietButton label="Sign out" c={c} onPress={() => set('devicesSignedOut', [...settings.devicesSignedOut, name])} />
                )
              }
            />
          ))}
          <Label c={c}>Leaving</Label>
          <Row title="Sign out" sub="Your lists stay as they are." c={c} end={<QuietButton label="Sign out" c={c} onPress={nav.signOut} />} />
          {del === 'closed' && (
            <Pressable onPress={() => setDel('confirm')} accessibilityRole="button" style={{ paddingVertical: 16 }}>
              <Txt style={{ color: c['flare-soft'], fontWeight: '700', fontSize: 14 }}>Delete account</Txt>
            </Pressable>
          )}
          {del === 'confirm' && (
            <View style={{ gap: 10, paddingVertical: 14 }} accessibilityRole="alert">
              <Txt style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>Delete your account?</Txt>
              <Txt style={{ color: c['text-3'], fontSize: 12, lineHeight: 17 }}>
                Your lists, polls, votes and picture go. Lists you share stay with the people on them. Type {settings.handle} to confirm.
              </Txt>
              <TextInput
                value={typed}
                onChangeText={(v) => setTyped(v.slice(0, 24))}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={`Type ${settings.handle} to confirm`}
                style={{ height: size.field, paddingHorizontal: 14, backgroundColor: c['surface-1'], color: c.text, fontSize: 15, fontFamily: 'InstrumentSans_400Regular' }}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <QuietButton
                  label="Keep it"
                  c={c}
                  onPress={() => {
                    setDel('closed');
                    setTyped('');
                  }}
                />
                {typed === settings.handle && <QuietButton label="Delete for good" tone={c['flare-soft']} c={c} onPress={() => setDel('done')} />}
              </View>
            </View>
          )}
          {del === 'done' && (
            <Txt style={{ color: c['text-2'], fontSize: 13, lineHeight: 19, paddingVertical: 14 }}>
              Deletion scheduled. You have 14 days to change your mind: signing in again cancels it.
            </Txt>
          )}
        </>
      );
    }

    case 'services': {
      const last = settings.lastConn;
      return (
        <>
          {SERVICES.map((g) => (
            <View key={g.name}>
              <Label c={c}>{`${g.name} · ${g.feeds}`}</Label>
              {g.services.map((n) => {
                const on = !!settings.conn[n];
                return (
                  <SwitchRow
                    key={n}
                    title={n}
                    sub={on ? `Reads ${READS[n]}` : undefined}
                    on={on}
                    c={c}
                    onChange={() => {
                      if (!on) return setAsking(n);
                      set('conn', { ...settings.conn, [n]: false });
                      set('lastConn', n);
                    }}
                  />
                );
              })}
            </View>
          ))}
          {failed && !settings.conn[failed] && (
            <View style={{ backgroundColor: c['surface-2'], borderLeftWidth: 3, borderLeftColor: c['flare-soft'], padding: 14, gap: 10, marginTop: 14 }} accessibilityRole="alert">
              <Txt style={{ color: c.text, fontSize: 13, lineHeight: 19 }}>
                {failed} didn’t connect. The sign-in closed before it finished. Nothing was changed. Try again, or skip it for now.
              </Txt>
              <QuietButton label="Try again" c={c} onPress={() => setAsking(failed)} />
            </View>
          )}
          {asking && (
            <Sheet
              modal
              c={c}
              label={`Connect ${asking}`}
              onClose={() => {
                setFailed(asking);
                setAsking(null);
              }}
            >
              <Txt style={{ color: c.text, fontSize: 24, fontWeight: '900', textTransform: 'uppercase' }}>Connect {asking}?</Txt>
              <Txt style={{ color: c['text-2'], fontSize: 14, lineHeight: 21 }}>
                See will read {READS[asking]}, to suggest what to rank. It never posts for you, and you can disconnect it here any time.
              </Txt>
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                <QuietButton
                  label="Cancel"
                  c={c}
                  onPress={() => {
                    setFailed(asking);
                    setAsking(null);
                  }}
                />
                <QuietButton
                  label="Connect"
                  tone={c.flare}
                  c={c}
                  onPress={() => {
                    set('conn', { ...settings.conn, [asking]: true });
                    set('lastConn', asking);
                    setFailed(null);
                    setAsking(null);
                  }}
                />
              </View>
            </Sheet>
          )}
          <Txt style={{ color: last ? c['text-2'] : c['text-3'], fontSize: 12, lineHeight: 17, paddingTop: 14 }} accessibilityLiveRegion="polite">
            {last
              ? settings.conn[last]
                ? `${last} is connected: See reads ${READS[last]}.`
                : `${last} is disconnected. What it filled stays in your lists.`
              : 'Connect or disconnect any of them. See reads; it never posts for you.'}
          </Txt>
        </>
      );
    }

    case 'privacy':
      return (
        <>
          {choose('lists', 'Who sees your lists', ['Everyone', 'Your people', 'Only you'], 'You can still make one list public or private from its menu.')}
          {choose('profile', 'Your profile', ['Public', 'Hidden from search'])}
          {choose('canAdd', 'Who can add you to a list', ['Anyone', 'Your people', 'No one'])}
          {toggle('showVotes', 'Show how I voted in polls', 'Off: people see the result, never your vote.')}
          {toggle('compare', 'Let people compare their lists with mine')}
          <Label c={c}>Blocked</Label>
          {settings.blocked.length === 0 && <Txt style={{ color: c['text-3'], fontSize: 12 }}>No one. Block someone from the ··· on their page; they aren’t told.</Txt>}
          {settings.blocked.map((h) => (
            <Row
              key={h}
              title={`@${h}`}
              c={c}
              end={
                <QuietButton
                  label="Unblock"
                  c={c}
                  onPress={() => {
                    set('blocked', settings.blocked.filter((x) => x !== h));
                    say(`Unblocked @${h}`);
                  }}
                />
              }
            />
          ))}
        </>
      );

    case 'notif':
      return (
        <>
          {push === 'denied' && (
            <View style={{ backgroundColor: c['surface-2'], borderLeftWidth: 3, borderLeftColor: c['flare-soft'], padding: 14, gap: 10, marginTop: 6 }} accessibilityRole="alert">
              <Txt style={{ color: c.text, fontSize: 13, lineHeight: 19 }}>
                Notifications are off for See in your phone’s settings, so push can’t reach you. Email still can.
              </Txt>
              <QuietButton label="Open settings" c={c} onPress={() => Linking.openSettings().catch(() => {})} />
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 22, paddingRight: 4, paddingTop: 6 }} importantForAccessibility="no-hide-descendants">
            <Txt style={{ color: c['text-3'], fontSize: 10, fontWeight: '600', letterSpacing: 1.2 }}>PUSH</Txt>
            <Txt style={{ color: c['text-3'], fontSize: 10, fontWeight: '600', letterSpacing: 1.2 }}>EMAIL</Txt>
          </View>
          {NOTIFICATIONS.filter((n) => n.optional).map((n) => {
            const v = settings.notif[n.kind];
            const put = (ch: 'push' | 'email', on: boolean) => set('notif', { ...settings.notif, [n.kind]: { ...v, [ch]: on } });
            return (
              <Row
                key={n.kind}
                title={n.label}
                sub={n.sub}
                c={c}
                end={
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Switch
                      on={v.push && push !== 'denied'}
                      disabled={push === 'denied'}
                      label={push === 'denied' ? `${n.label} by push: can’t reach you, notifications are off for See on this phone` : `${n.label} by push`}
                      onChange={(on) => {
                        // the phone is asked the first time a push switch goes on, never before
                        if (on && push === 'ask') askPush();
                        put('push', on);
                      }}
                      c={c}
                    />
                    <Switch on={v.email} label={`${n.label} by email`} onChange={(on) => put('email', on)} c={c} />
                  </View>
                }
              />
            );
          })}
          <Label c={c}>Quiet hours</Label>
          {choose('quiet', 'Hold notifications', QUIET_HOURS, 'They wait and arrive together in the morning.')}
        </>
      );

    case 'lists':
      return (
        <>
          <Label c={c}>A new list starts as</Label>
          {choose('size', 'Size', ['5', '10', '20', '50'])}
          {choose('timeFrame', 'Time frame', ['All time', 'This year', 'This month'])}
          <Label c={c}>Making lists</Label>
          {toggle('smart', 'File new lists from their name', 'See reads the name for the category, kind and size.')}
          {toggle('repeat', 'Ask before a repeat list', 'If you already have one like it, it offers to open it.')}
        </>
      );

    case 'playback':
      return (
        <>
          <Row title="Play previews from" sub="The first one that has the item wins." c={c}>
            <View style={{ paddingTop: 6 }}>
              {settings.playOrder.map((n, i) => (
                <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
                  <Txt style={{ width: 16, color: c['text-3'], fontWeight: '800', fontSize: 13 }}>{i + 1}</Txt>
                  <Txt style={{ flex: 1, color: c.text, fontSize: 13.5, fontWeight: '600' }}>{n}</Txt>
                  {i > 0 && (
                    <QuietButton
                      label="Move up"
                      c={c}
                      onPress={() => {
                        const o = settings.playOrder.slice();
                        [o[i - 1], o[i]] = [o[i], o[i - 1]];
                        set('playOrder', o);
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          </Row>
          {toggle('autoplay', 'Play the next preview by itself')}
          {toggle('dataSaver', 'Data saver', 'Previews in low quality on mobile data.')}
          {choose('previewsIn', 'Previews open in', ['Corner player', 'Full screen'])}
        </>
      );

    case 'display':
      return (
        <>
          {choose('appearance', 'Appearance', ['Dark', 'Light', 'Match device'], 'Dark by default. Every colour works both ways.')}
          {toggle('reduceMotion', 'Reduce motion', 'The launch, the player and the sheets switch without moving.')}
          {toggle('field', 'The field behind the page', 'The moving + signs at the top. Off: plain ink.')}
          {choose('text', 'Text size', ['Default', 'Larger', 'Largest'], 'This page shows it as you choose.')}
        </>
      );

    case 'ads':
      return (
        <>
          <View style={{ borderLeftWidth: 3, borderLeftColor: c.flare, backgroundColor: c['surface-1'], padding: 14, marginVertical: 6 }}>
            <Txt style={{ color: c['text-2'], fontSize: 13, lineHeight: 19 }}>
              One See for everyone. There is no ad-free plan: ads pay so every chart, poll and list size stays free and equal.
            </Txt>
          </View>
          <Row title="Why am I seeing an ad" sub="Tap AD on any ad: it says who paid and why it reached you." c={c} />
          <Label c={c}>Topics · turn one off to see less of it</Label>
          {Object.entries(settings.adTopics).map(([n, on]) => (
            <SwitchRow key={n} title={n} on={on} onChange={() => set('adTopics', { ...settings.adTopics, [n]: !on })} c={c} />
          ))}
          {toggle('rankAds', 'Use what I rank to choose my ads', 'Off: ads follow the page you are on, not you.')}
        </>
      );

    case 'help':
      return (
        <>
          <LinkRow title="Help" sub="Answers, and how to reach us" onPress={() => say('Help opens in the full app soon')} c={c} />
          <LinkRow title="Report a problem" sub="With a screenshot if you like" onPress={() => say('Reporting opens in the full app soon')} c={c} />
          <LinkRow title="Terms" onPress={() => go('terms')} c={c} />
          <LinkRow title="Privacy policy" onPress={() => go('privacy')} c={c} />
          <Row title="Licences" c={c} end={<Txt style={{ color: c['text-3'], fontSize: 12 }}>Open source</Txt>} />
          <View style={{ borderLeftWidth: 3, borderLeftColor: c.rule, backgroundColor: c['surface-1'], padding: 14, marginTop: 16 }}>
            <Txt style={{ color: c['text-2'], fontSize: 13 }}>{VERSION}. Made in Lagos and Abuja.</Txt>
          </View>
        </>
      );
  }
}

/** Terms and Privacy, the same words as the web (@see/core legal). */
export function Legal({ doc, c, onBack, back = 'Help and legal' }: { doc: 'terms' | 'privacy'; c: C; onBack: () => void; back?: string }) {
  const d = doc === 'terms' ? TERMS : PRIVACY;
  return (
    <ScrollView contentContainerStyle={{ padding: size['gutter-phone'], paddingTop: 4, paddingBottom: 60, gap: 10 }}>
      <Head title={d.title} back={back} onBack={onBack} c={c} />
      <Txt style={{ color: c['text-3'], fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>Updated {d.updated}</Txt>
      <Txt style={{ color: c.text, fontSize: 17, lineHeight: 25 }}>{d.intro}</Txt>
      {d.sections.map((s) => (
        <View key={s.id} style={{ gap: 8, paddingTop: 14 }}>
          <Txt style={{ color: c.text, fontSize: 17, fontWeight: '800', textTransform: 'uppercase' }} accessibilityRole="header">
            {s.h}
          </Txt>
          {s.p.map((p, i) => (
            <Txt key={i} style={{ color: c['text-2'], fontSize: 14.5, lineHeight: 23 }}>
              {p}
            </Txt>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
