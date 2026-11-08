import { Redirect, Tabs } from 'expo-router';
import { Home, MessageCircle, Files } from 'lucide-react-native';
import { useApp } from '../../lib/app-state';
import { Banner, Loading, Screen } from '../../components/ui';
import { c, type } from '../../theme/tokens';
export default function TabLayout() {
  const { profile, connected } = useApp();
  if (profile === undefined && !connected)
    return (
      <Screen
        title="Your day is kept."
        subtitle="Reconnect to open your private records."
      >
        <Banner>
          We’ll reconnect automatically. Your drafts and pending entries stay on
          this device.
        </Banner>
      </Screen>
    );
  if (profile === undefined) return <Loading />;
  if (profile === null) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.forest,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: { ...type.label },
        tabBarStyle: {
          backgroundColor: c.screen,
          borderTopColor: c.line,
          paddingTop: 8,
          minHeight: 68,
        },
        sceneStyle: { backgroundColor: c.screen },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <Files color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
