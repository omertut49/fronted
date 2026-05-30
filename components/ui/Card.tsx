import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { radius, spacing, useTheme } from '../../constants/theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  /** secondary: frame rengiyle (iç içe kartlar için) */
  tone?: 'surface' | 'frame';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Yuvarlak "baloncuk" kart. onPress verilirse basışta hafif ölçek + haptik. */
export function Card({ children, onPress, style, tone = 'surface' }: Props) {
  const { colors } = useTheme();
  const bg = tone === 'frame' ? colors.frame : colors.surface;

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!onPress) {
    return <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
  }

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.card, { backgroundColor: bg }, animStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.bubble, padding: spacing.lg },
});
