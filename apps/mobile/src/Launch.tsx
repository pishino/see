import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LOGOBOX, logoBoxFrame } from '@see/brand';

/*
 * Launch (V3LogoBox C), the same frames as the web: see in the box holds, squeezes to the + box in eight 55 ms
 * steps, then fades as the app takes over. Reduced motion (the phone's, or Settings › Display) skips it.
 */
export function Launch({ bg, flare, reduce = false }: { bg: string; flare: string; reduce?: boolean }) {
  const [frame, setFrame] = useState(0);
  const [gone, setGone] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    let live = true;
    const ts: ReturnType<typeof setTimeout>[] = [];
    AccessibilityInfo.isReduceMotionEnabled().then((osReduce) => {
      if (!live) return;
      if (osReduce || reduce) return setGone(true);
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
    // the launch plays once, when the app opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
