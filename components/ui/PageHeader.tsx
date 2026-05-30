import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { spacing, useTheme } from '../../constants/theme';
import { Text } from './Text';

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

/** Ekran başlığı: opsiyonel geri butonu + sağ aksiyon. */
export function PageHeader({ title, subtitle, back, right }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        {back ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: colors.frame }]}
          >
            <ChevronLeft size={22} color={colors.textPrimary} />
          </Pressable>
        ) : null}
        <View style={styles.titles}>
          {subtitle ? (
            <Text variant="label" tone="tertiary" style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
          <Text variant="title">{title}</Text>
        </View>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  titles: { flex: 1 },
  subtitle: { marginBottom: 3 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
