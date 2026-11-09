import React, { useEffect } from 'react';
import { hideSplash } from '../lib/boot';
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
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { AppStateProvider } from '../lib/app-state';
import { Banner, Button, Loading, Screen } from '../components/ui';
import { c } from '../theme/tokens';
import { CONVEX_URL } from '../constants';
import { Authentication } from '../features/auth';
import { IdentityProvider, useIdentity } from '../lib/auth-session';

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const router = useRouter();
  useEffect(() => hideSplash(), []);
  return (
    <Screen
      eyebrow="Something went wrong"
      title="Let’s get you back"
      subtitle="This page couldn’t open. Your saved records and drafts are safe."
      footer={
        <>
          <Button title="Try again" onPress={retry} />
          <Button
            title="Back to Today"
            variant="ghost"
            onPress={() => router.replace('/')}
          />
        </>
      }
    >
      {null}
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
/** Hides the native splash once the first real screen has committed. */
function Ready() {
  useEffect(() => hideSplash(), []);
  return null;
}
function SessionGate({ children }: { children: React.ReactNode }) {
  const identity = useIdentity();
  if (identity.switching) return <Loading label={identity.switching} />;
  if (identity.loading) return <Loading />;
  if (!identity.authenticated || identity.account?.legacy)
    return (
      <>
        <Authentication />
        <Ready />
      </>
    );
  return (
    <AppStateProvider key={identity.account!.id}>
      {children}
      <Ready />
    </AppStateProvider>
  );
}
export default function Root() {
  const [fonts, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
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
        eyebrow="Secure connection needed"
        title="Open Tenday securely"
        subtitle="Use the HTTPS preview or the Android app before entering personal information."
      >
        <Banner tone="warning">
          This address isn’t using a secure connection, so your private space
          hasn’t been opened here.
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
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="account"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: [1],
                sheetGrabberVisible: true,
                sheetCornerRadius: 32,
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
                sheetCornerRadius: 32,
              }}
            />
            <Stack.Screen
              name="goal"
              options={{
                presentation: Platform.OS === 'web' ? 'modal' : 'formSheet',
                sheetAllowedDetents: [1],
                sheetGrabberVisible: true,
                sheetCornerRadius: 32,
              }}
            />
            <Stack.Screen
              name="report/new"
              options={{
                presentation: Platform.OS === 'web' ? 'modal' : 'formSheet',
                sheetAllowedDetents: [1],
                sheetGrabberVisible: true,
                sheetCornerRadius: 32,
              }}
            />
          </Stack>
        </SessionGate>
      </IdentityProvider>
    </ConvexAuthProvider>
  );
}
