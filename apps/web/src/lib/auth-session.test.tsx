// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IdentityProvider,
  useIdentity,
  type Account,
} from '../../../mobile/src/lib/auth-session';
const state = vi.hoisted(() => ({
  authenticated: true,
  loading: false,
  token: 'old-session' as string | null,
  account: undefined as unknown,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({ signIn: state.signIn, signOut: state.signOut }),
  useAuthToken: () => state.token,
}));
vi.mock('convex/react', () => ({
  useConvexAuth: () => ({
    isAuthenticated: state.authenticated,
    isLoading: state.loading,
  }),
  useQuery: () => state.account,
}));
const maya = {
  id: 'maya-user',
  name: 'Maya',
  email: null,
  demo: 'maya',
  legacy: false,
} as Account;
const arjun = {
  id: 'arjun-user',
  name: 'Arjun',
  email: null,
  demo: 'arjun',
  legacy: false,
} as Account;
let root: Root,
  container: HTMLDivElement,
  latest: ReturnType<typeof useIdentity>;
function Probe() {
  latest = useIdentity();
  return <div>{latest.switching || latest.account?.name || 'Sign in'}</div>;
}
async function render() {
  await act(async () => {
    root.render(
      <IdentityProvider>
        <Probe />
      </IdentityProvider>,
    );
  });
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.authenticated = true;
  state.loading = false;
  state.token = 'old-session';
  state.account = maya;
  state.signIn.mockReset().mockResolvedValue({ signingIn: true });
  state.signOut.mockReset().mockResolvedValue(undefined);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await render();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
describe('account transition lifecycle', () => {
  it('keeps the form hidden while an issued token awaits backend acceptance', async () => {
    state.authenticated = false;
    state.account = undefined;
    state.token = 'issued-awaiting-acceptance';
    await render();
    expect(latest.loading).toBe(true);
    state.authenticated = true;
    state.account = maya;
    await render();
    expect(latest.loading).toBe(false);
  });
  it('waits for signed-out state before signing in and for the new owner before opening records', async () => {
    let finished = false;
    let operation: Promise<void>;
    await act(async () => {
      operation = latest.switchDemo('arjun').then(() => {
        finished = true;
      });
      await Promise.resolve();
    });
    expect(state.signOut).toHaveBeenCalledOnce();
    expect(state.signIn).not.toHaveBeenCalled();
    expect(finished).toBe(false);
    // Resolving signOut is insufficient: token/transport state must also clear.
    state.authenticated = false;
    state.token = null;
    state.account = undefined;
    await render();
    expect(state.signIn).toHaveBeenCalledOnce();
    expect(state.signIn).toHaveBeenCalledWith(
      'demo',
      expect.objectContaining({ profile: 'arjun' }),
    );
    expect(latest.switching).toBeTruthy();
    // An accepted token alone must not reveal a previous owner's cached data.
    state.authenticated = true;
    state.token = 'new-session';
    state.account = undefined;
    await render();
    expect(finished).toBe(false);
    state.account = arjun;
    await render();
    await operation!;
    expect(finished).toBe(true);
    expect(latest.switching).toBe('');
    expect(latest.account?.demo).toBe('arjun');
  });
  it('finishes sign-out only after state clears, without entering another account', async () => {
    let done = false;
    await act(async () => {
      void latest.leave().then(() => {
        done = true;
      });
      await Promise.resolve();
    });
    expect(done).toBe(false);
    state.authenticated = false;
    state.token = null;
    state.account = undefined;
    await render();
    expect(done).toBe(true);
    expect(state.signIn).not.toHaveBeenCalled();
    expect(latest.switching).toBe('');
  });
  it('keeps ordinary failed sign-in in the form rather than starting a profile transition', async () => {
    state.authenticated = false;
    state.token = null;
    state.account = undefined;
    await render();
    state.signIn.mockRejectedValueOnce(new Error('Rejected'));
    await expect(
      latest.authenticate('password', {
        flow: 'signIn',
        email: 'fictional@example.com',
        password: 'synthetic-test-only',
      }),
    ).rejects.toThrow('Rejected');
    expect(state.signOut).not.toHaveBeenCalled();
    expect(latest.switching).toBe('');
  });
  it('shows a failed switch without leaving an unhandled account-screen promise', async () => {
    state.signIn.mockRejectedValueOnce(new Error('Offline'));
    let operation: Promise<void>;
    await act(async () => {
      operation = latest.switchDemo('arjun');
      await Promise.resolve();
    });
    state.authenticated = false;
    state.token = null;
    state.account = undefined;
    await render();
    await operation!;
    expect(latest.error).toContain('could not open');
    expect(latest.switching).toBe('');
    expect(latest.account).toBeUndefined();
  });
});
