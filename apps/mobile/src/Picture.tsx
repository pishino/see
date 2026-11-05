import { memo, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { artFor, artShapes } from '@see/brand';

/*
 * An entry's picture: the same flat-tone scene the web paints into a canvas, recorded as SVG shapes. It fills its
 * box and crops the overflow, the way the web's object-fit: cover does.
 */
const W = 320;
const H = 180;

export const Picture = memo(function Picture({ xid, style }: { xid: string; style?: StyleProp<ViewStyle> }) {
  const shapes = useMemo(() => artShapes(artFor(xid), W, H), [xid]);
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#141A18' }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        {shapes.map((s, i) =>
          s.d ? <Path key={i} d={s.d} fill={s.fill ?? 'none'} stroke={s.stroke} strokeWidth={s.sw} /> : null,
        )}
      </Svg>
    </View>
  );
});
