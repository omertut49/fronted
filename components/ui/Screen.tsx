import { type ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../constants/theme';

interface Props {
  children: ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  padded?: boolean;
}

/** Tüm ekranlar için zemin + güvenli alan sarmalayıcı. */
export function Screen({ children, edges = ['top'], style, padded }: Props) {
  const { colors, scheme } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.inner, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: 20 },
});
