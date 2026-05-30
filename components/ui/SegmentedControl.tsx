import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, useTheme } from '../../constants/theme';
import { Text } from './Text';

export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
}

/** Yumuşak köşeli sekme/filtre kontrolü. */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  scrollable,
}: Props<T>) {
  const { colors } = useTheme();

  const items = segments.map((s) => {
    const active = s.value === value;
    return (
      <Pressable
        key={s.value}
        onPress={() => {
          void Haptics.selectionAsync();
          onChange(s.value);
        }}
        style={[
          styles.item,
          { backgroundColor: active ? colors.accentSoft : 'transparent' },
        ]}
      >
        <Text
          variant="bodyMedium"
          style={{
            color: active ? colors.accentOnSoft : colors.textSecondary,
            fontSize: 13,
          }}
        >
          {s.label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items}
      </ScrollView>
    );
  }

  return <View style={[styles.row, { backgroundColor: colors.frame }]}>{items}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: radius.button,
    padding: 4,
    gap: 4,
  },
  scrollContent: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  item: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
});
