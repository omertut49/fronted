import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, FolderOpen } from 'lucide-react-native';
import { Screen, Text, PageHeader, Loading, EmptyState, ErrorState } from '../../components/ui';
import { ProjectCard } from '../../components/ProjectCard';
import { spacing, useTheme } from '../../constants/theme';
import { gamesApi } from '../../lib/services';
import { apiErrorMessage } from '../../lib/api';
import type { Game } from '../../lib/types';

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const query = useQuery({ queryKey: ['games'], queryFn: gamesApi.list });

  const goNew = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/games/new');
  };

  const AddButton = (
    <Pressable onPress={goNew} hitSlop={8} style={[styles.add, { backgroundColor: colors.accent }]}>
      <Plus size={22} color={colors.onAccent} strokeWidth={2.4} />
    </Pressable>
  );

  return (
    <Screen padded>
      <PageHeader title="Projeler" subtitle="Stüdyon" right={AddButton} />

      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState message={apiErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState
          icon={<FolderOpen size={48} color={colors.textTertiary} strokeWidth={1.5} />}
          title="Henüz proje yok"
          description="Bir oyun fikri yaz, yapay zekâ senin için yol haritasını oluştursun."
          actionLabel="Yeni Proje"
          onAction={goNew}
        />
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item, index }: { item: Game; index: number }) => (
            <Animated.View entering={FadeInDown.duration(380).delay(index * 50)}>
              <ProjectCard game={item} onPress={() => router.push(`/games/${item.id}`)} />
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.gap }} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl, paddingTop: spacing.sm },
  add: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
