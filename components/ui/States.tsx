import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { type ReactNode } from 'react';
import { spacing, useTheme } from '../../constants/theme';
import { Text } from './Text';
import { Button } from './Button';

/** Tam ekran yükleme göstergesi. */
export function Loading() {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

/** Boş durum: ikon + başlık + açıklama + opsiyonel aksiyon. */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="secondary" style={styles.desc}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

/** Hata durumu: mesaj + tekrar dene. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text variant="heading" style={styles.title}>
        Bir şeyler ters gitti
      </Text>
      <Text variant="body" tone="secondary" style={styles.desc}>
        {message}
      </Text>
      {onRetry ? (
        <View style={styles.action}>
          <Button label="Tekrar Dene" variant="secondary" onPress={onRetry} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  icon: { marginBottom: spacing.lg, opacity: 0.9 },
  title: { textAlign: 'center', marginBottom: 6 },
  desc: { textAlign: 'center', maxWidth: 300 },
  action: { marginTop: spacing.xl },
});
