import { useEffect, useRef, useState } from 'react';
import { View, type ScrollViewInstance } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from 'convex/react';
import { operationId } from '../../lib/operation-id';
import {
  MessageCircle,
  Plus,
  Send,
  Settings2,
  Trash2,
} from 'lucide-react-native';
import { api, type Id } from '../../lib/backend';
import { useApp, message, ConnectionBanner } from '../../lib/app-state';
import { useDraft } from '../../lib/storage';
import { useDay } from '../../lib/day';
import {
  Banner,
  Button,
  Card,
  Empty,
  IconButton,
  Input,
  Screen,
  Text,
  s,
} from '../../components/ui';
import { AccountBar } from '../../features/auth';
import { c, space } from '../../theme/tokens';

export default function Assistant() {
  const router = useRouter();
  const navigation = useNavigation<{
    setParams(params: {
      ask?: string;
      reportId?: Id<'reports'>;
      request?: string;
    }): void;
  }>();
  const scroll = useRef<ScrollViewInstance>(null);
  const { sessionId, profile, connected } = useApp();
  const day = useDay();
  const draft = useDraft(`tenday:chat:${sessionId}`, {
    text: '',
    operationId: operationId(),
  });
  const { change: changeDraft, ready: draftReady } = draft;
  const { ask, reportId, request } = useLocalSearchParams<{
    ask?: string;
    reportId?: Id<'reports'>;
    request?: string;
  }>();
  const selectedReport = useQuery(
    api.records.reportSummary,
    reportId ? { id: reportId } : 'skip',
  );
  const handledReport = useRef('');
  useEffect(() => {
    if (ask && draftReady) {
      void changeDraft({ text: ask, operationId: operationId() });
      navigation.setParams({ ask: undefined });
    } else if (
      draftReady &&
      reportId &&
      selectedReport &&
      handledReport.current !== (request ?? reportId)
    ) {
      handledReport.current = request ?? reportId;
      void changeDraft({
        text: `Help me understand my report “${selectedReport.title}” from ${selectedReport.day}. Explain the terms in plain language and suggest a useful question for my clinician.`,
        operationId: operationId(),
      });
    } else if (!reportId) {
      handledReport.current = '';
    }
  }, [
    ask,
    draftReady,
    changeDraft,
    reportId,
    selectedReport,
    request,
    navigation,
  ]);
  const { results, status, loadMore } = usePaginatedQuery(
    api.assistant.messages,
    {},
    { initialNumItems: 30 },
  );
  const send = useAction(api.assistant.send);
  const clear = useMutation(api.assistant.clear);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const sendLock = useRef(false);
  const newestMessage = results[0]?.id;
  useEffect(() => {
    if (!newestMessage) return;
    const timer = setTimeout(
      () => scroll.current?.scrollToEnd({ animated: true }),
      80,
    );
    return () => clearTimeout(timer);
  }, [newestMessage]);
  async function submit() {
    if (sendLock.current || busy || !draft.value.text.trim()) return;
    if (!connected) {
      setError('Reconnect to talk with Tenday. Your message stays here.');
      return;
    }
    sendLock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await send({ ...draft.value, day, reportId });
      if (result.status === 'error')
        setError(result.error ?? 'Try again shortly.');
      else if (result.status === 'ready') {
        await draft.change({ text: '', operationId: operationId() });
        navigation.setParams({ reportId: undefined, request: undefined });
      }
    } catch (e) {
      setError(message(e));
    } finally {
      sendLock.current = false;
      setBusy(false);
    }
  }
  const messages = [...results]
    .sort((a, b) => a.order - b.order || a.stepOrder - b.stepOrder)
    .filter((m) => m.text && (m.role === 'assistant' || m.role === 'user'));
  return (
    <Screen
      scrollRef={scroll}
      footer={
        <View style={s.stack}>
          {!!error && <Banner error>{error}</Banner>}
          <Input
            label="Message Tenday"
            placeholder="What would make today easier?"
            multiline
            value={draft.value.text}
            editable={!busy}
            maxLength={3000}
            onChangeText={(text) => {
              void draft.change({ text, operationId: operationId() });
              setError('');
            }}
          />
          <Button
            title={
              busy
                ? 'Thinking with your context…'
                : error
                  ? 'Retry message'
                  : 'Send message'
            }
            icon={Send}
            busy={busy}
            disabled={!draft.ready || !draft.value.text.trim()}
            onPress={submit}
          />
        </View>
      }
    >
      <AccountBar />
      <View style={{ alignItems: 'flex-end', marginBottom: space.base }}>
        <View style={s.row}>
          <IconButton
            icon={Settings2}
            label="Edit remembered preferences"
            onPress={() => router.push('/goal')}
          />
          <IconButton
            icon={Trash2}
            label="Clear conversation"
            onPress={() => setConfirmClear(true)}
          />
        </View>
      </View>
      <Text variant="title" accessibilityRole="header">
        A little help, close by.
      </Text>
      <Text
        color={c.secondary}
        style={{ marginTop: space.sm, marginBottom: space.lg }}
      >
        Your goals, your meals, and a next step that makes sense.
      </Text>
      <View style={s.stack}>
        <ConnectionBanner />
        {profile?.goal.preferences && (
          <Card tone="outline">
            <Text variant="small" color={c.secondary}>
              Remembered because you confirmed it
            </Text>
            <Text>{profile.goal.preferences}</Text>
            <Button
              title="Edit or forget"
              variant="quiet"
              compact
              onPress={() => router.push('/goal')}
            />
          </Card>
        )}
        {confirmClear && (
          <Card tone="outline">
            <Text variant="strong">Clear this conversation?</Text>
            <Text variant="small" color={c.secondary}>
              Your goals, meals, and reports will stay.
            </Text>
            <Button
              title="Clear conversation"
              variant="danger"
              onPress={async () => {
                if (!connected) {
                  setError('Reconnect to clear conversation.');
                  return;
                }
                try {
                  await clear({});
                  setConfirmClear(false);
                } catch (e) {
                  setError(message(e));
                }
              }}
            />
            <Button
              title="Keep it"
              variant="secondary"
              onPress={() => setConfirmClear(false)}
            />
          </Card>
        )}
        {status === 'CanLoadMore' && (
          <Button
            title="Earlier messages"
            variant="secondary"
            onPress={() => loadMore(30)}
          />
        )}
        {messages.length === 0 && (
          <>
            <Empty
              icon={MessageCircle}
              title="Let’s make today easier"
              body="Ask about your saved meals or reports, or find one small step for your goal."
            />
            {[
              'What’s one useful step for today?',
              'Help me understand my recent meals.',
            ].map((text) => (
              <Button
                key={text}
                title={text}
                variant="secondary"
                onPress={() => {
                  void draft.change({ text, operationId: operationId() });
                }}
              />
            ))}
          </>
        )}
        {messages.map((m) => (
          <Card
            key={m.id}
            tone={m.role === 'user' ? 'neutral' : 'sage'}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '95%',
            }}
          >
            <Text variant="label" color={c.forest}>
              {m.role === 'user' ? 'YOU' : 'TENDAY'}
            </Text>
            <Text selectable>{m.text}</Text>
            {m.status === 'failed' && (
              <Text variant="small" color={c.error}>
                This reply could not finish.
              </Text>
            )}
          </Card>
        ))}
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Button
              title="Log a meal"
              icon={Plus}
              variant="quiet"
              onPress={() => router.push('/meal')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="View reports"
              variant="secondary"
              onPress={() => router.push('/reports')}
            />
          </View>
        </View>
        <Text variant="small" color={c.muted}>
          AI uses your confirmed context and can be mistaken. It provides
          general information, not diagnosis. Records change only when you
          explicitly save them.
        </Text>
      </View>
    </Screen>
  );
}
