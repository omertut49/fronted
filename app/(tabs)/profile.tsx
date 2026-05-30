import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Sun, Moon, Smartphone, Info, LogOut, ChevronRight } from 'lucide-react-native';
import { Screen, Text, PageHeader, Card, Avatar, SegmentedControl, type Segment } from '../../components/ui';
import { spacing, useTheme, type ThemeMode } from '../../constants/theme';
import { useAuth } from '../../lib/store';

export default function ProfileScreen() {
  const { colors, mode, setMode } = useTheme();
  const player = useAuth((s) => s.player);
  const logout = useAuth((s) => s.logout);

  const modes: Segment<ThemeMode>[] = [
    { value: 'light', label: 'Açık' },
    { value: 'dark', label: 'Koyu' },
    { value: 'system', label: 'Sistem' },
  ];

  const onLogout = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Screen padded>
      <PageHeader title="Profil" subtitle="Hesap" />

      <Card style={styles.profileCard}>
        <Avatar name={player?.username} uri={player?.avatarUrl} size={56} />
        <View style={styles.profileInfo}>
          <Text variant="heading" numberOfLines={1}>
            {player?.username ?? 'Oyuncu'}
          </Text>
          {player?.email ? (
            <Text variant="caption" tone="tertiary" numberOfLines={1}>
              {player.email}
            </Text>
          ) : null}
        </View>
      </Card>

      <Text variant="label" tone="tertiary" style={styles.sectionLabel}>
        GÖRÜNÜM
      </Text>
      <Card>
        <View style={styles.themeRow}>
          <ThemeIcon mode={mode} color={colors.textSecondary} />
          <Text variant="bodyMedium" style={styles.themeLabel}>
            Tema
          </Text>
        </View>
        <View style={styles.themeControl}>
          <SegmentedControl segments={modes} value={mode} onChange={setMode} />
        </View>
      </Card>

      <Text variant="label" tone="tertiary" style={styles.sectionLabel}>
        DİĞER
      </Text>
      <Card style={styles.noPad}>
        <Row
          icon={<Info size={20} color={colors.textSecondary} />}
          label="Hakkında"
          onPress={() => router.push('/about')}
          rightIcon={<ChevronRight size={18} color={colors.textTertiary} />}
        />
        <View style={[styles.divider, { backgroundColor: colors.hairline }]} />
        <Row
          icon={<LogOut size={20} color={colors.accent} />}
          label="Çıkış Yap"
          destructive
          onPress={onLogout}
        />
      </Card>

      <Pressable onPress={() => router.push('/about')} style={styles.signature}>
        <Text variant="label" tone="tertiary">
          NYSA TARAFINDAN
        </Text>
      </Pressable>
    </Screen>
  );
}

function ThemeIcon({ mode, color }: { mode: ThemeMode; color: string }) {
  if (mode === 'light') return <Sun size={20} color={color} />;
  if (mode === 'dark') return <Moon size={20} color={color} />;
  return <Smartphone size={20} color={color} />;
}

function Row({
  icon,
  label,
  onPress,
  destructive,
  rightIcon,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  rightIcon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.row}>
      {icon}
      <Text
        variant="bodyMedium"
        style={[styles.rowLabel, { color: destructive ? colors.accent : colors.textPrimary }]}
      >
        {label}
      </Text>
      {rightIcon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.sm },
  profileInfo: { flex: 1 },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.md },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  themeLabel: { flex: 1 },
  themeControl: {},
  noPad: { padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  rowLabel: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.lg + 20 + spacing.md },
  signature: { alignSelf: 'center', marginTop: 'auto', paddingVertical: spacing.xl },
});
