import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from 'convex/react';
import {
  ArrowUpRight,
  MessageCircle,
  Send,
  Settings2,
  Trash2,
} from 'lucide-react';
import { api, type Id } from '../lib/backend';
import { useApp, errorMessage } from '../lib/app-state';
import { useDay } from '../lib/day';
import { useDraft, operationId } from '../lib/storage';
import { Banner, Button, Empty, PageTitle, TextArea } from '../components/ui';

type Draft = { text: string; operationId: string; reportId?: Id<'reports'> };
export function Assistant() {
  const { sessionId, profile, connected } = useApp();
  const day = useDay(),
    location = useLocation(),
    navigate = useNavigate();
  const incoming = location.state as {
    reportId?: Id<'reports'>;
    requestId?: string;
  } | null;
  const draft = useDraft<Draft>(`tenday:web:chat:${sessionId}`, {
    text: '',
    operationId: operationId(),
  });
  const { value, change, ready } = draft;
  const selected = useQuery(
    api.records.reportSummary,
    incoming?.reportId ? { id: incoming.reportId } : 'skip',
  );
  const handled = useRef('');
  useEffect(() => {
    if (
      ready &&
      incoming?.reportId &&
      selected &&
      handled.current !== incoming.requestId
    ) {
      handled.current = incoming.requestId ?? incoming.reportId;
      change({
        text: `Help me understand my report “${selected.title}” from ${selected.day}. Explain the terms in plain language and suggest a useful question for my clinician.`,
        operationId: operationId(),
        reportId: incoming.reportId,
      });
      navigate('/assistant', { replace: true, state: null });
    }
  }, [ready, incoming, selected, change, navigate]);
  const { results, status, loadMore } = usePaginatedQuery(
    api.assistant.messages,
    {},
    { initialNumItems: 30 },
  );
  const send = useAction(api.assistant.send),
    clear = useMutation(api.assistant.clear);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState(false);
  const locked = useRef(false),
    scroll = useRef<HTMLDivElement>(null),
    composer = useRef<HTMLFormElement>(null);
  const newest = results[0]?.id;
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = scroll.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 80);
    return () => clearTimeout(timer);
  }, [newest]);
  async function submit() {
    if (locked.current || !ready || !value.text.trim()) return;
    if (!connected) {
      setError('Reconnect to talk with Tenday. Your message stays here.');
      return;
    }
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await send({ ...value, day });
      if (result.status === 'ready')
        change({ text: '', operationId: operationId() });
      else
        setError(
          result.error ??
            'Your message is still processing. Retry shortly to check it.',
        );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const messages = [...results]
    .sort((a, b) => a.order - b.order || a.stepOrder - b.stepOrder)
    .filter((m) => m.text && (m.role === 'user' || m.role === 'assistant'));
  return (
    <>
      <PageTitle
        title="A little help, close by."
        subtitle="Your goals, your meals, and a next step that makes sense."
        action={
          <button
            className="icon-button"
            aria-label="Clear conversation"
            disabled={busy}
            onClick={() => setConfirm(true)}
          >
            <Trash2 size={21} />
          </button>
        }
      />
      {confirm && (
        <Banner>
          <strong>Clear this conversation?</strong>
          <p>Your goals, meals and reports will stay.</p>
          <div className="row">
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                if (!connected) {
                  setError('Reconnect to clear the conversation.');
                  return;
                }
                try {
                  await clear({});
                  setConfirm(false);
                } catch (e) {
                  setError(errorMessage(e));
                }
              }}
            >
              Clear conversation
            </Button>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Keep it
            </Button>
          </div>
        </Banner>
      )}
      <div className="assistant-grid">
        <section className="conversation">
          <details className="mobile-context">
            <summary>Your goal & remembered preferences</summary>
            <p>{profile?.goal.rationale}</p>
            {profile?.goal.preferences && <p>{profile.goal.preferences}</p>}
            <Link className="text-link" to="/goal">
              Edit or forget preferences
            </Link>
            <p>
              AI uses confirmed context and can be mistaken. General
              information, not diagnosis. Records change only when you save.
            </p>
          </details>
          <div
            className="messages"
            ref={scroll}
            role="log"
            aria-label="Your conversation"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {status === 'LoadingFirstPage' && (
              <p role="status">Opening your conversation…</p>
            )}
            {status === 'CanLoadMore' && (
              <Button variant="secondary" onClick={() => loadMore(30)}>
                Earlier messages
              </Button>
            )}
            {status !== 'LoadingFirstPage' && !messages.length && (
              <>
                <Empty icon={MessageCircle} title="Let’s make today easier.">
                  Ask about your saved meals or reports, or find one small step
                  for your goal.
                </Empty>
                <div className="suggestions">
                  {[
                    'What’s one useful step for today?',
                    'Help me understand my recent meals.',
                  ].map((text) => (
                    <Button
                      variant="secondary"
                      disabled={busy || !ready}
                      key={text}
                      onClick={() => {
                        change({ text, operationId: operationId() });
                        composer.current?.querySelector('textarea')?.focus();
                      }}
                    >
                      {text}
                      <ArrowUpRight size={17} />
                    </Button>
                  ))}
                </div>
              </>
            )}
            {messages.map((m) => (
              <article key={m.id} className={`message ${m.role}`}>
                <span className="eyebrow">
                  {m.role === 'user' ? 'YOU' : 'TENDAY'}
                </span>
                <p>{m.text}</p>
                {m.status === 'failed' && (
                  <small>This reply could not finish.</small>
                )}
              </article>
            ))}
            {busy && (
              <p className="thinking" role="status">
                Thinking with your confirmed context…
              </p>
            )}
          </div>
          <form
            className="composer"
            ref={composer}
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            {!connected && (
              <Banner>You’re offline. Your draft is kept here.</Banner>
            )}
            {error && <Banner error>{error}</Banner>}
            {value.reportId && (
              <p className="small muted">
                This message includes the report you selected.{' '}
                <button
                  className="inline-button"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    change({
                      ...value,
                      reportId: undefined,
                      operationId: operationId(),
                    })
                  }
                >
                  Remove report focus
                </button>
              </p>
            )}
            <TextArea
              label="Message Tenday"
              placeholder="What would make today easier?"
              rows={2}
              value={value.text}
              disabled={busy || !ready}
              maxLength={3000}
              onChange={(e) => {
                change({
                  ...value,
                  text: e.target.value,
                  operationId: operationId(),
                });
                setError('');
              }}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            <div className="composer-actions">
              <span className="small muted">
                Enter to send · Shift + Enter for a new line
              </span>
              <Button
                type="submit"
                icon={Send}
                busy={busy}
                disabled={!ready || !value.text.trim()}
              >
                {error ? 'Retry message' : 'Send message'}
              </Button>
            </div>
          </form>
        </section>
        <aside className="context-panel stack">
          <div>
            <span className="eyebrow">KEPT CLOSE</span>
            <h2>Your confirmed context</h2>
            <p>{profile?.goal.rationale}</p>
            {profile?.goal.preferences && (
              <>
                <p className="small muted">
                  Remembered because you confirmed it
                </p>
                <p className="remembered">{profile.goal.preferences}</p>
              </>
            )}
            <Link className="text-link" to="/goal">
              <Settings2 size={17} />
              Edit goal & preferences
            </Link>
          </div>
          <div className="context-links">
            <Link to="/meal">
              Log a meal
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/reports">
              View reports
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <p className="small muted">
            AI uses relevant confirmed context and can be mistaken. It gives
            general information, not diagnosis. Records change only when you
            explicitly save them.
          </p>
        </aside>
      </div>
    </>
  );
}
