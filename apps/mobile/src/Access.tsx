/*
 * Why you can't open something, and the one way in (V3ProblemStates A2–A4), on the phone: a deleted list, a private
 * list, and invites (see://join/…). The words are @see/core's, the same as the web's.
 */
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ACCESS_SAYS, INVITES, accessOf, joinInvite, pad2, titleOf } from '@see/core';
import { useStore } from '@see/core/react';
import { size } from '@see/tokens';
import { QuietButton } from './controls';
import { useNav } from './nav';
import { Button } from './Screens';
import type { C } from './theme';
import { Txt } from './type';

function Frame({ c, kicker, title, children }: { c: C; kicker?: string; title: string; children: React.ReactNode }) {
  const nav = useNav();
  return (
    <ScrollView contentContainerStyle={{ padding: size['gutter-phone'], paddingTop: 4, gap: 14 }}>
      <QuietButton label="Back" onPress={nav.pop} c={c} />
      {!!kicker && <Txt style={{ color: c['text-3'], fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>{kicker}</Txt>}
      <Txt style={{ color: c.text, fontSize: 32, fontWeight: '900', textTransform: 'uppercase', lineHeight: 34 }}>{title}</Txt>
      {children}
    </ScrollView>
  );
}

export function NoList({ id, c }: { id: string; c: C }) {
  const nav = useNav();
  const [asked, setAsked] = useState(false);
  const a = accessOf(id);
  const line = (t: string) => <Txt style={{ color: c['text-2'], fontSize: 14, lineHeight: 21 }}>{t}</Txt>;
  if (a?.k === 'gone') {
    return (
      <Frame c={c} title="This list is gone">
        {line(ACCESS_SAYS.gone(a.list))}
        <Button label="Back to your charts" c={c} onPress={() => nav.tab('charts')} />
        <Txt style={{ color: c['text-3'], fontSize: 12 }}>
          Link: see.app/{a.list.by}/{a.id}
        </Txt>
      </Frame>
    );
  }
  if (a?.k === 'private') {
    return (
      <Frame c={c} title="This list is private">
        {line(ACCESS_SAYS.private(a.list))}
        {asked ? (
          line(`Asked. @${a.list.owner} will see your request; nothing else about the list is shown until they say yes.`)
        ) : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              label="Ask to join"
              c={c}
              onPress={() => {
                setAsked(true);
                nav.say(`Request sent to @${a.list.owner}`);
              }}
            />
            <QuietButton label="Not now" onPress={nav.pop} c={c} />
          </View>
        )}
      </Frame>
    );
  }
  return (
    <Frame c={c} title="This list isn’t here">
      {line('It may have been deleted, or the link is wrong. Your lists are fine.')}
      <Button label="Back to Charts" c={c} onPress={() => nav.tab('charts')} />
    </Frame>
  );
}

export function JoinScreen({ code, c }: { code: string; c: C }) {
  const store = useStore();
  const nav = useNav();
  const [asked, setAsked] = useState(false);
  const inv = INVITES[code];
  const line = (t: string) => <Txt style={{ color: c['text-2'], fontSize: 14, lineHeight: 21 }}>{t}</Txt>;
  if (!inv) {
    return (
      <Frame c={c} title="This invite isn’t here">
        {line('The link may be cut short. Ask whoever sent it for a new one.')}
      </Frame>
    );
  }
  if (inv.expired) {
    return (
      <Frame c={c} title="This invite expired">
        {line(ACCESS_SAYS.expired(inv))}
        {asked ? (
          line(`Asked. When @${inv.from} sends a new one, it opens here.`)
        ) : (
          <Button
            label={`Ask @${inv.from} again`}
            c={c}
            onPress={() => {
              setAsked(true);
              nav.say(`Asked @${inv.from} for a new invite`);
            }}
          />
        )}
      </Frame>
    );
  }
  return (
    <Frame c={c} kicker={`Invite · ${inv.sent}`} title={inv.list.name}>
      {line(ACCESS_SAYS.invite(inv))}
      {inv.list.items.slice(0, 3).map((x, i) => (
        <View key={x} style={{ flexDirection: 'row', gap: 12 }}>
          <Txt style={{ color: i === 0 ? c.flare : c['text-3'], fontWeight: '800', fontSize: 14 }}>{pad2(i + 1)}</Txt>
          <Txt style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>{titleOf(x)}</Txt>
        </View>
      ))}
      <Button
        label="+ Join this list"
        c={c}
        onPress={() => {
          const r = joinInvite(inv, store.lists);
          if (r.fresh) store.dispatch({ type: 'addList', list: r.list });
          nav.say(r.fresh ? `You’re on ${inv.list.name} with @${inv.from}` : `You’re already on ${inv.list.name}`);
          nav.pop();
          nav.push({ k: 'list', id: r.list.id });
        }}
      />
    </Frame>
  );
}
