import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Screen, Text, Button, Input, PageHeader, Card, Loading, ErrorState } from '../../components/ui';
import { spacing, useTheme } from '../../constants/theme';
import { ideasApi } from '../../lib/services';
import { apiErrorMessage } from '../../lib/api';
import { phaseTypeLabels, genreLabels } from '../../lib/labels';
import type { AiPhase, AiTask, GameGenre, IdeaPlan, PhaseType } from '../../lib/types';

const PHASE_ORDER: PhaseType[] = [
  'concept_design',
  'prototype',
  'art_visual',
  'production',
  'test_balance',
  'polish',
  'release',
];

const GENRES: GameGenre[] = ['action', 'rpg', 'puzzle', 'strategy', 'simulation', 'sports', 'other'];

const sortPhases = (phases: AiPhase[]) =>
  [...phases].sort((a, b) => PHASE_ORDER.indexOf(a.type) - PHASE_ORDER.indexOf(b.type));

export default function RoadmapScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<IdeaPlan | null>(null);

  const query = useQuery({
    queryKey: ['idea-session', sessionId],
    queryFn: () => ideasApi.getSession(sessionId),
    enabled: !!sessionId,
  });

  // AI planı yüklenince düzenlenebilir bir kopya oluştur (aşamalar sıralı).
  useEffect(() => {
    const plan = query.data?.plan;
    if (plan && !draft) {
      setDraft({ ...plan, phases: sortPhases(plan.phases) });
    }
  }, [query.data, draft]);

  const confirm = useMutation({
    mutationFn: () => {
      // Boş başlıklı görevleri at, metinleri kırp.
      const cleaned: IdeaPlan = {
        ...draft!,
        projectName: draft!.projectName.trim(),
        projectDescription: draft!.projectDescription.trim(),
        phases: draft!.phases.map((p) => ({
          ...p,
          tasks: p.tasks
            .filter((t) => t.title.trim().length > 0)
            .map((t) => ({ ...t, title: t.title.trim(), description: t.description?.trim() })),
        })),
      };
      return ideasApi.confirm(sessionId, cleaned);
    },
    onSuccess: (data) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void qc.invalidateQueries({ queryKey: ['games'] });
      router.replace(`/games/${data.gameId}`);
    },
    onError: (e) => setError(apiErrorMessage(e, 'Proje oluşturulamadı.')),
  });

  // --- Düzenleme yardımcıları ---
  const patchPhase = (phaseIndex: number, tasks: AiTask[]) =>
    setDraft((d) =>
      d ? { ...d, phases: d.phases.map((p, i) => (i === phaseIndex ? { ...p, tasks } : p)) } : d,
    );

  const updateTask = (phaseIndex: number, taskIndex: number, patch: Partial<AiTask>) => {
    const phase = draft!.phases[phaseIndex];
    patchPhase(
      phaseIndex,
      phase.tasks.map((t, i) => (i === taskIndex ? { ...t, ...patch } : t)),
    );
  };

  const deleteTask = (phaseIndex: number, taskIndex: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const phase = draft!.phases[phaseIndex];
    patchPhase(
      phaseIndex,
      phase.tasks.filter((_, i) => i !== taskIndex),
    );
  };

  const addTask = (phaseIndex: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const phase = draft!.phases[phaseIndex];
    patchPhase(phaseIndex, [...phase.tasks, { title: '', description: '', priority: 'medium' }]);
  };

  const totalTasks = draft?.phases.reduce((sum, p) => sum + p.tasks.length, 0) ?? 0;
  const canConfirm = !!draft && draft.projectName.trim().length > 0;

  return (
    <Screen padded>
      <PageHeader title="Yol haritası" subtitle="Onaylamadan önce düzenle" back />

      {query.isLoading || (!draft && !query.isError) ? (
        <Loading />
      ) : query.isError || !draft ? (
        <ErrorState
          message={query.isError ? apiErrorMessage(query.error) : 'Plan bulunamadı.'}
          onRetry={() => query.refetch()}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeIn.duration(400)} style={styles.head}>
              <Input
                label="Proje adı"
                value={draft.projectName}
                onChangeText={(projectName) => setDraft((d) => (d ? { ...d, projectName } : d))}
                placeholder="Proje adı"
              />
              <View style={styles.gap} />
              <Input
                label="Açıklama"
                value={draft.projectDescription}
                onChangeText={(projectDescription) =>
                  setDraft((d) => (d ? { ...d, projectDescription } : d))
                }
                placeholder="Kısa açıklama"
                multiline
              />
              <Text variant="label" tone="tertiary" style={styles.genreLabel}>
                TÜR
              </Text>
              <View style={styles.genreRow}>
                {GENRES.map((g) => {
                  const selected = draft.genre === g;
                  return (
                    <Pressable
                      key={g}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setDraft((d) => (d ? { ...d, genre: g } : d));
                      }}
                      style={[
                        styles.chip,
                        { backgroundColor: selected ? colors.accent : colors.frame },
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={{ color: selected ? colors.onAccent : colors.textSecondary }}
                      >
                        {genreLabels[g]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            <Text variant="label" tone="tertiary" style={styles.sectionLabel}>
              {draft.phases.length} AŞAMA · {totalTasks} GÖREV
            </Text>

            <View style={styles.phaseList}>
              {draft.phases.map((phase, phaseIndex) => (
                <Animated.View
                  key={`${phase.type}-${phaseIndex}`}
                  entering={FadeInDown.springify().damping(16).stiffness(120).delay(phaseIndex * 80)}
                >
                  <Card style={styles.phaseCard}>
                    <View style={styles.phaseHead}>
                      <View style={[styles.numCircle, { backgroundColor: colors.accentSoft }]}>
                        <Text variant="bodyMedium" style={{ color: colors.accentOnSoft }}>
                          {String(phaseIndex + 1).padStart(2, '0')}
                        </Text>
                      </View>
                      <Text variant="bodyMedium" style={styles.phaseTitle} numberOfLines={1}>
                        {phaseTypeLabels[phase.type] ?? phase.type}
                      </Text>
                    </View>

                    {phase.tasks.map((task, taskIndex) => (
                      <View
                        key={taskIndex}
                        style={[styles.taskRow, { borderColor: colors.frame }]}
                      >
                        <View style={styles.taskFields}>
                          <Input
                            value={task.title}
                            onChangeText={(title) => updateTask(phaseIndex, taskIndex, { title })}
                            placeholder="Görev başlığı"
                          />
                          <View style={styles.gapSm} />
                          <Input
                            value={task.description ?? ''}
                            onChangeText={(description) =>
                              updateTask(phaseIndex, taskIndex, { description })
                            }
                            placeholder="Açıklama (opsiyonel)"
                          />
                        </View>
                        <Pressable
                          onPress={() => deleteTask(phaseIndex, taskIndex)}
                          hitSlop={10}
                          style={styles.delBtn}
                        >
                          <Text variant="bodyMedium" tone="accent">
                            ✕
                          </Text>
                        </Pressable>
                      </View>
                    ))}

                    <Button
                      label="+ Görev ekle"
                      variant="ghost"
                      onPress={() => addTask(phaseIndex)}
                    />
                  </Card>
                </Animated.View>
              ))}
            </View>

            <Text variant="caption" tone="tertiary" style={styles.note}>
              Görevleri burada düzenleyebilir, silebilir veya ekleyebilirsin. Boş başlıklı görevler
              kaydedilmez.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            {error ? (
              <Text variant="caption" tone="accent" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <Button
              label={confirm.isPending ? 'Oluşturuluyor…' : 'Onayla ve Oluştur'}
              onPress={() => confirm.mutate()}
              loading={confirm.isPending}
              disabled={!canConfirm}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  head: { marginBottom: spacing.xl },
  gap: { height: spacing.md },
  gapSm: { height: spacing.sm },
  genreLabel: { marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: 4 },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  sectionLabel: { marginBottom: spacing.md },
  phaseList: { gap: spacing.gap },
  phaseCard: { gap: spacing.md },
  phaseHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  numCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  phaseTitle: { flex: 1 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  taskFields: { flex: 1 },
  delBtn: { paddingTop: 14, paddingHorizontal: 4 },
  note: { textAlign: 'center', marginTop: spacing.xl, maxWidth: 320, alignSelf: 'center' },
  footer: { paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  error: { textAlign: 'center' },
});
