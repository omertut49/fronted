import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Users, Plus } from 'lucide-react-native';
import {
  Screen,
  Text,
  PageHeader,
  Card,
  ProgressBar,
  SegmentedControl,
  Button,
  Input,
  BottomSheet,
  Avatar,
  Loading,
  EmptyState,
  ErrorState,
  type Segment,
} from '../../../components/ui';
import { TaskCard } from '../../../components/TaskCard';
import { spacing, useTheme } from '../../../constants/theme';
import { gamesApi, tasksApi } from '../../../lib/services';
import { apiErrorMessage } from '../../../lib/api';
import { roleLabels, taskPriorityLabels } from '../../../lib/labels';
import type { Task, TaskPriority } from '../../../lib/types';

export default function GameBoardScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [phaseId, setPhaseId] = useState<string | null>(null);

  const gameQuery = useQuery({ queryKey: ['game', id], queryFn: () => gamesApi.get(id) });
  const game = gameQuery.data;
  const isAdmin = game?.myRole === 'admin';

  const phases = useMemo(() => game?.phases ?? [], [game]);
  const activePhaseId = phaseId ?? phases[0]?.id ?? null;

  const tasksQuery = useQuery({
    queryKey: ['tasks', id, activePhaseId],
    queryFn: () => tasksApi.list({ gameId: id, phaseId: activePhaseId! }),
    enabled: !!activePhaseId,
  });

  const segments: Segment<string>[] = phases.map((p) => ({ value: p.id, label: p.name }));

  return (
    <Screen padded>
      <PageHeader
        title={game?.title ?? 'Proje'}
        subtitle={game?.myRole ? roleLabels[game.myRole] : undefined}
        back
        right={
          <Pressable
            onPress={() => router.push(`/games/${id}/members`)}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.frame }]}
          >
            <Users size={20} color={colors.textPrimary} />
          </Pressable>
        }
      />

      {gameQuery.isLoading ? (
        <Loading />
      ) : gameQuery.isError || !game ? (
        <ErrorState message={apiErrorMessage(gameQuery.error)} onRetry={() => gameQuery.refetch()} />
      ) : (
        <>
          <Card style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text variant="label" tone="tertiary">
                GENEL İLERLEME
              </Text>
              <Text variant="heading" tone="accent">
                %{game.progress?.percentage ?? 0}
              </Text>
            </View>
            <ProgressBar percentage={game.progress?.percentage ?? 0} height={8} />
            <Text variant="caption" tone="secondary" style={styles.progressMeta}>
              {game.progress?.done ?? 0} / {game.progress?.total ?? 0} görev tamamlandı
            </Text>
          </Card>

          {segments.length > 0 ? (
            <View style={styles.tabs}>
              <SegmentedControl
                scrollable
                segments={segments}
                value={activePhaseId ?? segments[0].value}
                onChange={setPhaseId}
              />
            </View>
          ) : null}

          {tasksQuery.isLoading ? (
            <Loading />
          ) : tasksQuery.isError ? (
            <ErrorState message={apiErrorMessage(tasksQuery.error)} onRetry={() => tasksQuery.refetch()} />
          ) : !tasksQuery.data?.length ? (
            <EmptyState
              title="Bu aşamada görev yok"
              description={isAdmin ? 'Aşağıdaki + ile ilk görevi ekle.' : 'Henüz görev eklenmemiş.'}
            />
          ) : (
            <FlatList
              data={tasksQuery.data}
              keyExtractor={(t) => t.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }: { item: Task; index: number }) => (
                <Animated.View entering={FadeInDown.duration(300).delay(index * 40)}>
                  <TaskCard task={item} onPress={() => router.push(`/tasks/${item.id}`)} />
                </Animated.View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: spacing.gap }} />}
            />
          )}

          {isAdmin && activePhaseId ? (
            <AddTaskFab gameId={id} phaseId={activePhaseId} />
          ) : null}
        </>
      )}
    </Screen>
  );
}

/** Admin için görev ekleme FAB + bottom sheet. */
function AddTaskFab({ gameId, phaseId }: { gameId: string; phaseId: string }) {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gameQuery = useQuery({ queryKey: ['game', gameId], queryFn: () => gamesApi.get(gameId) });
  const members = gameQuery.data?.members ?? [];

  const create = useMutation({
    mutationFn: () =>
      tasksApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        gameId,
        phaseId,
        priority,
        assigneeId: assigneeId ?? undefined,
      }),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void qc.invalidateQueries({ queryKey: ['tasks', gameId] });
      void qc.invalidateQueries({ queryKey: ['game', gameId] });
      void qc.invalidateQueries({ queryKey: ['games'] });
      reset();
      setOpen(false);
    },
    onError: (e) => setError(apiErrorMessage(e, 'Görev eklenemedi.')),
  });

  const reset = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setAssigneeId(null);
    setError(null);
  };

  const submit = () => {
    setError(null);
    if (!title.trim()) {
      setError('Görev başlığı gerekli.');
      return;
    }
    create.mutate();
  };

  const priorities: Segment<TaskPriority>[] = (['low', 'medium', 'high'] as TaskPriority[]).map(
    (p) => ({ value: p, label: taskPriorityLabels[p] }),
  );

  return (
    <>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setOpen(true);
        }}
        style={[styles.fab, { backgroundColor: colors.accent }]}
      >
        <Plus size={26} color={colors.onAccent} strokeWidth={2.4} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text variant="heading" style={styles.sheetTitle}>
          Yeni görev
        </Text>
        <View style={styles.sheetForm}>
          <Input label="Başlık" value={title} onChangeText={setTitle} placeholder="Görev başlığı" />
          <Input
            label="Açıklama"
            value={description}
            onChangeText={setDescription}
            placeholder="İsteğe bağlı"
            multiline
            style={styles.descInput}
          />

          <View>
            <Text variant="label" tone="tertiary" style={styles.fieldLabel}>
              ÖNCELİK
            </Text>
            <SegmentedControl segments={priorities} value={priority} onChange={setPriority} />
          </View>

          {members.length > 0 ? (
            <View>
              <Text variant="label" tone="tertiary" style={styles.fieldLabel}>
                ATANAN
              </Text>
              <FlatList
                horizontal
                data={members}
                keyExtractor={(m) => m.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.assigneeRow}
                renderItem={({ item }) => {
                  const selected = assigneeId === item.playerId;
                  return (
                    <Pressable
                      onPress={() => setAssigneeId(selected ? null : item.playerId)}
                      style={[
                        styles.assignee,
                        { borderColor: selected ? colors.accent : 'transparent' },
                      ]}
                    >
                      <Avatar name={item.player?.username} uri={item.player?.avatarUrl} size={44} />
                      <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.assigneeName}>
                        {item.player?.username ?? '—'}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          ) : null}

          {error ? (
            <Text variant="caption" tone="accent">
              {error}
            </Text>
          ) : null}

          <Button label="Görevi Ekle" onPress={submit} loading={create.isPending} />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  progressCard: { marginTop: spacing.sm },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  progressMeta: { marginTop: spacing.md },
  tabs: { marginTop: spacing.lg, marginBottom: spacing.md },
  list: { paddingBottom: 100, paddingTop: spacing.xs },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { marginBottom: spacing.lg },
  sheetForm: { gap: spacing.lg },
  descInput: { minHeight: 80 },
  fieldLabel: { marginBottom: spacing.md, marginLeft: 4 },
  assigneeRow: { gap: spacing.md, paddingVertical: 2 },
  assignee: { alignItems: 'center', width: 60, borderWidth: 2, borderRadius: 16, paddingVertical: 6 },
  assigneeName: { marginTop: 4, maxWidth: 56, textAlign: 'center' },
});
