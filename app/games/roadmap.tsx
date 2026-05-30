import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Screen, Text, Button, PageHeader, Card, Badge, Loading, ErrorState } from '../../components/ui';
import { spacing, useTheme } from '../../constants/theme';
import { ideasApi } from '../../lib/services';
import { apiErrorMessage } from '../../lib/api';
import { phaseTypeLabels, genreLabels } from '../../lib/labels';
import type { PhaseType, GameGenre } from '../../lib/types';

const PHASE_ORDER: PhaseType[] = [
  'concept_design',
  'prototype',
  'art_visual',
  'production',
  'test_balance',
  'polish',
  'release',
];

export default function RoadmapScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['idea-session', sessionId],
    queryFn: () => ideasApi.getSession(sessionId),
    enabled: !!sessionId,
  });

  const confirm = useMutation({
    mutationFn: () => ideasApi.confirm(sessionId),
    onSuccess: (data) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void qc.invalidateQueries({ queryKey: ['games'] });
      router.replace(`/games/${data.gameId}`);
    },
    onError: (e) => setError(apiErrorMessage(e, 'Proje oluşturulamadı.')),
  });

  const plan = query.data?.plan ?? null;

  const phases = plan
    ? [...plan.phases].sort(
        (a, b) => PHASE_ORDER.indexOf(a.type) - PHASE_ORDER.indexOf(b.type),
      )
    : [];

  return (
    <Screen padded>
      <PageHeader title="Yol haritası" subtitle="Yapay zekâ üretti" back />

      {query.isLoading ? (
        <Loading />
      ) : query.isError || !plan ? (
        <ErrorState
          message={query.isError ? apiErrorMessage(query.error) : 'Plan bulunamadı.'}
          onRetry={() => query.refetch()}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeIn.duration(400)} style={styles.head}>
              <Text variant="title">{plan.projectName}</Text>
              {plan.genre ? (
                <View style={styles.genre}>
                  <Badge label={genreLabels[plan.genre as GameGenre] ?? plan.genre} variant="accent" />
                </View>
              ) : null}
              <Text variant="body" tone="secondary" style={styles.desc}>
                {plan.projectDescription}
              </Text>
            </Animated.View>

            <Text variant="label" tone="tertiary" style={styles.sectionLabel}>
              {phases.length} AŞAMA
            </Text>

            <View style={styles.phaseList}>
              {phases.map((phase, index) => (
                <Animated.View
                  key={`${phase.type}-${index}`}
                  entering={FadeInDown.springify().damping(16).stiffness(120).delay(index * 110)}
                >
                  <Card style={styles.phaseCard}>
                    <View style={[styles.numCircle, { backgroundColor: colors.accentSoft }]}>
                      <Text variant="bodyMedium" style={{ color: colors.accentOnSoft }}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                    </View>
                    <View style={styles.phaseInfo}>
                      <Text variant="bodyMedium" numberOfLines={1}>
                        {phaseTypeLabels[phase.type] ?? phase.type}
                      </Text>
                      <Text variant="caption" tone="tertiary" style={styles.taskCount}>
                        {phase.tasks?.length ?? 0} görev
                      </Text>
                    </View>
                  </Card>
                </Animated.View>
              ))}
            </View>

            <Text variant="caption" tone="tertiary" style={styles.note}>
              Bu bir önizlemedir. Onayladıktan sonra görevleri panoda düzenleyebilirsin.
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
  genre: { marginTop: spacing.md, flexDirection: 'row' },
  desc: { marginTop: spacing.md, lineHeight: 21 },
  sectionLabel: { marginBottom: spacing.md },
  phaseList: { gap: spacing.gap },
  phaseCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  numCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  phaseInfo: { flex: 1 },
  taskCount: { marginTop: 3 },
  note: { textAlign: 'center', marginTop: spacing.xl, maxWidth: 300, alignSelf: 'center' },
  footer: { paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  error: { textAlign: 'center' },
});
