import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sparkles, Check } from 'lucide-react-native';
import {
  Screen,
  Text,
  Input,
  Button,
  PageHeader,
  Card,
  SegmentedControl,
} from '../../components/ui';
import { spacing, useTheme } from '../../constants/theme';
import { ideasApi, gamesApi } from '../../lib/services';
import { apiErrorMessage } from '../../lib/api';
import { genreLabels, phaseTypeLabels } from '../../lib/labels';
import { TASK_TEMPLATES, TEMPLATE_PHASE_ORDER } from '../../lib/templates';
import type { AiPhase, GameGenre, PhaseType } from '../../lib/types';

const MIN_LEN = 10;
const GENRES: GameGenre[] = ['action', 'rpg', 'puzzle', 'strategy', 'simulation', 'sports', 'other'];
type Mode = 'ai' | 'manual';

export default function NewProjectScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>('ai');

  return (
    <Screen padded>
      <PageHeader
        title="Yeni proje"
        subtitle={mode === 'ai' ? 'Yapay zekâ' : 'Manuel'}
        back
      />
      <View style={styles.toggle}>
        <SegmentedControl<Mode>
          segments={[
            { value: 'ai', label: 'Yapay zekâ' },
            { value: 'manual', label: 'Manuel' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      {mode === 'ai' ? (
        <AiForm colors={colors} />
      ) : (
        <ManualForm colors={colors} qc={qc} />
      )}
    </Screen>
  );
}

// ---------------- AI MODU ----------------
function AiForm({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (p: string) => ideasApi.generate(p),
    onSuccess: (data) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/games/roadmap', params: { sessionId: data.sessionId } });
    },
    onError: (e) => {
      setError(apiErrorMessage(e, 'Yol haritası oluşturulamadı.'));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const submit = () => {
    setError(null);
    if (prompt.trim().length < MIN_LEN) {
      setError(`Fikrini biraz daha açıkla (en az ${MIN_LEN} karakter).`);
      return;
    }
    mutation.mutate(prompt.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(450)}>
          <Card tone="frame" style={styles.hint}>
            <View style={styles.hintRow}>
              <Sparkles size={18} color={colors.accent} />
              <Text variant="bodyMedium" style={styles.hintTitle}>
                Fikrini anlat, gerisini bana bırak
              </Text>
            </View>
            <Text variant="caption" tone="secondary" style={styles.hintBody}>
              Tür, tema, atmosfer ve temel mekanikleri yazdıkça yol haritası o kadar isabetli olur.
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(450).delay(80)} style={styles.form}>
          <Input
            label="Oyun fikri"
            value={prompt}
            onChangeText={setPrompt}
            placeholder={
              'Örn: Bulut şehirlerde geçen, yerçekimini büküp düşmanları savuran bir 2D roguelike platform oyunu. Sıcak pastel görseller, kısa seanslar...'
            }
            multiline
            editable={!mutation.isPending}
          />
          {error ? (
            <Text variant="caption" tone="accent" style={styles.error}>
              {error}
            </Text>
          ) : null}
        </Animated.View>

        <View style={styles.submit}>
          <Button
            label={mutation.isPending ? 'Yol haritası oluşturuluyor…' : 'Yol Haritası Oluştur'}
            onPress={submit}
            loading={mutation.isPending}
            icon={!mutation.isPending ? <Sparkles size={18} color={colors.onAccent} /> : undefined}
          />
          {mutation.isPending ? (
            <Text variant="caption" tone="tertiary" style={styles.wait}>
              Yapay zekâ 7 aşamalı planı hazırlıyor, bu birkaç saniye sürebilir.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------- MANUEL MODU ----------------
function ManualForm({
  colors,
  qc,
}: {
  colors: ReturnType<typeof useTheme>['colors'];
  qc: ReturnType<typeof useQueryClient>;
}) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [genre, setGenre] = useState<GameGenre>('other');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  const buildPhases = (): AiPhase[] =>
    TEMPLATE_PHASE_ORDER.map((type) => {
      const picked = TASK_TEMPLATES[type].filter((t) => selected[`${type}::${t}`]);
      const own = (custom[type] ?? []).map((t) => t.trim()).filter(Boolean);
      const titles = [...picked, ...own];
      return {
        type,
        tasks: titles.map((t) => ({ title: t, priority: 'medium' as const })),
      };
    }).filter((p) => p.tasks.length > 0);

  const totalTasks = buildPhases().reduce((s, p) => s + p.tasks.length, 0);

  const mutation = useMutation({
    mutationFn: () =>
      gamesApi.create({
        title: title.trim(),
        description: desc.trim() || undefined,
        genre,
        phases: buildPhases(),
      }),
    onSuccess: (game) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void qc.invalidateQueries({ queryKey: ['games'] });
      router.replace(`/games/${game.id}`);
    },
    onError: (e) => {
      setError(apiErrorMessage(e, 'Proje oluşturulamadı.'));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const submit = () => {
    setError(null);
    if (title.trim().length === 0) {
      setError('Projeye bir ad ver.');
      return;
    }
    mutation.mutate();
  };

  const toggle = (key: string) => {
    void Haptics.selectionAsync();
    setSelected((s) => ({ ...s, [key]: !s[key] }));
  };

  const addCustom = (type: PhaseType) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustom((c) => ({ ...c, [type]: [...(c[type] ?? []), ''] }));
  };
  const updateCustom = (type: PhaseType, i: number, val: string) =>
    setCustom((c) => ({ ...c, [type]: (c[type] ?? []).map((t, idx) => (idx === i ? val : t)) }));
  const removeCustom = (type: PhaseType, i: number) =>
    setCustom((c) => ({ ...c, [type]: (c[type] ?? []).filter((_, idx) => idx !== i) }));

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input label="Proje adı" value={title} onChangeText={setTitle} placeholder="Oyununun adı" />
        <View style={styles.gap} />
        <Input
          label="Açıklama"
          value={desc}
          onChangeText={setDesc}
          placeholder="Kısa açıklama (opsiyonel)"
          multiline
        />

        <Text variant="label" tone="tertiary" style={styles.genreLabel}>
          TÜR
        </Text>
        <View style={styles.genreRow}>
          {GENRES.map((g) => {
            const sel = genre === g;
            return (
              <Pressable
                key={g}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setGenre(g);
                }}
                style={[styles.chip, { backgroundColor: sel ? colors.accent : colors.frame }]}
              >
                <Text
                  variant="caption"
                  style={{ color: sel ? colors.onAccent : colors.textSecondary }}
                >
                  {genreLabels[g]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text variant="label" tone="tertiary" style={styles.sectionLabel}>
          GÖREVLER · {totalTasks} SEÇİLİ
        </Text>
        <Text variant="caption" tone="tertiary" style={styles.helper}>
          Hazır görevleri seç ya da kendi görevini ekle. Hiç seçmezsen proje boş 7 aşamayla oluşur.
        </Text>

        <View style={styles.phaseList}>
          {TEMPLATE_PHASE_ORDER.map((type, pi) => (
            <Animated.View key={type} entering={FadeInDown.duration(350).delay(pi * 60)}>
              <Card style={styles.phaseCard}>
                <Text variant="bodyMedium">{phaseTypeLabels[type]}</Text>

                {TASK_TEMPLATES[type].map((t) => {
                  const key = `${type}::${t}`;
                  const sel = !!selected[key];
                  return (
                    <Pressable key={t} onPress={() => toggle(key)} style={styles.checkRow}>
                      <View
                        style={[
                          styles.box,
                          {
                            backgroundColor: sel ? colors.accent : 'transparent',
                            borderColor: sel ? colors.accent : colors.hairline,
                          },
                        ]}
                      >
                        {sel ? <Check size={14} color={colors.onAccent} /> : null}
                      </View>
                      <Text variant="body" style={styles.checkLabel}>
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}

                {(custom[type] ?? []).map((val, i) => (
                  <View key={`c-${i}`} style={styles.customRow}>
                    <View style={styles.flex}>
                      <Input
                        value={val}
                        onChangeText={(v) => updateCustom(type, i, v)}
                        placeholder="Kendi görevin"
                      />
                    </View>
                    <Pressable
                      onPress={() => removeCustom(type, i)}
                      hitSlop={10}
                      style={styles.delBtn}
                    >
                      <Text variant="bodyMedium" tone="accent">
                        ✕
                      </Text>
                    </Pressable>
                  </View>
                ))}

                <Button label="+ Görev ekle" variant="ghost" onPress={() => addCustom(type)} />
              </Card>
            </Animated.View>
          ))}
        </View>

        {error ? (
          <Text variant="caption" tone="accent" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <View style={styles.submit}>
          <Button
            label={mutation.isPending ? 'Oluşturuluyor…' : 'Projeyi Oluştur'}
            onPress={submit}
            loading={mutation.isPending}
            disabled={title.trim().length === 0}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  toggle: { marginBottom: spacing.lg },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  hint: { marginBottom: spacing.xl },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hintTitle: { flex: 1 },
  hintBody: { marginTop: 8, lineHeight: 19 },
  form: { gap: spacing.lg },
  gap: { height: spacing.md },
  genreLabel: { marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: 4 },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm },
  helper: { marginBottom: spacing.md, lineHeight: 18 },
  phaseList: { gap: spacing.gap },
  phaseCard: { gap: spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: { flex: 1 },
  customRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  delBtn: { paddingTop: 14, paddingHorizontal: 4 },
  error: { marginTop: spacing.md, marginLeft: 4 },
  submit: { marginTop: spacing.xl },
  wait: { textAlign: 'center', marginTop: spacing.md },
});
