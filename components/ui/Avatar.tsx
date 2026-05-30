import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../../constants/theme';
import { initials } from '../../lib/labels';
import { Text } from './Text';

interface Props {
  name?: string | null;
  uri?: string | null;
  size?: number;
}

/** Avatar: görsel varsa onu, yoksa baş harf(ler)i mercan-yumuşak dolguda gösterir. */
export function Avatar({ name, uri, size = 36 }: Props) {
  const { colors } = useTheme();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSoft },
      ]}
    >
      <Text style={{ color: colors.accentOnSoft, fontSize: size * 0.38 }} variant="bodyMedium">
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
