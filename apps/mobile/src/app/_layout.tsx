import React, { useEffect, useState } from 'react';
import { Stack, useRouter, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { ConvexReactClient, useConvexAuth } from 'convex/react';
import { ConvexAuthProvider, useAuthActions } from '@convex-dev/auth/react';
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
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (isAuthenticated) return;
    const timer = setTimeout(() => setError(true), 8000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, attempt]);
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      let live = true;
      void signIn('anonymous').catch(() => {
        if (live) setError(true);
      });
      return () => {
        live = false;
      };
    }
  }, [isLoading, isAuthenticated, signIn, attempt]);
  if (isLoading || !isAuthenticated)
    return error ? (
      <Screen title="Let’s reconnect">
        <Banner error>
          Your private session could not open. Check your connection and retry.
        </Banner>
        <Button
          title="Try again"
          onPress={() => {
            setError(false);
            setAttempt((a) => a + 1);
          }}
        />
      </Screen>
    ) : (
      <Loading label="Opening your private space…" />
    );
  return children;
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
      <SessionGate>
        <AppStateProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: c.screen },
            }}
          >
            <Stack.Screen name="(tabs)" />
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
        </AppStateProvider>
      </SessionGate>
    </ConvexAuthProvider>
  );
}
