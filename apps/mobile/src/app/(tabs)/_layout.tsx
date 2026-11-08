import { Redirect, Tabs } from 'expo-router';
import { WifiOff } from 'lucide-react-native';
import { useApp } from '../../lib/app-state';
import { Empty, Loading, Screen } from '../../components/ui';
import { TabBar } from '../../components/tab-bar';
import { NAV_MODE } from '../../constants';
import { c } from '../../theme/tokens';
export default function TabLayout() {
  const { profile, connected } = useApp();
  if (profile === undefined && !connected)
    return (
      <Screen>
        <Empty
          icon={WifiOff}
          title="Your day is kept"
          body="Reconnect to open your private records. Drafts and pending entries stay on this device."
        />
      </Screen>
    );
  if (profile === undefined) return <Loading />;
  if (profile === null) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      tabBar={NAV_MODE === 'tabs' ? (props) => <TabBar {...props} /> : () => null}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.screen },
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="assistant" options={{ title: 'Assistant' }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
    </Tabs>
  );
}
