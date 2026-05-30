import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Text, Input, Button } from '../../components/ui';
import { useTheme, spacing } from '../../constants/theme';
import { authApi } from '../../lib/services';
import { apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/store';

export default function LoginScreen() {
  const { colors } = useTheme();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      await setSession(res);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (e) {
      setError(apiErrorMessage(e, 'Giriş başarısız.'));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
            <Text variant="label" tone="tertiary">
              GAMEPM
            </Text>
            <Text variant="title" style={styles.title}>
              Tekrar hoş geldin
            </Text>
            <Text variant="body" tone="secondary">
              Oyun projelerini yönetmeye devam et.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.form}>
            <Input
              label="E-posta"
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@studyo.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              label="Şifre"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            {error ? (
              <Text variant="caption" tone="accent" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <View style={styles.submit}>
              <Button label="Giriş Yap" onPress={submit} loading={loading} />
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <View style={styles.registerRow}>
              <Text variant="body" tone="secondary">
                Hesabın yok mu?{' '}
              </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text variant="bodyMedium" tone="accent">
                    Kayıt ol
                  </Text>
                </Pressable>
              </Link>
            </View>

            <Pressable onPress={() => router.push('/about')} style={styles.about}>
              <Text variant="label" tone="tertiary" style={{ color: colors.textTertiary }}>
                NYSA TARAFINDAN · HAKKINDA
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xxl },
  hero: { marginBottom: spacing.xxl, gap: 6 },
  title: { marginTop: 4 },
  form: { gap: spacing.lg },
  error: { marginLeft: 4 },
  submit: { marginTop: spacing.sm },
  footer: { marginTop: spacing.xxl, alignItems: 'center', gap: spacing.xl },
  registerRow: { flexDirection: 'row', alignItems: 'center' },
  about: { padding: spacing.sm },
});
