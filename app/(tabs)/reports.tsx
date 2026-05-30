import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, Bug, Lightbulb, Flag } from 'lucide-react-native';
import {
  Screen,
  Text,
  PageHeader,
  Card,
  Badge,
  Input,
  Button,
  BottomSheet,
  SegmentedControl,
  Loading,
  EmptyState,
  ErrorState,
  type Segment,
} from '../../components/ui';
import { spacing, useTheme } from '../../constants/theme';
import { gamesApi, reportsApi } from '../../lib/services';
import { apiErrorMessage } from '../../lib/api';
import { reportStatusLabels, reportTypeLabels } from '../../lib/labels';
import { reportStatusSwatch } from '../../lib/statusColors';
import type { Report, ReportStatus, ReportType, MemberRole } from '../../lib/types';

type Filter = ReportStatus | 'all';

export default function ReportsScreen() {
  const { colors, scheme } = useTheme();
  const qc = useQueryClient();

  const reportsQuery = useQuery({ queryKey: ['reports'], queryFn: () => reportsApi.list() });
  const gamesQuery = useQuery({ queryKey: ['games'], queryFn: gamesApi.list });

  const roleByGame = useMemo(() => {
    const m = new Map<string, MemberRole | null>();
    for (const g of gamesQuery.data ?? []) m.set(g.id, g.myRole ?? null);
    return m;
  }, [gamesQuery.data]);

  const titleByGame = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of gamesQuery.data ?? []) m.set(g.id, g.title);
    return m;
  }, [gamesQuery.data]);

  const [filter, setFilter] = useState<Filter>('open');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);

  const filters: Segment<Filter>[] = [
    { value: 'open', label: 'Açık' },
    { value: 'pending_approval', label: 'Onay Bekliyor' },
    { value: 'resolved', label: 'Çözüldü' },
  ];

  const data = (reportsQuery.data ?? []).filter((r) => (filter === 'all' ? true : r.status === filter));

  return (
    <Screen padded>
      <PageHeader
        title="Raporlar"
        subtitle="Tüm projeler"
        right={
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setCreateOpen(true);
            }}
            hitSlop={8}
            style={[styles.add, { backgroundColor: colors.accent }]}
          >
            <Plus size={22} color={colors.onAccent} strokeWidth={2.4} />
          </Pressable>
        }
      />

      <View style={styles.filters}>
        <SegmentedControl segments={filters} value={filter} onChange={setFilter} />
      </View>

      {reportsQuery.isLoading ? (
        <Loading />
      ) : reportsQuery.isError ? (
        <ErrorState message={apiErrorMessage(reportsQuery.error)} onRetry={() => reportsQuery.refetch()} />
      ) : !data.length ? (
        <EmptyState
          icon={<Flag size={48} color={colors.textTertiary} strokeWidth={1.5} />}
          title="Rapor yok"
          description="Bu filtrede gösterilecek rapor bulunmuyor."
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={reportsQuery.isRefetching}
              onRefresh={() => reportsQuery.refetch()}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item, index }) => {
            const sw = reportStatusSwatch(scheme, item.status);
            return (
              <Animated.View entering={FadeInDown.duration(320).delay(index * 40)}>
                <Card onPress={() => setSelected(item)}>
                  <View style={styles.reportTop}>
                    {item.type === 'bug' ? (
                      <Bug size={18} color={colors.textSecondary} />
                    ) : (
                      <Lightbulb size={18} color={colors.textSecondary} />
                    )}
                    <Text variant="bodyMedium" style={styles.reportTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Badge label={reportStatusLabels[item.status]} variant="custom" bg={sw.bg} fg={sw.fg} />
                  </View>
                  <Text variant="caption" tone="tertiary" style={styles.reportMeta}>
                    {titleByGame.get(item.gameId) ?? 'Proje'} · {reportTypeLabels[item.type]}
                  </Text>
                </Card>
              </Animated.View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.gap }} />}
        />
      )}

      <CreateReportSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        games={(gamesQuery.data ?? []).map((g) => ({ id: g.id, title: g.title }))}
        onCreated={() => {
          void qc.invalidateQueries({ queryKey: ['reports'] });
          setCreateOpen(false);
        }}
      />

      <ReportDetailSheet
        report={selected}
        isAdmin={selected ? roleByGame.get(selected.gameId) === 'admin' : false}
        onClose={() => setSelected(null)}
        onChanged={() => {
          void qc.invalidateQueries({ queryKey: ['reports'] });
          setSelected(null);
        }}
      />
    </Screen>
  );
}

function CreateReportSheet({
  visible,
  onClose,
  games,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  games: { id: string; title: string }[];
  onCreated: () => void;
}) {
  const [gameId, setGameId] = useState<string | null>(null);
  const [type, setType] = useState<ReportType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      reportsApi.create({ title: title.trim(), description: description.trim(), gameId: gameId!, type }),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTitle('');
      setDescription('');
      setType('bug');
      setGameId(null);
      setError(null);
      onCreated();
    },
    onError: (e) => setError(apiErrorMessage(e, 'Rapor oluşturulamadı.')),
  });

  const submit = () => {
    setError(null);
    if (!gameId) return setError('Bir proje seç.');
    if (!title.trim()) return setError('Başlık gerekli.');
    if (!description.trim()) return setError('Açıklama gerekli.');
    create.mutate();
  };

  const typeSegs: Segment<ReportType>[] = [
    { value: 'bug', label: '🐞 Hata' },
    { value: 'suggestion', label: '💡 Öneri' },
  ];
  const gameSegs: Segment<string>[] = games.map((g) => ({ value: g.id, label: g.title }));

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text variant="heading" style={styles.sheetTitle}>
        Yeni rapor
      </Text>
      <View style={styles.sheetForm}>
        {gameSegs.length > 0 ? (
          <View>
            <Text variant="label" tone="tertiary" style={styles.fieldLabel}>
              PROJE
            </Text>
            <SegmentedControl scrollable segments={gameSegs} value={gameId ?? ''} onChange={setGameId} />
          </View>
        ) : (
          <Text variant="body" tone="secondary">
            Önce bir projeye üye olmalısın.
          </Text>
        )}

        <View>
          <Text variant="label" tone="tertiary" style={styles.fieldLabel}>
            TÜR
          </Text>
          <SegmentedControl segments={typeSegs} value={type} onChange={setType} />
        </View>

        <Input label="Başlık" value={title} onChangeText={setTitle} placeholder="Kısa başlık" />
        <Input
          label="Açıklama"
          value={description}
          onChangeText={setDescription}
          placeholder="Detayları yaz"
          multiline
          style={styles.descInput}
        />
        {error ? (
          <Text variant="caption" tone="accent">
            {error}
          </Text>
        ) : null}
        <Button label="Gönder" onPress={submit} loading={create.isPending} />
      </View>
    </BottomSheet>
  );
}

function ReportDetailSheet({
  report,
  isAdmin,
  onClose,
  onChanged,
}: {
  report: Report | null;
  isAdmin: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { scheme } = useTheme();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resolve = useMutation({
    mutationFn: () => reportsApi.resolve(report!.id, note.trim()),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNote('');
      onChanged();
    },
    onError: (e) => setError(apiErrorMessage(e, 'İşlem başarısız.')),
  });
  const approve = useMutation({
    mutationFn: () => reportsApi.approve(report!.id),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onChanged();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });
  const reject = useMutation({
    mutationFn: () => reportsApi.reject(report!.id),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onChanged();
    },
    onError: (e) => setError(apiErrorMessage(e)),
  });

  if (!report) return <BottomSheet visible={false} onClose={onClose} children={null} />;

  const sw = reportStatusSwatch(scheme, report.status);

  return (
    <BottomSheet visible={!!report} onClose={onClose}>
      <View style={styles.detailHead}>
        <Badge label={reportTypeLabels[report.type]} variant="neutral" />
        <Badge label={reportStatusLabels[report.status]} variant="custom" bg={sw.bg} fg={sw.fg} />
      </View>
      <Text variant="heading" style={styles.detailTitle}>
        {report.title}
      </Text>
      <Text variant="body" tone="secondary" style={styles.detailDesc}>
        {report.description}
      </Text>

      {report.player ? (
        <Text variant="caption" tone="tertiary" style={styles.detailMeta}>
          Açan: {report.player.username}
        </Text>
      ) : null}
      {report.resolvedBy ? (
        <Text variant="caption" tone="tertiary">
          Çözen: {report.resolvedBy.username}
        </Text>
      ) : null}
      {report.resolutionNote ? (
        <Text variant="body" style={styles.resolutionNote}>
          “{report.resolutionNote}”
        </Text>
      ) : null}

      {error ? (
        <Text variant="caption" tone="accent" style={styles.detailError}>
          {error}
        </Text>
      ) : null}

      {/* Aksiyonlar */}
      {report.status === 'open' ? (
        <View style={styles.actionBlock}>
          <Input
            label="Çözüm notu"
            value={note}
            onChangeText={setNote}
            placeholder="Nasıl çözüldü?"
            multiline
            style={styles.descInput}
          />
          <Button
            label="Çözüme Gönder"
            onPress={() => {
              if (!note.trim()) return setError('Çözüm notu gerekli.');
              resolve.mutate();
            }}
            loading={resolve.isPending}
          />
        </View>
      ) : null}

      {report.status === 'pending_approval' && isAdmin ? (
        <View style={styles.approveRow}>
          <View style={styles.approveCol}>
            <Button label="Onayla" onPress={() => approve.mutate()} loading={approve.isPending} />
          </View>
          <View style={styles.approveCol}>
            <Button label="Reddet" variant="secondary" onPress={() => reject.mutate()} loading={reject.isPending} />
          </View>
        </View>
      ) : null}

      {report.status === 'pending_approval' && !isAdmin ? (
        <Text variant="caption" tone="tertiary" style={styles.waitNote}>
          Yönetici onayı bekleniyor.
        </Text>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  add: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  filters: { marginBottom: spacing.lg, marginTop: spacing.xs },
  list: { paddingBottom: spacing.xxl },
  reportTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reportTitle: { flex: 1 },
  reportMeta: { marginTop: spacing.sm },
  sheetTitle: { marginBottom: spacing.lg },
  sheetForm: { gap: spacing.lg },
  fieldLabel: { marginBottom: spacing.md, marginLeft: 4 },
  descInput: { minHeight: 90 },
  detailHead: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  detailTitle: { marginBottom: spacing.sm },
  detailDesc: { lineHeight: 21, marginBottom: spacing.lg },
  detailMeta: { marginTop: 2 },
  resolutionNote: { marginTop: spacing.md, fontStyle: 'italic' },
  detailError: { marginTop: spacing.md },
  actionBlock: { marginTop: spacing.xl, gap: spacing.lg },
  approveRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  approveCol: { flex: 1 },
  waitNote: { marginTop: spacing.xl, textAlign: 'center' },
});
