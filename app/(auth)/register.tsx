import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Text, Input, Button, PageHeader } from '../../components/ui';
import { spacing } from '../../constants/theme';
import { authApi } from '../../lib/services';
import { apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/store';

export default function RegisterScreen() {
  const setSession = useAuth((s) => s.setSession);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (username.trim().length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalı.');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      await setSession(res);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (e) {
      setError(apiErrorMessage(e, 'Kayıt başarısız.'));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded>
      <PageHeader title="Hesap oluştur" back />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(450)} style={styles.intro}>
            <Text variant="body" tone="secondary">
              Stüdyona katıl, fikrini yapay zekâ ile yol haritasına dönüştür.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(450).delay(80)} style={styles.form}>
            <Input
              label="Kullanıcı adı"
              value={username}
              onChangeText={setUsername}
              placeholder="oyuncu_adi"
              autoCapitalize="none"
            />
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
              placeholder="En az 6 karakter"
              secureTextEntry
            />
            {error ? (
              <Text variant="caption" tone="accent" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <View style={styles.submit}>
              <Button label="Kayıt Ol" onPress={submit} loading={loading} />
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <Text variant="body" tone="secondary">
              Zaten hesabın var mı?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text variant="bodyMedium" tone="accent">
                  Giriş yap
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingVertical: spacing.lg },
  intro: { marginBottom: spacing.xl },
  form: { gap: spacing.lg },
  error: { marginLeft: 4 },
  submit: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl },
});
