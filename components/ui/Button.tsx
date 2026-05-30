import { Pressable, ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { radius, useTheme } from '../../constants/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Mercan dolgu (primary) / metin (secondary/ghost). Basışta hafif ölçek + haptik. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
  fullWidth = true,
}: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const inactive = disabled || loading;

  const bg = isPrimary ? colors.accent : isSecondary ? colors.frame : 'transparent';
  const fg = isPrimary ? colors.onAccent : colors.textPrimary;

  return (
    <AnimatedPressable
      disabled={inactive}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 320 });
      }}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.base,
        { backgroundColor: bg, borderRadius: radius.button },
        fullWidth && styles.full,
        inactive && styles.inactive,
        style,
      ]}
    >
      <Animated.View style={[styles.content, animStyle]}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <Text variant="bodyMedium" style={{ color: fg }}>
              {label}
            </Text>
          </>
        )}
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  full: { alignSelf: 'stretch' },
  inactive: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: 8 },
});
