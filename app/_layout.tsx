import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
} from '@expo-google-fonts/outfit';
import { ThemeProvider, useTheme } from '../constants/theme';
import { useAuth } from '../lib/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

/** Oturum durumuna göre (auth) ↔ (tabs) yönlendirmesi. */
function useAuthGate(ready: boolean) {
  const { accessToken, hydrated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !hydrated) return;
    const inAuthGroup = segments[0] === '(auth)';
    const onAbout = segments[0] === 'about';

    if (!accessToken && !inAuthGroup && !onAbout) {
      router.replace('/(auth)/login');
    } else if (accessToken && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [accessToken, hydrated, ready, segments, router]);
}

function RootNavigator() {
  const { colors, ready: themeReady } = useTheme();
  const hydrate = useAuth((s) => s.hydrate);
  const hydrated = useAuth((s) => s.hydrated);

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const ready = fontsLoaded && themeReady && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useAuthGate(ready);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="games/new" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="games/roadmap" />
      <Stack.Screen name="games/[id]/index" />
      <Stack.Screen name="games/[id]/members" />
      <Stack.Screen name="tasks/[id]" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <Stack.Screen name="about" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
