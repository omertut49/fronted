import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LayoutGrid, ListChecks, Flag, User, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../constants/theme';

const ICONS: Record<string, LucideIcon> = {
  index: LayoutGrid,
  tasks: ListChecks,
  reports: Flag,
  profile: User,
};

/** tabBar prop tipini doğrudan Tabs bileşeninden türet (harici import gerekmez). */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Sadece ikonlu alt menü; seçili primary, diğerleri soluk; üstte ince hairline. */
function TabBar({ state, navigation }: TabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.bg,
          borderTopColor: colors.hairline,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const Icon = ICONS[route.name];
        if (!Icon) return null;
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            hitSlop={8}
            onPress={() => {
              void Haptics.selectionAsync();
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
          >
            <Icon
              size={24}
              color={focused ? colors.textPrimary : colors.textTertiary}
              strokeWidth={focused ? 2.4 : 2}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
