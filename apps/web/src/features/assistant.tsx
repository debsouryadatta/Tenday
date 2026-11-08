import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from 'convex/react';
import {
  ArrowUp,
  ArrowUpRight,
  Camera,
  FileText,
  History,
  LoaderCircle,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { api, type Id } from '../lib/backend';
import { useApp, errorMessage } from '../lib/app-state';
import { useDay } from '../lib/day';
import { useDraft, operationId } from '../lib/storage';
import {
  Banner,
  Button,
  Chip,
  IconButton,
  IconLink,
  LinkButton,
} from '../components/ui';
import { AssistantMark } from '../components/assistant-mark';

const SUGGESTIONS = [
  'What’s one useful step for today?',
  'Help me understand my recent meals.',
  'What could I ask about my latest report?',
];

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
    [confirm, setConfirm] = useState(false),
    [cheer, setCheer] = useState(false);
  useEffect(() => {
    if (!cheer) return;
    const t = setTimeout(() => setCheer(false), 1600);
    return () => clearTimeout(t);
  }, [cheer]);
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
      if (result.status === 'ready') {
        change({ text: '', operationId: operationId() });
        setCheer(true);
      }
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
  const empty = status !== 'LoadingFirstPage' && !messages.length;
  const canSend = ready && !!value.text.trim() && !busy;
  useEffect(() => {
    if (!busy) return;
    const el = scroll.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [busy]);
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value.text]);
  return (
    <div className="chat-layout">
      <section className="chat">
        <header className="chat-header">
          <div className="chat-identity">
            <AssistantMark
              size={44}
              state={busy ? 'thinking' : cheer ? 'happy' : 'idle'}
              label="Tenday assistant"
            />
            <div>
              <h1>Assistant</h1>
              <p>
                {connected
                  ? 'Knows your goal, meals and reports'
                  : 'Offline · messages wait here'}
              </p>
            </div>
          </div>
          <div className="row tight">
            <IconLink
              to="/goal"
              icon={SlidersHorizontal}
              label="Edit remembered preferences"
            />
            {!empty && (
              <IconButton
                icon={Trash2}
                label="Clear conversation"
                disabled={busy}
                onClick={() => setConfirm(true)}
              />
            )}
          </div>
        </header>
        <div
          className="messages"
          ref={scroll}
          role="log"
          aria-label="Your conversation"
          aria-live="polite"
          aria-relevant="additions text"
        >
          <div className="messages-inner">
            {confirm && (
              <div className="confirm-card">
                <h3>Clear this conversation?</h3>
                <p>Your goal, meals and reports stay exactly as they are.</p>
                <div className="two-columns">
                  <Button variant="secondary" size="medium" onClick={() => setConfirm(false)}>
                    Keep it
                  </Button>
                  <Button
                    variant="danger"
                    size="medium"
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
                    Clear
                  </Button>
                </div>
              </div>
            )}
            {status === 'LoadingFirstPage' && (
              <p className="thinking" role="status">
                <LoaderCircle className="spin" size={16} /> Opening your conversation…
              </p>
            )}
            {status === 'CanLoadMore' && (
              <div className="center">
                <Chip label="Earlier messages" icon={History} onClick={() => loadMore(30)} />
              </div>
            )}
            {empty && (
              <div className="chat-empty">
                <AssistantMark size={96} />
                <h2>How can I help today?</h2>
                <p>
                  Ask about your saved meals or reports, or find one small step
                  for your goal.
                </p>
                <div className="suggestions">
                  {SUGGESTIONS.map((text) => (
                    <button
                      type="button"
                      key={text}
                      disabled={busy || !ready}
                      onClick={() => {
                        change({ text, operationId: operationId() });
                        textarea.current?.focus();
                      }}
                    >
                      <span>{text}</span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!empty && profile?.goal.preferences && (
              <LinkButton to="/goal" chevron={false} className="remembered mobile-only">
                <span className="remembered-icon">
                  <History size={16} strokeWidth={2.2} />
                </span>
                <span>
                  <small>Remembered because you confirmed it</small>
                  <span>{profile.goal.preferences}</span>
                </span>
              </LinkButton>
            )}
            {messages.map((m) =>
              m.role === 'user' ? (
                <article key={m.id} className="bubble-user">
                  <p>{m.text}</p>
                </article>
              ) : (
                <article key={m.id} className="bubble-assistant">
                  <header>
                    <AssistantMark size={26} live={false} />
                    <strong>Tenday</strong>
                  </header>
                  <p>{m.text}</p>
                  {m.status === 'failed' && (
                    <small className="error-text">This reply couldn’t finish.</small>
                  )}
                </article>
              ),
            )}
            {busy && (
              <div className="typing" role="status">
                <AssistantMark size={28} state="thinking" />
                <span>
                  <LoaderCircle className="spin" size={15} />
                  Thinking with your context…
                </span>
              </div>
            )}
          </div>
        </div>
        <form
          className="composer"
          ref={composer}
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {error && (
            <Banner
              error
              action={
                <LinkButton onClick={() => void submit()} className="error-text">
                  Retry
                </LinkButton>
              }
            >
              {error}
            </Banner>
          )}
          {value.reportId && (
            <div className="report-focus">
              <FileText size={15} strokeWidth={2.2} />
              <span>Includes the report you selected</span>
              <button
                type="button"
                aria-label="Remove report focus"
                disabled={busy}
                onClick={() =>
                  change({
                    ...value,
                    reportId: undefined,
                    operationId: operationId(),
                  })
                }
              >
                <X size={14} />
              </button>
            </div>
          )}
          {!empty && (
            <div className="quick-chips mobile-only">
              <Chip label="Log a meal" icon={Camera} tone="outline" to="/meal" />
              <Chip label="Reports" icon={FileText} tone="outline" to="/reports" />
              <Chip label="Preferences" icon={SlidersHorizontal} tone="outline" to="/goal" />
            </div>
          )}
          <div className="composer-box">
            <textarea
              ref={textarea}
              aria-label="Message Tenday"
              placeholder="Ask about your day, meals or reports…"
              rows={1}
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
            <button
              type="submit"
              className="send"
              aria-label={busy ? 'Sending' : 'Send message'}
              aria-busy={busy || undefined}
              disabled={!canSend}
            >
              {busy ? (
                <LoaderCircle className="spin" size={19} />
              ) : (
                <ArrowUp size={21} strokeWidth={2.6} />
              )}
            </button>
          </div>
          <p className="caption center">
            General information, not diagnosis. Records change only when you
            save them.
          </p>
        </form>
      </section>
      <aside className="chat-context">
        <span className="eyebrow">Kept close</span>
        <h2>Your confirmed context</h2>
        <p>{profile?.goal.rationale}</p>
        {profile?.goal.preferences && (
          <div className="context-memory">
            <small>Remembered because you confirmed it</small>
            <p>{profile.goal.preferences}</p>
          </div>
        )}
        <LinkButton to="/goal">Edit goal & preferences</LinkButton>
        <div className="context-actions">
          <LinkButton to="/meal" chevron={false} className="context-action">
            <Camera size={18} strokeWidth={2.2} />
            <span>Log a meal</span>
            <ArrowUpRight size={16} />
          </LinkButton>
          <LinkButton to="/reports" chevron={false} className="context-action">
            <FileText size={18} strokeWidth={2.2} />
            <span>View reports</span>
            <ArrowUpRight size={16} />
          </LinkButton>
        </div>
        <p className="caption">
          AI uses relevant confirmed context and can be mistaken. It gives
          general information, not diagnosis.
        </p>
      </aside>
    </div>
  );
}
