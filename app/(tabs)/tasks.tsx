import { useMemo } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ListChecks } from 'lucide-react-native';
import { Screen, Text, PageHeader, Loading, EmptyState, ErrorState } from '../../components/ui';
import { TaskCard } from '../../components/TaskCard';
import { spacing, useTheme } from '../../constants/theme';
import { tasksApi } from '../../lib/services';
import { apiErrorMessage } from '../../lib/api';
import type { Task } from '../../lib/types';

interface Section {
  title: string;
  data: Task[];
}

export default function MyTasksScreen() {
  const { colors } = useTheme();
  const query = useQuery({ queryKey: ['my-tasks'], queryFn: tasksApi.mine });

  const sections = useMemo<Section[]>(() => {
    const tasks = query.data ?? [];
    const map = new Map<string, Section>();
    for (const t of tasks) {
      const title = t.game?.title ?? 'Proje';
      const key = t.gameId;
      if (!map.has(key)) map.set(key, { title, data: [] });
      map.get(key)!.data.push(t);
    }
    return Array.from(map.values());
  }, [query.data]);

  return (
    <Screen padded>
      <PageHeader title="Görevlerim" subtitle="Sana atanan" />

      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState message={apiErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : !sections.length ? (
        <EmptyState
          icon={<ListChecks size={48} color={colors.textTertiary} strokeWidth={1.5} />}
          title="Görevin yok"
          description="Sana bir görev atandığında burada görünecek."
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.accent}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text variant="label" tone="tertiary" style={styles.sectionHeader}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <TaskCard task={item} onPress={() => router.push(`/tasks/${item.id}`)} />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl, paddingTop: spacing.sm },
  sectionHeader: { marginTop: spacing.lg, marginBottom: spacing.md },
  itemWrap: { marginBottom: spacing.gap },
});
