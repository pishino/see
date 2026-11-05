import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useSettings } from '@see/core/react';

/*
 * The field behind the masthead (V3PlusField): small + signs, a few lit at a time, stepping rather than gliding.
 * Off in Settings › Display, it is plain ink; with reduce motion it holds still.
 */
const CELL = 14;

export function PlusField({ width, height, color }: { width: number; height: number; color: string }) {
  const { settings } = useSettings();
  const [tick, setTick] = useState(0);
  const still = settings.reduceMotion;
  useEffect(() => {
    if (still || !settings.field) return;
    const t = setInterval(() => setTick((n) => n + 1), 900);
    return () => clearInterval(t);
  }, [still, settings.field]);
  const cols = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const pluses = useMemo(() => {
    let s = (tick * 2654435761 + 7) >>> 0;
    const rnd = () => {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
    const out: { x: number; y: number; o: number }[] = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const r = rnd();
        // brighter towards the top right, where the + lives in the lockup
        const lean = (x / cols) * 0.5 + (1 - y / rows) * 0.5;
        const o = r < 0.06 + lean * 0.1 ? 0.55 + r * 4 : 0.1 + lean * 0.12;
        out.push({ x: x * CELL + CELL / 2, y: y * CELL + CELL / 2, o: Math.min(0.9, o) });
      }
    return out;
  }, [tick, cols, rows]);
  if (!settings.field) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width={width} height={height}>
        {pluses.map((p, i) => (
          <Rect key={`h${i}`} x={p.x - 3} y={p.y - 0.75} width={6} height={1.5} fill={color} opacity={p.o} />
        ))}
        {pluses.map((p, i) => (
          <Rect key={`v${i}`} x={p.x - 0.75} y={p.y - 3} width={1.5} height={6} fill={color} opacity={p.o} />
        ))}
      </Svg>
    </View>
  );
}
