import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { Screen, Text, Input, Button, PageHeader, Card } from '../../components/ui';
import { spacing, useTheme } from '../../constants/theme';
import { ideasApi } from '../../lib/services';
import { apiErrorMessage } from '../../lib/api';

const MIN_LEN = 10;

export default function NewProjectScreen() {
  const { colors } = useTheme();
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
    <Screen padded>
      <PageHeader title="Yeni proje" subtitle="Yapay zekâ" back />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingVertical: spacing.lg, paddingBottom: spacing.xxl },
  hint: { marginBottom: spacing.xl },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hintTitle: { flex: 1 },
  hintBody: { marginTop: 8, lineHeight: 19 },
  form: { gap: spacing.lg },
  error: { marginLeft: 4 },
  submit: { marginTop: spacing.xl },
  wait: { textAlign: 'center', marginTop: spacing.md },
});
