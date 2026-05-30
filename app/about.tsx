import { Linking, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowUpRight, Mail } from 'lucide-react-native';
import { Screen, Text, PageHeader, Button } from '../components/ui';
import { spacing, useTheme } from '../constants/theme';

const SITE = 'https://nysa.tr';
const CONTACT = 'mailto:merhaba@nysa.tr';

export default function AboutScreen() {
  const { colors } = useTheme();

  const open = (url: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(url);
  };

  return (
    <Screen padded>
      <PageHeader title="" back />
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text variant="label" tone="tertiary">
            NYSA
          </Text>
          <Text style={[styles.wordmark, { color: colors.textPrimary }]}>nysa</Text>
          <Text variant="title" tone="accent" style={styles.slogan}>
            Alışılmışın dışında.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(120)}>
          <Text variant="body" tone="secondary" style={styles.intro}>
            Web, mobil, oyun, yapay zekâ, marka ve etkinlik — fikrinizden lansmana kadar tek çatı
            altında. GamePM, oyun stüdyolarının fikirden yayına giden yolu yapay zekâ ile
            planlaması için tasarlandı.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(220)} style={styles.actions}>
          <Button
            label="nysa.tr"
            icon={<ArrowUpRight size={18} color={colors.onAccent} />}
            onPress={() => open(SITE)}
          />
          <Button
            label="İletişime geç"
            variant="secondary"
            icon={<Mail size={18} color={colors.textPrimary} />}
            onPress={() => open(CONTACT)}
          />
        </Animated.View>
      </View>

      <Text variant="label" tone="tertiary" style={styles.footer}>
        GAMEPM · NYSA TARAFINDAN
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', gap: spacing.xl },
  wordmark: { fontSize: 64, fontFamily: 'Outfit_500Medium', letterSpacing: -2, marginTop: spacing.sm },
  slogan: { marginTop: spacing.sm },
  intro: { lineHeight: 23 },
  actions: { gap: spacing.md, marginTop: spacing.lg },
  footer: { textAlign: 'center', paddingVertical: spacing.xl },
});
