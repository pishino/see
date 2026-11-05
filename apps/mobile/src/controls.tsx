/*
 * Settings' controls on the phone (V3Handoff component states): the slanted switch (44 × 24, slope 0.25, the thumb
 * keeps a 4 px gap), choice chips (the one you set shows the flare edge), and the rows they sit in.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from './marks';
import type { C } from './theme';
import { Txt } from './type';

export function Switch({ on, onChange, label, c, disabled = false }: { on: boolean; onChange: (v: boolean) => void; label: string; c: C; disabled?: boolean }) {
  return (
    <Pressable
      onPress={() => onChange(!on)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      aria-checked={on} aria-disabled={disabled}
      hitSlop={10}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <View style={[s.track, { backgroundColor: on ? c.flare : c['surface-2'] }]}>
        <View style={[s.thumb, { backgroundColor: on ? c['on-flare'] : c['text-3'], transform: [{ translateX: on ? 22 : 0 }] }]} />
      </View>
    </Pressable>
  );
}

export function Choices<T extends string>({ value, options, onChange, label, c }: { value: T; options: readonly T[]; onChange: (v: T) => void; label: string; c: C }) {
  return (
    <View style={s.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            accessibilityRole="radio"
            aria-checked={on}
            style={[s.chip, on ? { backgroundColor: c.chip, borderLeftWidth: 3, borderLeftColor: c.flare } : { borderWidth: 1, borderColor: c.rule }]}
          >
            <Txt style={{ fontSize: 12.5, fontWeight: '600', color: on ? c.text : c['text-3'] }}>{o}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Label({ children, c }: { children: ReactNode; c: C }) {
  return <Txt style={[s.label, { color: c['text-3'] }]}>{children}</Txt>;
}

/** A setting: its name, a line on what it does, and its control at the end (or under it, for choices). */
export function Row({ title, sub, c, end, children }: { title: string; sub?: string; c: C; end?: ReactNode; children?: ReactNode }) {
  return (
    <View style={[s.row, { borderBottomColor: c['surface-1'] }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Txt style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{title}</Txt>
          {!!sub && <Txt style={{ color: c['text-3'], fontSize: 12, lineHeight: 17 }}>{sub}</Txt>}
        </View>
        {end}
      </View>
      {children}
    </View>
  );
}

export function SwitchRow({ title, sub, on, onChange, c }: { title: string; sub?: string; on: boolean; onChange: (v: boolean) => void; c: C }) {
  return <Row title={title} sub={sub} c={c} end={<Switch on={on} onChange={onChange} label={title} c={c} />} />;
}

export function LinkRow({ title, sub, value, onPress, c }: { title: string; sub?: string; value?: string; onPress: () => void; c: C }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Row
        title={title}
        sub={sub}
        c={c}
        end={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!!value && <Txt style={{ color: c['text-3'], fontSize: 12 }}>{value}</Txt>}
            <Icon name="chev" size={14} color={c['text-3']} />
          </View>
        }
      />
    </Pressable>
  );
}

export function QuietButton({ label, onPress, c, tone }: { label: string; onPress: () => void; c: C; tone?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[s.btn, { backgroundColor: c['surface-2'] }]}>
      <View style={{ transform: [{ skewX: '12deg' }] }}>
        <Txt style={{ fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, color: tone ?? c.text }}>{label}</Txt>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  track: { width: 44, height: 24, padding: 4, justifyContent: 'center', transform: [{ skewX: '-14deg' }] },
  thumb: { width: 14, height: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 10 },
  chip: { minHeight: 34, paddingHorizontal: 12, justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', paddingTop: 22, paddingBottom: 6 },
  row: { minHeight: 56, paddingVertical: 12, borderBottomWidth: 1, justifyContent: 'center' },
  btn: { alignSelf: 'flex-start', height: 36, paddingHorizontal: 16, justifyContent: 'center', transform: [{ skewX: '-12deg' }] },
});
