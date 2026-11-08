import React from 'react';
import { Stack, useRouter, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import * as SecureStore from 'expo-secure-store';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { AppStateProvider } from '../lib/app-state';
import { Banner, Button, Loading, Screen } from '../components/ui';
import { c } from '../theme/tokens';
import { CONVEX_URL } from '../constants';
import { Authentication } from '../features/auth';
import { IdentityProvider, useIdentity } from '../lib/auth-session';

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const router = useRouter();
  return (
    <Screen
      title="Let’s get you back."
      subtitle="This page could not open. Your confirmed records and local drafts are kept."
    >
      <Button title="Try again" onPress={retry} />
      <Button
        title="Back to Today"
        variant="secondary"
        onPress={() => router.replace('/')}
      />
    </Screen>
  );
}

const convex = new ConvexReactClient(CONVEX_URL);
const storage =
  Platform.OS === 'web'
    ? undefined
    : {
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      };
function SessionGate({ children }: { children: React.ReactNode }) {
  const identity = useIdentity();
  if (identity.switching) return <Loading label={identity.switching} />;
  if (identity.loading) return <Loading />;
  if (!identity.authenticated || identity.account?.legacy)
    return <Authentication />;
  return (
    <AppStateProvider key={identity.account!.id}>{children}</AppStateProvider>
  );
}
export default function Root() {
  const [fonts, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!fonts && !fontError) return <Loading />;
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location.protocol !== 'https:' &&
    !['localhost', '127.0.0.1', '10.0.2.2'].includes(window.location.hostname)
  ) {
    return (
      <Screen
        title="Open Tenday securely."
        subtitle="Use the HTTPS preview or Android app before entering personal information."
      >
        <Banner>
          This web address is not using a secure connection. Your private space
          has not been opened here.
        </Banner>
      </Screen>
    );
  }
  return (
    <ConvexAuthProvider client={convex} storage={storage}>
      <StatusBar style="dark" />
      <IdentityProvider>
        <SessionGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: c.screen },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="account"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: [1],
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen
              name="onboarding"
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="meal"
              options={{
                presentation: Platform.OS === 'web' ? 'modal' : 'formSheet',
                sheetAllowedDetents: [1],
                sheetGrabberVisible: true,
                sheetCornerRadius: 28,
              }}
            />
            <Stack.Screen
              name="goal"
              options={{
                presentation: Platform.OS === 'web' ? 'modal' : 'formSheet',
                sheetAllowedDetents: [1],
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen
              name="report/new"
              options={{
                presentation: Platform.OS === 'web' ? 'modal' : 'formSheet',
                sheetAllowedDetents: [1],
                sheetGrabberVisible: true,
              }}
            />
          </Stack>
        </SessionGate>
      </IdentityProvider>
    </ConvexAuthProvider>
  );
}
