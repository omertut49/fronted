import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { X, Trash2 } from 'lucide-react-native';
import {
  Text,
  Button,
  Avatar,
  Input,
  SegmentedControl,
  Loading,
  ErrorState,
  type Segment,
} from '../../components/ui';
import { radius, spacing, useTheme } from '../../constants/theme';
import { gamesApi, tasksApi } from '../../lib/services';
import { apiErrorMessage } from '../../lib/api';
import { taskStatusLabels, phaseTypeLabels } from '../../lib/labels';
import { useAuth } from '../../lib/store';
import type { TaskStatus } from '../../lib/types';

export default function TaskDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const player = useAuth((s) => s.player);

  const taskQuery = useQuery({ queryKey: ['task', id], queryFn: () => tasksApi.get(id) });
  const task = taskQuery.data;

  const gameQuery = useQuery({
    queryKey: ['game', task?.gameId],
    queryFn: () => gamesApi.get(task!.gameId),
    enabled: !!task?.gameId,
  });

  const isAdmin = gameQuery.data?.myRole === 'admin';
  const isAssignee = !!task && task.assigneeId === player?.id;
  const canEditStatus = isAdmin || isAssignee;
  const members = gameQuery.data?.members ?? [];

  const [status, setStatus] = useState<TaskStatus>('todo');
  const [completionNote, setCompletionNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setCompletionNote(task.completionNote ?? '');
    }
  }, [task]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['task', id] });
    if (task) {
      void qc.invalidateQueries({ queryKey: ['tasks', task.gameId] });
      void qc.invalidateQueries({ queryKey: ['game', task.gameId] });
      void qc.invalidateQueries({ queryKey: ['games'] });
      void qc.invalidateQueries({ queryKey: ['my-tasks'] });
    }
  };

  const update = useMutation({
    mutationFn: (body: Parameters<typeof tasksApi.update>[1]) => tasksApi.update(id, body),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidate();
    },
    onError: (e) => setError(apiErrorMessage(e, 'Güncellenemedi.')),
  });

  const remove = useMutation({
    mutationFn: () => tasksApi.remove(id),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidate();
      router.back();
    },
    onError: (e) => setError(apiErrorMessage(e, 'Silinemedi.')),
  });

  const saveStatus = () => {
    const body: Parameters<typeof tasksApi.update>[1] = { status };
    if (completionNote.trim()) body.completionNote = completionNote.trim();
    update.mutate(body);
  };

  const statusSegments: Segment<TaskStatus>[] = (['todo', 'in_progress', 'done'] as TaskStatus[]).map(
    (s) => ({ value: s, label: taskStatusLabels[s] }),
  );

  return (
    <Animated.View entering={FadeIn.duration(160)} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />
      <Animated.View
        entering={SlideInDown.springify().damping(20).stiffness(220)}
        style={[
          styles.card,
          { backgroundColor: colors.bg, paddingBottom: insets.bottom + spacing.lg, maxHeight: '88%' },
        ]}
      >
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.hairline }]} />
          <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.close, { backgroundColor: colors.frame }]}>
            <X size={18} color={colors.textPrimary} />
          </Pressable>
        </View>

        {taskQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            <Loading />
          </View>
        ) : taskQuery.isError || !task ? (
          <View style={styles.loadingWrap}>
            <ErrorState message={apiErrorMessage(taskQuery.error)} onRetry={() => taskQuery.refetch()} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {task.phase ? (
              <Text variant="label" tone="tertiary">
                {phaseTypeLabels[task.phase.type] ?? task.phase.name}
              </Text>
            ) : null}
            <Text variant="title" style={styles.title}>
              {task.title}
            </Text>

            {task.description ? (
              <Text variant="body" tone="secondary" style={styles.desc}>
                {task.description}
              </Text>
            ) : null}

            {/* Atanan */}
            <Text variant="label" tone="tertiary" style={styles.fieldLabel}>
              ATANAN
            </Text>
            {isAdmin && members.length > 0 ? (
              <FlatList
                horizontal
                data={members}
                keyExtractor={(m) => m.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.assigneeRow}
                renderItem={({ item }) => {
                  const selected = task.assigneeId === item.playerId;
                  return (
                    <Pressable
                      onPress={() => update.mutate({ assigneeId: item.playerId })}
                      style={[styles.assignee, { borderColor: selected ? colors.accent : 'transparent' }]}
                    >
                      <Avatar name={item.player?.username} uri={item.player?.avatarUrl} size={44} />
                      <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.assigneeName}>
                        {item.player?.username ?? '—'}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            ) : (
              <View style={styles.assigneeStatic}>
                {task.assignee ? (
                  <>
                    <Avatar name={task.assignee.username} uri={task.assignee.avatarUrl} size={36} />
                    <Text variant="bodyMedium">{task.assignee.username}</Text>
                  </>
                ) : (
                  <Text variant="body" tone="tertiary">
                    Atanmamış
                  </Text>
                )}
              </View>
            )}

            {/* Durum */}
            <Text variant="label" tone="tertiary" style={styles.fieldLabel}>
              DURUM
            </Text>
            {canEditStatus ? (
              <>
                <SegmentedControl segments={statusSegments} value={status} onChange={setStatus} />
                <View style={styles.noteWrap}>
                  <Input
                    label="Tamamlama notu (opsiyonel)"
                    value={completionNote}
                    onChangeText={setCompletionNote}
                    placeholder="Ne yapıldı?"
                    multiline
                    style={styles.note}
                  />
                </View>
                {error ? (
                  <Text variant="caption" tone="accent" style={styles.error}>
                    {error}
                  </Text>
                ) : null}
                <Button
                  label="Kaydet"
                  onPress={saveStatus}
                  loading={update.isPending}
                  disabled={status === task.status && completionNote === (task.completionNote ?? '')}
                />
              </>
            ) : (
              <Text variant="body" tone="secondary">
                {taskStatusLabels[task.status]}
              </Text>
            )}

            {isAdmin ? (
              <Pressable
                onPress={() => remove.mutate()}
                style={[styles.delete, { borderColor: colors.hairline }]}
              >
                <Trash2 size={18} color={colors.accent} />
                <Text variant="bodyMedium" tone="accent">
                  Görevi sil
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  handle: { width: 40, height: 4, borderRadius: radius.pill },
  close: { position: 'absolute', right: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  loadingWrap: { height: 200 },
  scroll: { paddingBottom: spacing.md },
  title: { marginTop: 6 },
  desc: { marginTop: spacing.md, lineHeight: 21 },
  fieldLabel: { marginTop: spacing.xl, marginBottom: spacing.md },
  assigneeRow: { gap: spacing.md, paddingVertical: 2 },
  assignee: { alignItems: 'center', width: 60, borderWidth: 2, borderRadius: 16, paddingVertical: 6 },
  assigneeName: { marginTop: 4, maxWidth: 56, textAlign: 'center' },
  assigneeStatic: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noteWrap: { marginTop: spacing.lg },
  note: { minHeight: 70 },
  error: { marginTop: spacing.md },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
