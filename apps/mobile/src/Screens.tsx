/*
 * The rest of the phone's pages: Create (a sheet), a category, Activity, and a person's page with report and block.
 * Words and rules come from @see/core, so they say what the web says.
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import {
  BLOCK_SAYS,
  REPORT_REASONS,
  SEED_ACTIVITY,
  SIZE_STOPS,
  filledCount,
  listSummary,
  newReport,
  personOf,
  sharedLists,
  suggestCategory,
  type ActivityItem,
  type ReportReason,
} from '@see/core';
import { useSettings, useStore } from '@see/core/react';
import { size } from '@see/tokens';
import { Choices, Label, QuietButton, Row, SwitchRow } from './controls';
import { CategoryTag, Icon, PlusBox, type IconName } from './marks';
import { useNav } from './nav';
import { Sheet } from './Sheet';
import type { C } from './theme';
import { Txt } from './type';

const hero = { fontWeight: '900' as const, textTransform: 'uppercase' as const, lineHeight: 34 };

function Back({ c, label = 'Back' }: { c: C; label?: string }) {
  const nav = useNav();
  return (
    <Pressable onPress={nav.pop} accessibilityRole="button" accessibilityLabel={label} style={{ width: 44, height: 44, justifyContent: 'center' }}>
      <Icon name="back" size={22} color={c.text} />
    </Pressable>
  );
}

export function Button({ label, onPress, c, violet = false, disabled = false }: { label: string; onPress: () => void; c: C; violet?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      aria-disabled={disabled}
      style={{ alignSelf: 'flex-start', height: 44, paddingHorizontal: 20, justifyContent: 'center', backgroundColor: violet ? c.violet : c.flare, opacity: disabled ? 0.4 : 1, transform: [{ skewX: '-12deg' }] }}
    >
      <View style={{ transform: [{ skewX: '12deg' }] }}>
        <Txt style={{ color: violet ? c['on-violet'] : c['on-flare'], fontWeight: '800', fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Txt>
      </View>
    </Pressable>
  );
}

/** Create: name it, and See files it (V3Main: lists are named first; See suggests the category). */
export function CreateSheet({ c, initialName = '', initialCat, onClose }: { c: C; initialName?: string; initialCat?: string; onClose: () => void }) {
  const store = useStore();
  const { settings } = useSettings();
  const nav = useNav();
  const [name, setName] = useState(initialName);
  const [pick, setPick] = useState<string | null>(initialCat ?? null);
  const [n, setN] = useState(Number(settings.size) || 10);
  const cats = store.categories.map((x) => x.id);
  const suggested = useMemo(() => (settings.smart ? suggestCategory(name, cats) : null), [name, cats, settings.smart]);
  const chosen = pick ?? suggested ?? null;
  const options = chosen && !cats.includes(chosen) ? [...cats, chosen] : cats;
  const ready = name.trim().length > 0 && !!chosen;
  const create = () => {
    if (!ready || !chosen) return;
    if (!cats.includes(chosen)) store.addCategory(chosen);
    const L = store.addList(chosen, name.trim(), n);
    onClose();
    nav.say(`${L.name} is saved`);
    nav.push({ k: 'list', id: L.id });
  };
  return (
    <Sheet c={c} onClose={onClose} label="New list">
      <Txt style={{ color: c['text-3'], fontSize: 11, fontWeight: '600', letterSpacing: 1.2 }}>NEW LIST</Txt>
      <TextInput
        value={name}
        onChangeText={(v) => setName(v.slice(0, 48))}
        placeholder="Name it: Songs of the year, Films I love…"
        placeholderTextColor={c['text-3']}
        autoFocus
        onSubmitEditing={create}
        accessibilityLabel="List name"
        style={{ height: size['field-auth'], paddingHorizontal: 14, backgroundColor: c.bg, color: c.text, fontSize: 17, fontFamily: 'Archivo_800ExtraBold' }}
      />
      <Txt style={{ color: c['text-3'], fontSize: 12 }}>{suggested && !pick ? `See files it under ${suggested}. Pick another if it’s wrong.` : 'Where it goes'}</Txt>
      <Choices value={chosen ?? ''} options={options} onChange={setPick} label="Category" c={c} />
      <Choices value={`Top ${n}`} options={SIZE_STOPS.map((x) => `Top ${x}`)} onChange={(v) => setN(Number(v.slice(4)))} label="Size" c={c} />
      <View style={{ paddingTop: 6 }}>
        <Button label="Make the list" onPress={create} c={c} disabled={!ready} />
      </View>
    </Sheet>
  );
}

/** A category: its lists, and a New list already filed under it. Empty, it says how it gets filled. */
export function CategoryScreen({ id, c }: { id: string; c: C }) {
  const store = useStore();
  const nav = useNav();
  const cat = store.categories.find((x) => x.id === id);
  const lists = store.listsIn(id);
  return (
    <ScrollView contentContainerStyle={{ padding: size['gutter-phone'], paddingTop: 4, paddingBottom: 60, gap: 12 }}>
      <Back c={c} />
      <CategoryTag name={cat?.name ?? id} height={30} color={c.flare} />
      <Txt style={{ color: c['text-3'], fontSize: 12 }}>
        {lists.length} {lists.length === 1 ? 'list' : 'lists'}
      </Txt>
      {lists.length === 0 && (
        <View style={{ gap: 12, paddingVertical: 10 }}>
          <Txt style={{ color: c['text-2'], fontSize: 14, lineHeight: 21 }}>{cat?.name ?? id} is ready. Make its first list: name it, pick a size, choose its time frame.</Txt>
          <Button label="New list" c={c} onPress={() => nav.create('', id)} />
        </View>
      )}
      {lists.map((L) => (
        <Pressable key={L.id} onPress={() => nav.push({ k: 'list', id: L.id })} style={{ backgroundColor: c['surface-1'], padding: 16, gap: 6, borderLeftWidth: 3, borderLeftColor: L.poll ? c.violet : c.flare }}>
          <Txt style={{ color: c.text, fontSize: 20, ...hero, lineHeight: 22 }}>{L.name}</Txt>
          <Txt style={{ color: c['text-3'], fontSize: 12 }}>
            {listSummary(L)} · {filledCount(L)}/{L.n}
          </Txt>
        </Pressable>
      ))}
      {lists.length > 0 && (
        <Pressable onPress={() => nav.create('', id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 }} accessibilityRole="button">
          <PlusBox height={20} color={c.flare} />
          <Txt style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>New list in {(cat?.name ?? id).toLowerCase()}</Txt>
        </Pressable>
      )}
    </ScrollView>
  );
}

/** Where a see:// link goes on the phone. */
export function useFollowLink() {
  const nav = useNav();
  return (link: string) => {
    const p = link.replace(/^see:\/\//, '');
    if (p.startsWith('list/')) nav.push({ k: 'list', id: p.slice(5).split('/')[0] });
    else if (p.startsWith('u/')) nav.push({ k: 'person', h: p.slice(2).split('/')[0] });
    else if (p.startsWith('poll/')) nav.tab('polls');
    else if (p.startsWith('you/activity')) nav.push({ k: 'activity' });
    else if (p.startsWith('you')) nav.tab('you');
    else if (p.startsWith('entry/')) nav.tab('find');
    else nav.tab('charts');
  };
}

/** Activity: what happened, newest first, grouped; each one opens where it happened. */
export function ActivityScreen({ c, items = SEED_ACTIVITY }: { c: C; items?: ActivityItem[] }) {
  const follow = useFollowLink();
  const groups = ['Today', 'This week', 'Earlier'] as const;
  const ICON: Record<ActivityItem['icon'], IconName> = { poll: 'poll', person: 'person', eq: 'eq' };
  return (
    <ScrollView contentContainerStyle={{ padding: size['gutter-phone'], paddingTop: 4, paddingBottom: 60 }}>
      <Back c={c} label="Back to You" />
      <Txt style={{ color: c['text-3'], fontSize: 11, fontWeight: '600', letterSpacing: 1.2 }}>YOU</Txt>
      <Txt style={{ color: c.text, fontSize: 30, ...hero }}>Activity</Txt>
      {groups.map((g) => {
        const these = items.filter((a) => a.group === g);
        if (!these.length) return null;
        return (
          <View key={g}>
            <Label c={c}>{g}</Label>
            {these.map((a) => (
              <View key={a.id} style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c['surface-1'] }}>
                <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: a.icon === 'poll' ? c.violet : c['surface-2'] }}>
                  <Icon name={ICON[a.icon]} size={16} color={a.icon === 'poll' ? c['on-violet'] : c.text} />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Txt style={{ color: c.text, fontSize: 13.5, lineHeight: 19, fontWeight: a.unread ? '600' : '400' }}>{a.text}</Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Txt style={{ color: c['text-3'], fontSize: 12 }}>{a.when}</Txt>
                    <Pressable onPress={() => follow(a.link)} accessibilityRole="link" hitSlop={8}>
                      <Txt style={{ color: a.icon === 'poll' ? c['violet-text'] : c['flare-text'], fontSize: 12.5, fontWeight: '600' }}>{a.action}</Txt>
                    </Pressable>
                  </View>
                </View>
                {a.unread && <View style={{ width: 8, height: 8, backgroundColor: c.flare, marginTop: 6 }} accessibilityLabel="New" />}
              </View>
            ))}
          </View>
        );
      })}
      <Txt style={{ color: c['text-3'], fontSize: 11.5, paddingTop: 16 }}>Older than 30 days drops off.</Txt>
    </ScrollView>
  );
}

/** Report: six reasons, one tap. Hide it from me is on by default; Also block is one switch away. */
function ReportSheet({ h, c, onClose, onBlock }: { h: string; c: C; onClose: () => void; onBlock: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [hide, setHide] = useState(true);
  const [block, setBlock] = useState(false);
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <Sheet c={c} onClose={onClose} label="Report sent">
        <Txt style={{ color: c.text, fontSize: 26, ...hero }}>Report sent</Txt>
        <Txt style={{ color: c['text-2'], fontSize: 14, lineHeight: 21 }}>{BLOCK_SAYS.sent(h)}</Txt>
        <Button label="Done" onPress={onClose} c={c} />
      </Sheet>
    );
  }
  return (
    <Sheet c={c} onClose={onClose} label={`Report @${h}`}>
      <Txt style={{ color: c['text-3'], fontSize: 11, fontWeight: '600', letterSpacing: 1.2 }}>REPORT @{h.toUpperCase()}</Txt>
      <Txt style={{ color: c.text, fontSize: 26, ...hero }}>What’s wrong?</Txt>
      <View accessibilityRole="radiogroup">
        {REPORT_REASONS.map((r) => (
          <Pressable key={r} onPress={() => setReason(r)} accessibilityRole="radio" aria-checked={reason === r} style={{ minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: c['surface-2'] }}>
            <View style={{ width: 12, height: 12, borderWidth: 2, borderColor: reason === r ? c.flare : c['text-off'], backgroundColor: reason === r ? c.flare : 'transparent' }} />
            <Txt style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{r}</Txt>
          </Pressable>
        ))}
      </View>
      {reason === 'Something else' && (
        <TextInput value={note} onChangeText={setNote} placeholder="A line to explain" placeholderTextColor={c['text-3']} style={{ height: 44, paddingHorizontal: 12, backgroundColor: c.bg, color: c.text, fontFamily: 'InstrumentSans_400Regular' }} />
      )}
      <SwitchRow title="Hide it from me while you look" on={hide} onChange={setHide} c={c} />
      <SwitchRow title={`Also block @${h}`} on={block} onChange={setBlock} c={c} />
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
        <QuietButton label="Cancel" onPress={onClose} c={c} />
        <Button
          label="Send report"
          c={c}
          disabled={!reason}
          onPress={() => {
            // a server takes the report; nothing is sent until here, and they are never told who reported
            newReport({ kind: 'person', handle: h }, reason!, { note, hide, block });
            if (block) onBlock();
            setSent(true);
          }}
        />
      </View>
    </Sheet>
  );
}

/** Every name is a page: their lists by category, the lists you share, Follow, and ···. */
export function PersonScreen({ h: raw, c }: { h: string; c: C }) {
  const store = useStore();
  const nav = useNav();
  const { settings, set } = useSettings();
  const [open, setOpen] = useState<'menu' | 'report' | 'block' | null>(null);
  const person = personOf(raw);
  if (!person) {
    return (
      <View style={{ padding: size['gutter-phone'], gap: 12 }}>
        <Back c={c} />
        <Txt style={{ color: c.text, fontSize: 16 }}>Nobody on See goes by @{raw}.</Txt>
      </View>
    );
  }
  const h = person.handle;
  const blocked = settings.blocked.includes(h);
  const following = settings.following.includes(h);
  const shared = sharedLists(h, store.lists);
  const doBlock = () => {
    set('blocked', [...settings.blocked.filter((x) => x !== h), h]);
    set('following', settings.following.filter((x) => x !== h));
    store.dispatch({ type: 'removePerson', handle: h });
    setOpen(null);
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: size['gutter-phone'], paddingTop: 4, paddingBottom: 60, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Back c={c} />
          {!blocked && (
            <Pressable onPress={() => setOpen('menu')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`More for @${h}`}>
              <Icon name="dots" size={20} color={c['text-2']} />
            </Pressable>
          )}
        </View>
        <Txt style={{ color: c.text, fontSize: 30, ...hero }}>{blocked ? `@${h}` : person.name}</Txt>
        <Txt style={{ color: c['text-3'], fontSize: 12 }}>{blocked ? 'Blocked' : `@${h} · Member`}</Txt>
        {blocked ? (
          <View style={{ gap: 12, paddingTop: 8 }}>
            <Txt style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{BLOCK_SAYS.done(h)}</Txt>
            <Txt style={{ color: c['text-2'], fontSize: 14 }}>They can’t find you or see your lists.</Txt>
            <QuietButton
              label="Unblock"
              c={c}
              onPress={() => {
                set('blocked', settings.blocked.filter((x) => x !== h));
                nav.say(`Unblocked @${h}`);
              }}
            />
          </View>
        ) : (
          <>
            <Button
              label={following ? '✓ Following' : '+ Follow'}
              c={c}
              onPress={() => set('following', following ? settings.following.filter((x) => x !== h) : [...settings.following, h])}
            />
            <Txt style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>
              {person.lists.reduce((n, [, ls]) => n + ls.length, 0)} lists · {shared.length} with you · {person.polls} polls
            </Txt>
            {person.lists.map(([cat, names]) => (
              <View key={cat} style={{ gap: 8 }}>
                <CategoryTag name={cat} height={14} color={c.flare} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {names.map((n) => (
                    <View key={n} style={{ minHeight: 34, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: c['surface-1'] }}>
                      <Txt style={{ color: c.text, fontSize: 12.5, fontWeight: '600' }}>{n}</Txt>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {shared.length > 0 && (
              <View style={{ gap: 8 }}>
                <Label c={c}>Lists you share</Label>
                {shared.map((L) => (
                  <Row key={L.id} title={L.name} c={c} end={<Icon name="chev" size={14} color={c['text-3']} />}>
                    <Pressable style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} onPress={() => nav.push({ k: 'list', id: L.id })} accessibilityLabel={`Open ${L.name}`} />
                  </Row>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
      {open === 'menu' && (
        <Sheet c={c} onClose={() => setOpen(null)} label={`More for @${h}`}>
          {(
            [
              ['Share their page', () => Share.share({ message: `@${h} on See: see://u/${h}` }).catch(() => {})],
              ['Compare lists', () => nav.say(shared.length ? `You share ${shared.length} ${shared.length === 1 ? 'list' : 'lists'} with @${h}` : 'Nothing in common yet')],
              [`Report @${h}`, () => setOpen('report')],
              [`Block @${h}`, () => setOpen('block')],
            ] as [string, () => void][]
          ).map(([t, f], i) => (
            <Pressable
              key={t}
              onPress={() => {
                if (i < 2) setOpen(null);
                f();
              }}
              style={{ minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: c['surface-2'] }}
              accessibilityRole="menuitem"
            >
              <Txt style={{ color: i === 3 ? c['flare-soft'] : c.text, fontSize: 15, fontWeight: '600' }}>{t}</Txt>
            </Pressable>
          ))}
        </Sheet>
      )}
      {open === 'report' && <ReportSheet h={h} c={c} onClose={() => setOpen(null)} onBlock={doBlock} />}
      {open === 'block' && (
        <Sheet c={c} onClose={() => setOpen(null)} label={`Block @${h}?`}>
          <Txt style={{ color: c.text, fontSize: 26, ...hero }}>Block @{h}?</Txt>
          <Txt style={{ color: c['text-2'], fontSize: 14, lineHeight: 21 }}>{BLOCK_SAYS.confirm(h)}</Txt>
          <Txt style={{ color: c['text-3'], fontSize: 12, lineHeight: 18 }}>
            They can’t: {BLOCK_SAYS.cant} {BLOCK_SAYS.lists}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <Button label="Cancel" onPress={() => setOpen(null)} c={c} />
            <QuietButton label="Block" tone={c['flare-soft']} onPress={doBlock} c={c} />
          </View>
        </Sheet>
      )}
    </View>
  );
}
