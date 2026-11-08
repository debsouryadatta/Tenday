import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { CircleCheck } from 'lucide-react-native';
import {
  useConvexAuth,
  useConvexConnectionState,
  useMutation,
  useQuery,
} from 'convex/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConvexError } from 'convex/values';
import { api, type Doc, type Id } from './backend';
import type { MealInput, ReportInput } from '@tenday/domain';
import { Banner, Text } from '../components/ui';
import { c, radius, space } from '../theme/tokens';

export type Pending = {
  operationId: string;
  status: 'queued' | 'failed';
  error?: string;
} & (
  | { kind: 'meal'; meal: MealInput; id?: Id<'meals'>; revision?: number }
  | { kind: 'report'; report: ReportInput; fileId?: Id<'files'> }
);
type State = {
  sessionId: string;
  profile: Doc<'profiles'> | null | undefined;
  connected: boolean;
  pending: Pending[];
  enqueue: (item: Pending) => Promise<void>;
  retry: (operationId: string) => void;
  discard: (operationId: string) => void;
  toast: (message: string) => void;
};
const AppContext = createContext<State | null>(null);
export function message(error: unknown) {
  if (error instanceof ConvexError && typeof error.data === 'string')
    return error.data;
  return 'This could not be completed. Your input is kept; reconnect and try again.';
}
export function AppStateProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const session = useQuery(api.records.session, isAuthenticated ? {} : 'skip');
  const profile = useQuery(api.records.profile, isAuthenticated ? {} : 'skip');
  const connection = useConvexConnectionState();
  const saveMeal = useMutation(api.records.saveMeal);
  const saveReport = useMutation(api.records.saveReport);
  const [pending, setPending] = useState<Pending[]>([]);
  const ref = useRef<Pending[]>([]);
  const [queueReady, setQueueReady] = useState(false);
  const processing = useRef(false);
  const [wake, setWake] = useState(0);
  const [notice, setNotice] = useState('');
  const toast = useCallback((text: string) => setNotice(text), []);
  const key = `tenday:queue:${session?.id ?? 'loading'}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    setQueueReady(false);
    void AsyncStorage.getItem(key).then((raw) => {
      if (!active) return;
      let restored: Pending[] = [];
      try {
        if (raw) {
          const data: unknown = JSON.parse(raw);
          if (Array.isArray(data)) restored = data as Pending[];
        }
      } catch {
        /* Preserve server records when a local queue is corrupt. */
      }
      ref.current = restored;
      setPending(restored);
      setQueueReady(true);
    });
    return () => {
      active = false;
    };
  }, [key]);
  const update = useCallback(
    (fn: (old: Pending[]) => Pending[]) => {
      ref.current = fn(ref.current);
      const next = ref.current;
      setPending(next);
      writes.current = writes.current
        .catch(() => {})
        .then(() => AsyncStorage.setItem(key, JSON.stringify(next)));
      return writes.current;
    },
    [key],
  );
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (
      !queueReady ||
      !isAuthenticated ||
      !connection.isWebSocketConnected ||
      processing.current
    )
      return;
    const item = pending.find((p) => p.status === 'queued');
    if (!item) return;
    processing.current = true;
    void (async () => {
      try {
        if (item.kind === 'meal')
          await saveMeal({
            operationId: item.operationId,
            meal: item.meal,
            id: item.id,
            revision: item.revision,
          });
        else
          await saveReport({
            operationId: item.operationId,
            report: item.report,
            fileId: item.fileId,
          });
        if (currentKey.current !== key) return;
        await update((old) =>
          old.filter((p) => p.operationId !== item.operationId),
        );
        toast(
          item.kind === 'meal'
            ? 'Meal saved. A little more clarity for your day.'
            : 'Report saved. Your confirmed values are ready.',
        );
      } catch (error) {
        if (currentKey.current === key)
          await update((old) =>
            old.map((p) =>
              p.operationId === item.operationId
                ? { ...p, status: 'failed', error: message(error) }
                : p,
            ),
          );
      } finally {
        processing.current = false;
        setWake((n) => n + 1);
      }
    })();
  }, [
    pending,
    queueReady,
    isAuthenticated,
    connection.isWebSocketConnected,
    key,
    saveMeal,
    saveReport,
    update,
    toast,
    wake,
  ]);
  const enqueue = useCallback(
    async (item: Pending) => {
      if (!queueReady) throw new Error('Queue is opening');
      await update((old) =>
        old.some((p) => p.operationId === item.operationId)
          ? old
          : [...old, item],
      );
      toast(
        connection.isWebSocketConnected
          ? 'Saving your confirmed entry…'
          : 'Kept on this device. Saving when you reconnect.',
      );
    },
    [queueReady, update, toast, connection.isWebSocketConnected],
  );
  const value: State = {
    sessionId: session?.id ?? 'loading',
    profile,
    connected: connection.isWebSocketConnected,
    pending,
    enqueue,
    toast,
    retry: (op) => {
      void update((old) =>
        old.map((p) =>
          p.operationId === op
            ? { ...p, status: 'queued', error: undefined }
            : p,
        ),
      );
    },
    discard: (op) => {
      void update((old) => old.filter((p) => p.operationId !== op));
    },
  };
  return (
    <AppContext.Provider value={value}>
      {children}
      {notice && (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            bottom: 104,
            alignSelf: 'center',
            maxWidth: 480,
            marginHorizontal: space.lg,
            paddingVertical: space.md,
            paddingHorizontal: space.base,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            backgroundColor: c.ink,
            borderRadius: radius.pill,
            shadowColor: c.ink,
            shadowOpacity: 0.25,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <CircleCheck size={18} color={c.lime} strokeWidth={2.4} />
          <Text variant="smallStrong" color={c.onInk} style={{ flexShrink: 1 }}>
            {notice}
          </Text>
        </View>
      )}
    </AppContext.Provider>
  );
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('App state is unavailable');
  return value;
}
export function ConnectionBanner() {
  const { connected } = useApp();
  return connected ? null : (
    <Banner tone="warning" title="You’re offline">
      Saved records may be cached. New entries stay on this device until you
      reconnect.
    </Banner>
  );
}
