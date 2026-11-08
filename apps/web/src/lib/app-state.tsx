import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useConvexConnectionState, useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { api, type Doc, type Id } from './backend';
import { useDraft } from './storage';
import type { MealInput, ReportInput } from '@tenday/domain';

type Pending = {
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
  enqueue(item: Pending): void;
  retry(id: string): void;
  discard(id: string): void;
  toast(text: string): void;
};
const Context = createContext<State | null>(null);
export function errorMessage(e: unknown) {
  if (e instanceof ConvexError && typeof e.data === 'string') return e.data;
  return e instanceof Error && !('data' in e)
    ? e.message
    : 'This could not finish. Your input is kept; reconnect and try again.';
}
export function AppState({ children }: { children: ReactNode }) {
  const session = useQuery(api.records.session, {});
  const profile = useQuery(api.records.profile, {});
  const connection = useConvexConnectionState();
  const queue = useDraft<Pending[]>(
    `tenday:web:queue:${session?.id ?? 'loading'}`,
    [],
  );
  const { change, value: pending, ready } = queue;
  const saveMeal = useMutation(api.records.saveMeal),
    saveReport = useMutation(api.records.saveReport);
  const processing = useRef(false);
  const [wake, setWake] = useState(0),
    [notice, setNotice] = useState('');
  const currentOwner = useRef(session?.id);
  currentOwner.current = session?.id;
  const toast = useCallback((text: string) => setNotice(text), []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (
      !session ||
      !ready ||
      !connection.isWebSocketConnected ||
      processing.current
    )
      return;
    const item = pending.find((p) => p.status === 'queued');
    if (!item) return;
    processing.current = true;
    const owner = session.id;
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
        if (currentOwner.current !== owner) return;
        change((old) => old.filter((p) => p.operationId !== item.operationId));
        toast(
          item.kind === 'meal'
            ? 'Meal saved. Your day is up to date.'
            : 'Report saved. Your confirmed values are ready.',
        );
      } catch (e) {
        if (currentOwner.current === owner)
          change((old) =>
            old.map((p) =>
              p.operationId === item.operationId
                ? { ...p, status: 'failed', error: errorMessage(e) }
                : p,
            ),
          );
      } finally {
        processing.current = false;
        setWake((n) => n + 1);
      }
    })();
  }, [
    session,
    pending,
    ready,
    connection.isWebSocketConnected,
    saveMeal,
    saveReport,
    change,
    toast,
    wake,
  ]);
  if (!session || !ready)
    return (
      <div className="loading" role="status">
        Opening your day…
      </div>
    );
  return (
    <Context.Provider
      value={{
        sessionId: session.id,
        profile,
        connected: connection.isWebSocketConnected,
        pending,
        enqueue(item) {
          change((old) =>
            old.some((p) => p.operationId === item.operationId)
              ? old
              : [...old, item],
          );
          toast(
            connection.isWebSocketConnected
              ? 'Saving your confirmed entry…'
              : 'Kept on this device. Saving when connected.',
          );
        },
        retry(id) {
          change((old) =>
            old.map((p) =>
              p.operationId === id
                ? { ...p, status: 'queued', error: undefined }
                : p,
            ),
          );
        },
        discard(id) {
          change((old) => old.filter((p) => p.operationId !== id));
        },
        toast,
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </Context.Provider>
  );
}
export function useApp() {
  const state = useContext(Context);
  if (!state) throw new Error('App state unavailable');
  return state;
}
