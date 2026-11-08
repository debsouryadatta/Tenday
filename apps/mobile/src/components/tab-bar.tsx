import type React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Tabs } from 'expo-router';
import {
  FileText,
  House,
  Plus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { Text } from './ui';
import { AssistantMark } from './assistant-mark';
import { c, layout } from '../theme/tokens';

type TabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

export const TAB_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  index: { icon: House, label: 'Today' },
  assistant: { icon: Sparkles, label: 'Assistant' },
  reports: { icon: FileText, label: 'Reports' },
};

/**
 * Bottom navigation: three destinations on the left and a raised ink
 * "log a meal" action on the right, one tap from every tab.
 */
export function TabBar({ state, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.tabs} accessibilityRole="tablist">
          {state.routes.map((route, index) => {
            const meta = TAB_ICONS[route.name];
            if (!meta) return null;
            const focused = state.index === index;
            const Icon = meta.icon;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={meta.label}
                accessibilityState={{ selected: focused }}
                onPress={() => {
                  if (!focused) navigateToTab(route.key);
                }}
                style={({ pressed }) => [
                  styles.tab,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                {route.name === 'assistant' ? (
                  <AssistantMark
                    kind={focused ? 'full' : 'line'}
                    size={26}
                    color={c.muted}
                    halo={c.screen}
                  />
                ) : (
                  <Icon
                    size={23}
                    color={focused ? c.ink : c.muted}
                    strokeWidth={focused ? 2.4 : 1.9}
                  />
                )}
                <Text
                  variant="label"
                  color={focused ? c.ink : c.muted}
                  style={{ fontFamily: focused ? 'Inter_700Bold' : 'Inter_500Medium' }}
                >
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log a meal"
          onPress={() => router.push('/meal')}
          style={({ pressed }) => [
            styles.fab,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Plus size={24} color={c.lime} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}

/** Floating log action used by the full-screen (no tab bar) layout. */
export function FloatingLog() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Log a meal"
      onPress={() => router.push('/meal')}
      style={({ pressed }) => [
        styles.floating,
        {
          bottom: Math.max(insets.bottom, 12) + 12,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <Plus size={21} color={c.lime} strokeWidth={2.6} />
      <Text variant="strong" color={c.onInk}>
        Log a meal
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: c.screen,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: c.lineStrong,
    paddingTop: 8,
  },
  inner: {
    width: '100%',
    maxWidth: layout.maxContent,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  tabs: { flex: 1, flexDirection: 'row' },
  tab: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: c.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    marginRight: 6,
    shadowColor: c.ink,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  floating: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 56,
    paddingHorizontal: 26,
    borderRadius: 28,
    backgroundColor: c.ink,
    shadowColor: c.ink,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
