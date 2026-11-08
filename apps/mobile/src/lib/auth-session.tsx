// Platform-independent session lifecycle, shared with the Vite client.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuthActions, useAuthToken } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { localDay, type DemoSlug } from '@tenday/domain';
import { api } from './backend';
export type Account = FunctionReturnType<typeof api.records.session>;
type Provider = 'password' | 'demo';
type Request = {
  provider?: Provider;
  params: Record<string, string>;
  resolve(): void;
  reject(error: Error): void;
  started?: boolean;
};
type Identity = {
  account: Account | undefined;
  authenticated: boolean;
  loading: boolean;
  switching: string;
  error: string;
  authenticate(
    provider: Provider,
    params: Record<string, string>,
  ): Promise<void>;
  switchDemo(slug: DemoSlug): Promise<void>;
  leave(): Promise<void>;
};
const Context = createContext<Identity | null>(null);
export function IdentityProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const token = useAuthToken();
  const account = useQuery(api.records.session, isAuthenticated ? {} : 'skip');
  const { signIn, signOut } = useAuthActions();
  const [switching, setSwitching] = useState(''),
    [error, setError] = useState('');
  const [phase, setPhase] = useState<
    'idle' | 'out' | 'waitingOut' | 'in' | 'waitingIn'
  >('idle');
  const request = useRef<Request | null>(null);
  const finish = useCallback((failure?: Error) => {
    const task = request.current;
    request.current = null;
    setPhase('idle');
    setSwitching('');
    if (failure) {
      setError(
        'The account could not open. Check your connection and choose it again.',
      );
      task?.reject(failure);
    } else task?.resolve();
  }, []);
  function transition(
    provider?: Provider,
    params: Record<string, string> = {},
  ): Promise<void> {
    if (request.current)
      return Promise.reject(new Error('A profile is already opening.'));
    setError('');
    setSwitching(
      provider === 'demo'
        ? 'Opening your demo profile…'
        : provider
          ? 'Opening your account…'
          : 'Signing out…',
    );
    setPhase('out');
    return new Promise<void>((resolve, reject) => {
      request.current = { provider, params, resolve, reject };
      void signOut()
        .then(() => setPhase('waitingOut'))
        .catch(() => finish(new Error('Sign-out could not finish.')));
    });
  }
  // Sign-out updates React state before Convex has cleared its transport auth.
  // Start the next sign-in only after the signed-out render and effect cleanup;
  // otherwise the old session's refresh/cleanup can erase the newly issued token.
  useEffect(() => {
    if (
      phase !== 'waitingOut' ||
      isAuthenticated ||
      isLoading ||
      token !== null
    )
      return;
    const task = request.current;
    if (!task || task.started) return;
    if (!task.provider) {
      finish();
      return;
    }
    task.started = true;
    setPhase('in');
    void signIn(task.provider, task.params)
      .then((result) => {
        if (!result.signingIn) {
          finish(new Error('Sign-in did not issue a session.'));
          return;
        }
        setPhase('waitingIn');
      })
      .catch(() => finish(new Error('Sign-in could not finish.')));
  }, [phase, isAuthenticated, isLoading, token, signIn, finish]);
  useEffect(() => {
    if (phase !== 'waitingIn' || !isAuthenticated || !account) return;
    const task = request.current;
    const matches =
      task?.provider === 'demo'
        ? account.demo === task.params.profile
        : !account.demo && !account.legacy;
    if (matches) finish();
  }, [phase, isAuthenticated, account, finish]);
  async function authenticate(
    provider: Provider,
    params: Record<string, string>,
  ) {
    setError('');
    if (isAuthenticated || token !== null || request.current) {
      await transition(provider, params);
      return;
    }
    const result = await signIn(provider, params);
    if (!result.signingIn) throw new Error('Sign-in did not issue a session.');
  }
  return (
    <Context.Provider
      value={{
        account,
        authenticated: isAuthenticated,
        loading:
          isLoading ||
          (token !== null && !isAuthenticated) ||
          (isAuthenticated && !account),
        switching,
        error,
        authenticate,
        switchDemo: (slug) =>
          transition('demo', { profile: slug, day: localDay() }).catch(
            () => {},
          ),
        leave: () => transition().catch(() => {}),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useIdentity() {
  const value = useContext(Context);
  if (!value) throw new Error('Session unavailable');
  return value;
}
