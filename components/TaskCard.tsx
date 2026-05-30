import { StyleSheet, View } from 'react-native';
import { Card, Text, Badge, Avatar } from './ui';
import { useTheme, spacing } from '../constants/theme';
import { taskStatusSwatch } from '../lib/statusColors';
import { taskStatusLabels } from '../lib/labels';
import type { Task } from '../lib/types';

/** Görev "baloncuk" satırı: başlık + atanan + durum. */
export function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  const { scheme } = useTheme();
  const sw = taskStatusSwatch(scheme, task.status);

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.main}>
          <Text variant="bodyMedium" numberOfLines={2}>
            {task.title}
          </Text>
          <View style={styles.meta}>
            <Badge label={taskStatusLabels[task.status]} variant="custom" bg={sw.bg} fg={sw.fg} />
          </View>
        </View>
        {task.assignee ? (
          <Avatar name={task.assignee.username} uri={task.assignee.avatarUrl} size={34} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  main: { flex: 1 },
  meta: { flexDirection: 'row', marginTop: spacing.md },
});
