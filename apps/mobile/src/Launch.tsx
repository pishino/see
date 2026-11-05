import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LOGOBOX, logoBoxFrame } from '@see/brand';

/*
 * Launch (V3LogoBox C), the same frames as the web: see in the box holds, squeezes to the + box in eight 55 ms
 * steps, then fades as the app takes over. Reduced motion skips it.
 */
export function Launch({ bg, flare }: { bg: string; flare: string }) {
  const [frame, setFrame] = useState(0);
  const [gone, setGone] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    let live = true;
    const ts: ReturnType<typeof setTimeout>[] = [];
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!live) return;
      if (reduce) return setGone(true);
      for (let i = 1; i < LOGOBOX.steps; i++) ts.push(setTimeout(() => setFrame(i), LOGOBOX.hold + i * LOGOBOX.beat));
      ts.push(
        setTimeout(() => {
          Animated.timing(fade, { toValue: 0, duration: LOGOBOX.out, useNativeDriver: true }).start(() => setGone(true));
        }, LOGOBOX.hold + LOGOBOX.steps * LOGOBOX.beat),
      );
    });
    return () => {
      live = false;
      ts.forEach(clearTimeout);
    };
  }, [fade]);

  if (gone) return null;
  const f = logoBoxFrame(frame / (LOGOBOX.steps - 1));
  const w = Math.min(width * 0.64, 420);
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: fade }]}>
      <Svg width={w} height={(w * 140) / 300} viewBox={LOGOBOX.viewBox}>
        <Path d={f.box + f.holes} fill={flare} fillRule="evenodd" />
      </Svg>
    </Animated.View>
  );
}
