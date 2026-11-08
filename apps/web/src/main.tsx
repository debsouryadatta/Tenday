import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexReactClient, useConvexAuth } from 'convex/react';
import { ConvexAuthProvider, useAuthActions } from '@convex-dev/auth/react';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { CONVEX_URL } from './constants';
import { AppState } from './lib/app-state';
import { Banner, Brand, Button, Loading } from './components/ui';
import { App } from './App';
import { c, space, radius } from '../../mobile/src/theme/tokens';
import './styles.css';
for (const [key, value] of Object.entries(c))
  document.documentElement.style.setProperty(`--${key}`, value);
for (const [key, value] of Object.entries(space))
  document.documentElement.style.setProperty(`--space-${key}`, `${value}px`);
for (const [key, value] of Object.entries(radius))
  document.documentElement.style.setProperty(`--radius-${key}`, `${value}px`);
const client = new ConvexReactClient(CONVEX_URL);
function PrivateSession() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const signing = useRef(false);
  const [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (isAuthenticated) return;
    const t = setTimeout(() => setError(true), 8000);
    return () => clearTimeout(t);
  }, [isAuthenticated, attempt]);
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !signing.current) {
      signing.current = true;
      void signIn('anonymous').catch(() => setError(true));
    }
  }, [isLoading, isAuthenticated, signIn, attempt]);
  if (!isAuthenticated)
    return (
      <div className="session-screen">
        <Brand />
        {error ? (
          <>
            <h1>Let’s reconnect.</h1>
            <Banner error>
              Your private session could not open. Check your connection and
              retry.
            </Banner>
            <Button
              onClick={() => {
                signing.current = false;
                setError(false);
                setAttempt((v) => v + 1);
              }}
            >
              Try again
            </Button>
          </>
        ) : (
          <Loading />
        )}
      </div>
    );
  return (
    <AppState>
      <App />
    </AppState>
  );
}
const secure =
  location.protocol === 'https:' ||
  ['localhost', '127.0.0.1', '10.0.2.2', '[::1]'].includes(location.hostname);
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}
    >
      {secure ? (
        <ConvexAuthProvider client={client}>
          <PrivateSession />
        </ConvexAuthProvider>
      ) : (
        <div className="session-screen">
          <Brand />
          <h1>Open Tenday securely.</h1>
          <Banner>
            Use HTTPS or localhost before entering personal information.
          </Banner>
        </div>
      )}
    </BrowserRouter>
  </React.StrictMode>,
);
