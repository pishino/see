import { useContext, useEffect, useRef, type ReactNode } from 'react';
import { Animated, BackHandler, Easing, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@see/core/react';
import { motion } from '@see/tokens';
import { NavCtx } from './nav';
import type { C } from './theme';

/* Everything that opens on a phone is a sheet from the bottom, menus included (V3Behaviour). Back or the scrim closes it. */
export function Sheet({ c, onClose, label, children }: { c: C; onClose: () => void; label: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const reduce = useSettings().settings.reduceMotion;
  const y = useRef(new Animated.Value(600)).current;
  const close = useRef(onClose);
  close.current = onClose;
  const nav = useContext(NavCtx);
  useEffect(() => nav?.cover(), [nav]);
  useEffect(() => {
    Animated.timing(y, { toValue: 0, duration: reduce ? 1 : motion.sheet, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start();
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close.current();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 20 }]}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,15,14,0.66)' }]} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        <Animated.View
          aria-modal
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={{ backgroundColor: c['surface-1'], paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 + insets.bottom, gap: 12, maxHeight: '92%', transform: [{ translateY: y }] }}
        >
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
