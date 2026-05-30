import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../constants/theme';

interface Props {
  /** 0–100 */
  percentage: number;
  height?: number;
}

/** Yuvarlatılmış ince ilerleme çubuğu (yumuşak dolum animasyonu). */
export function ProgressBar({ percentage, height = 6 }: Props) {
  const { colors } = useTheme();
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withSpring(Math.max(0, Math.min(100, percentage)), {
      damping: 18,
      stiffness: 120,
    });
  }, [percentage, w]);

  const animStyle = useAnimatedStyle(() => ({ width: `${w.value}%` }));

  return (
    <View style={[styles.track, { backgroundColor: colors.progressTrack, height }]}>
      <Animated.View
        style={[styles.fill, animStyle, { backgroundColor: colors.accent, height }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: 999, overflow: 'hidden', width: '100%' },
  fill: { borderRadius: 999 },
});
