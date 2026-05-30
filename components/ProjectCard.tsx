import { StyleSheet, View } from 'react-native';
import { Card, Text, Badge, ProgressBar } from './ui';
import { genreLabels, roleLabels } from '../lib/labels';
import { spacing } from '../constants/theme';
import type { Game } from '../lib/types';

/** Proje "baloncuk" kartı: ad + rol rozeti + tür + ilerleme. */
export function ProjectCard({ game, onPress }: { game: Game; onPress: () => void }) {
  const pct = game.progress?.percentage ?? 0;
  const isAdmin = game.myRole === 'admin';

  return (
    <Card onPress={onPress}>
      <View style={styles.topRow}>
        <Text variant="heading" style={styles.title} numberOfLines={1}>
          {game.title}
        </Text>
        {game.myRole ? (
          <Badge
            label={roleLabels[game.myRole]}
            variant={isAdmin ? 'accent' : 'neutral'}
          />
        ) : null}
      </View>

      <Text variant="caption" tone="tertiary" style={styles.genre}>
        {genreLabels[game.genre]}
      </Text>

      <View style={styles.progressRow}>
        <View style={styles.barWrap}>
          <ProgressBar percentage={pct} />
        </View>
        <Text variant="bodyMedium" tone="secondary" style={styles.pct}>
          %{pct}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1 },
  genre: { marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, gap: spacing.md },
  barWrap: { flex: 1 },
  pct: { minWidth: 40, textAlign: 'right' },
});
