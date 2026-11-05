/*
 * Sign up and log in on the phone (V3AuthPhone): four steps on the flare flood (what you rank, the code, what you
 * use, your first list), under RANK [word], where the word is what you just picked. Log in is the email and the code.
 * Until there is a server, the code is any six digits.
 */
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, type TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BY_ID, search, slotsOf } from '@see/core';
import { useSettings, useStore } from '@see/core/react';
import { colors } from '@see/tokens';
import { Icon, PlusBox } from './marks';
import { Legal } from './Settings';
import { Txt } from './type';

const CATS = ['MUSIC', 'FILMS', 'SHOWS', 'BOOKS', 'PODCASTS', 'GAMES', 'TEAMS'];
const LINKS = ['Spotify', 'YouTube', 'Netflix', 'Letterboxd', 'Apple Music', 'Goodreads'];
const INK = '#0B0F0E';
const FLARE = '#FF4A1C';
const dark = colors('dark');

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" aria-pressed={on} style={{ minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: on ? INK : 'rgba(11,15,14,0.12)', transform: [{ skewX: '-10deg' }] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, transform: [{ skewX: '10deg' }] }}>
        {on && <Icon name="check" size={12} color={FLARE} />}
        <Txt style={{ color: on ? FLARE : INK, fontWeight: '800', fontSize: 13, letterSpacing: 0.4 }}>{label}</Txt>
      </View>
    </Pressable>
  );
}

function Go({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ alignSelf: 'stretch', height: 56, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' }}>
      <Txt style={{ color: FLARE, fontWeight: '800', fontSize: 15, letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</Txt>
    </Pressable>
  );
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor="rgba(11,15,14,0.5)" {...props} style={[{ height: 56, paddingHorizontal: 16, backgroundColor: 'rgba(11,15,14,0.12)', color: INK, fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' }, props.style]} />;
}

export function Auth({ onIn, initialMode = 'up' }: { onIn: () => void; initialMode?: 'up' | 'in' }) {
  const store = useStore();
  const { settings, set } = useSettings();
  const [mode, setMode] = useState<'up' | 'in'>(initialMode);
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [linked, setLinked] = useState<string[]>([]);
  const [n, setN] = useState(10);
  const [first, setFirst] = useState('');
  const [firstId, setFirstId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);
  const codeRef = useRef<TextInputInstance>(null);
  const word = picked[picked.length - 1] ?? (step === 1 ? '+' : 'MUSIC');
  const sugs = useMemo(() => search(first).slice(0, 3), [first]);
  const flash = (t: string) => {
    setNote(t);
    setTimeout(() => setNote((x) => (x === t ? '' : x)), 2400);
  };

  if (legal) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: dark.bg }}>
        <Legal doc={legal} c={dark} onBack={() => setLegal(null)} back="Sign up" />
      </SafeAreaView>
    );
  }

  const sendCode = () => {
    if (!/.+@.+\..+/.test(email)) return flash('Type your email');
    flash('Code sent');
    setStep(2);
    setTimeout(() => codeRef.current?.focus(), 200);
  };
  const onCode = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 6);
    setCode(d);
    if (d.length === 6) {
      flash('Verified');
      setTimeout(() => (mode === 'in' ? onIn() : setStep(3)), 500);
    }
  };
  const finish = () => {
    // your first list, as you made it here
    const name = (picked[0] ?? 'MUSIC').replace('FILMS', 'MOVIES').replace('SHOWS', 'TV');
    const cat = store.categories.find((x) => x.id === name)?.id ?? store.addCategory(name).id;
    const L = store.addList(cat, `Top ${n} ${(picked[0] ?? 'music').toLowerCase()}`, n);
    if (firstId) store.replaceList({ ...L, items: [firstId, ...slotsOf(L).slice(1)] });
    set('conn', { ...settings.conn, ...Object.fromEntries(linked.map((x) => [x, true])) });
    onIn();
  };
  const back = () => (step > 1 ? setStep(step === 2 ? 1 : step - 1) : mode === 'in' ? setMode('up') : null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: FLARE }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
          {step > 1 || mode === 'in' ? (
            <Pressable onPress={back} accessibilityLabel="Back" style={{ width: 44, height: 44, justifyContent: 'center' }}>
              <Icon name="back" size={22} color={INK} />
            </Pressable>
          ) : (
            <View />
          )}
          {mode === 'up' && (
            <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Step ${step} of 4`}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ width: i === step ? 22 : 8, height: 6, backgroundColor: i <= step ? INK : 'rgba(11,15,14,0.25)' }} />
              ))}
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }} accessibilityLabel={`Rank ${word}`}>
          <Txt style={{ color: INK, fontSize: 52, fontWeight: '900', lineHeight: 54 }}>RANK</Txt>
          {word === '+' ? (
            <PlusBox height={48} color={INK} />
          ) : (
            <View style={{ backgroundColor: INK, paddingHorizontal: 12, height: 50, justifyContent: 'center', transform: [{ skewX: '-9deg' }] }}>
              <Txt numberOfLines={1} style={{ color: FLARE, fontSize: 30, fontWeight: '900', transform: [{ skewX: '9deg' }] }}>
                {word}
              </Txt>
            </View>
          )}
        </View>

        {mode === 'in' && step === 1 && (
          <>
            <Txt style={{ color: INK, fontSize: 28, fontWeight: '900', textTransform: 'uppercase' }}>Log in</Txt>
            <Field value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" accessibilityLabel="Email" onSubmitEditing={sendCode} />
            <Go label="Send me a code" onPress={sendCode} />
            <Go label="Continue with Google" onPress={onIn} />
            <Pressable onPress={() => setMode('up')} style={{ paddingVertical: 10 }}>
              <Txt style={{ color: INK, fontWeight: '700', textDecorationLine: 'underline' }}>New to See? Sign up</Txt>
            </Pressable>
          </>
        )}

        {mode === 'up' && step === 1 && (
          <>
            <Txt style={{ color: INK, fontSize: 28, fontWeight: '900', textTransform: 'uppercase' }}>What do you rank?</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATS.map((x) => (
                <Chip key={x} label={x} on={picked.includes(x)} onPress={() => setPicked((p) => (p.includes(x) ? p.filter((y) => y !== x) : [...p, x]))} />
              ))}
            </View>
            <Field value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" accessibilityLabel="Email" onSubmitEditing={sendCode} />
            <Go label="Continue" onPress={sendCode} />
            <Go label="Continue with Google" onPress={() => setStep(3)} />
            <Go label="Continue with Apple" onPress={() => setStep(3)} />
            <Pressable onPress={() => setMode('in')} style={{ paddingVertical: 6 }}>
              <Txt style={{ color: INK, fontWeight: '700', textDecorationLine: 'underline' }}>I have an account · Log in</Txt>
            </Pressable>
            <Txt style={{ color: '#2a100a', fontSize: 12 }}>
              By continuing you accept the{' '}
              <Txt onPress={() => setLegal('terms')} style={{ color: '#2a100a', fontSize: 12, textDecorationLine: 'underline' }}>
                Terms
              </Txt>{' '}
              and the{' '}
              <Txt onPress={() => setLegal('privacy')} style={{ color: '#2a100a', fontSize: 12, textDecorationLine: 'underline' }}>
                Privacy notice
              </Txt>
              .
            </Txt>
          </>
        )}

        {step === 2 && (
          <>
            <Txt style={{ color: INK, fontSize: 28, fontWeight: '900', textTransform: 'uppercase' }}>Enter the code</Txt>
            <Txt style={{ color: INK, fontSize: 14 }}>Sent to {email || 'your email'}</Txt>
            <Pressable onPress={() => codeRef.current?.focus()} style={{ flexDirection: 'row', gap: 8 }} accessibilityLabel={`Code, ${code.length} of 6 digits`}>
              {Array.from({ length: 6 }, (_, i) => (
                <View key={i} style={{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,15,14,0.12)', borderBottomWidth: 3, borderBottomColor: i === code.length ? INK : 'transparent' }}>
                  <Txt style={{ color: INK, fontSize: 24, fontWeight: '900' }}>{code[i] ?? ''}</Txt>
                </View>
              ))}
            </Pressable>
            <TextInput ref={codeRef} value={code} onChangeText={onCode} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }} accessibilityLabel="Code" />
            <Pressable onPress={() => flash('Sent again')} style={{ paddingVertical: 6 }}>
              <Txt style={{ color: INK, fontWeight: '700', textDecorationLine: 'underline' }}>Send it again</Txt>
            </Pressable>
          </>
        )}

        {mode === 'up' && step === 3 && (
          <>
            <Txt style={{ color: INK, fontSize: 28, fontWeight: '900', textTransform: 'uppercase' }}>Link what you use</Txt>
            <Txt style={{ color: INK, fontSize: 14 }}>See only reads them, to suggest what to rank. It never posts.</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LINKS.map((x) => (
                <Chip key={x} label={x} on={linked.includes(x)} onPress={() => setLinked((l) => (l.includes(x) ? l.filter((y) => y !== x) : [...l, x]))} />
              ))}
            </View>
            <Go label={linked.length ? 'Continue' : 'Skip for now'} onPress={() => setStep(4)} />
          </>
        )}

        {mode === 'up' && step === 4 && (
          <>
            <Txt style={{ color: INK, fontSize: 28, fontWeight: '900', textTransform: 'uppercase' }}>
              Top {n} {(picked[0] ?? 'music').toLowerCase()}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[5, 10, 20, 50].map((x) => (
                <Chip key={x} label={`Top ${x}`} on={n === x} onPress={() => setN(x)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(11,15,14,0.12)', paddingLeft: 14 }}>
              <Txt style={{ color: INK, fontWeight: '900', fontSize: 18 }}>01</Txt>
              <Field
                value={first}
                onChangeText={(v) => {
                  setFirst(v);
                  setFirstId(null);
                }}
                placeholder="Find No. 1"
                accessibilityLabel="Find No. 1"
                style={{ flex: 1, backgroundColor: 'transparent', paddingHorizontal: 0 }}
              />
              {firstId && <Icon name="check" size={16} color={INK} />}
            </View>
            {!firstId &&
              sugs.map((x) => (
                <Pressable
                  key={x.id}
                  onPress={() => {
                    setFirst(x.t);
                    setFirstId(x.id);
                  }}
                  style={{ minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(11,15,14,0.18)' }}
                >
                  <Txt style={{ color: INK, fontWeight: '800', fontSize: 14 }}>{x.t}</Txt>
                  <Txt style={{ color: '#2a100a', fontSize: 12 }}>{BY_ID[x.id]?.m}</Txt>
                </Pressable>
              ))}
            <View style={{ flex: 1 }} />
            <Go label="Start ranking" onPress={finish} />
          </>
        )}
      </ScrollView>
      {!!note && (
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: 30, backgroundColor: INK, padding: 14 }} accessibilityLiveRegion="polite">
          <Txt style={{ color: FLARE, fontWeight: '600' }}>{note}</Txt>
        </View>
      )}
    </SafeAreaView>
  );
}
