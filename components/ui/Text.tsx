import { Text as RNText, type TextProps, StyleSheet } from 'react-native';
import { font, useTheme } from '../../constants/theme';

type Variant = 'title' | 'heading' | 'body' | 'bodyMedium' | 'caption' | 'label';
type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
}

/** Outfit fontlu, tema renkli temel metin bileşeni. */
export function Text({ variant = 'body', tone = 'primary', style, ...rest }: Props) {
  const { colors } = useTheme();
  const toneColor =
    tone === 'secondary'
      ? colors.textSecondary
      : tone === 'tertiary'
        ? colors.textTertiary
        : tone === 'accent'
          ? colors.accent
          : colors.textPrimary;

  return <RNText {...rest} style={[styles[variant], { color: toneColor }, style]} />;
}

const styles = StyleSheet.create({
  title: { fontFamily: font.medium, fontSize: 24, letterSpacing: -0.3 },
  heading: { fontFamily: font.medium, fontSize: 18, letterSpacing: -0.2 },
  bodyMedium: { fontFamily: font.medium, fontSize: 15 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: font.regular, fontSize: 13 },
  // bölüm etiketi: küçük, BÜYÜK HARF, harf aralıklı
  label: { fontFamily: font.medium, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' },
});
