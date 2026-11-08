import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { CONVEX_URL } from './constants';
import { AppState } from './lib/app-state';
import { Banner, Brand, Loading } from './components/ui';
import { App } from './App';
import { Authentication } from './features/auth';
import {
  IdentityProvider,
  useIdentity,
} from '../../mobile/src/lib/auth-session';
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
  const identity = useIdentity();
  if (identity.switching) return <Loading>{identity.switching}</Loading>;
  if (identity.loading) return <Loading />;
  if (!identity.authenticated || identity.account?.legacy)
    return <Authentication />;
  return (
    <AppState key={identity.account!.id}>
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
          <IdentityProvider>
            <PrivateSession />
          </IdentityProvider>
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
