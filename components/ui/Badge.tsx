import { StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../../constants/theme';
import { Text } from './Text';

interface Props {
  label: string;
  /** accent: mercan yumuşak dolgu; neutral: frame; tonlu: özel renk ailesi */
  variant?: 'accent' | 'neutral' | 'custom';
  bg?: string;
  fg?: string;
}

/** Küçük yuvarlak pill. Renkli dolgu üstünde aynı ailenin koyu tonu. */
export function Badge({ label, variant = 'neutral', bg, fg }: Props) {
  const { colors } = useTheme();

  let bgColor = bg;
  let fgColor = fg;
  if (variant === 'accent') {
    bgColor = colors.accentSoft;
    fgColor = colors.accentOnSoft;
  } else if (variant === 'neutral') {
    bgColor = colors.frame;
    fgColor = colors.textSecondary;
  }

  return (
    <View style={[styles.pill, { backgroundColor: bgColor }]}>
      <Text variant="label" style={{ color: fgColor, letterSpacing: 1.2, fontSize: 10 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});
