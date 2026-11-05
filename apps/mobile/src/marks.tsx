/*
 * The brand on the phone: the same path data as the web (@see/brand), drawn with react-native-svg.
 */
import Svg, { Path } from 'react-native-svg';
import { BOX_H, BOX_W, ICON_PATHS, SEE_MARK, boxFrame, tagOf } from '@see/brand';

export type IconName = keyof typeof ICON_PATHS;

export function Wordmark({ height = 28, color }: { height?: number; color: string }) {
  return (
    <Svg width={(SEE_MARK.w / SEE_MARK.h) * height} height={height} viewBox={`0 0 ${SEE_MARK.w} ${SEE_MARK.h}`} accessibilityLabel="see">
      <Path d={SEE_MARK.d} fill={color} />
    </Svg>
  );
}

export function PlusBox({ height = 28, color, frame = 0 }: { height?: number; color: string; frame?: number }) {
  return (
    <Svg width={(height * BOX_W) / BOX_H} height={height} viewBox={`0 0 ${BOX_W} ${BOX_H}`}>
      <Path d={boxFrame(frame)} fill={color} />
    </Svg>
  );
}

export function CategoryTag({ name, height = 22, color }: { name: string; height?: number; color: string }) {
  const T = tagOf(name);
  return (
    <Svg width={(T.w * height) / T.h} height={height} viewBox={`0 0 ${T.w} ${T.h}`} accessibilityLabel={name}>
      <Path d={T.d} fill={color} />
    </Svg>
  );
}

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      <Path d={ICON_PATHS[name]} fill={color} />
    </Svg>
  );
}
