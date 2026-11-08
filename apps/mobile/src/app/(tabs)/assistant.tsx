import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from 'convex/react';
import { operationId } from '../../lib/operation-id';
import {
  ArrowLeft,
  ArrowUp,
  Camera,
  FileText,
  History,
  SlidersHorizontal,
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
  Chip,
  IconButton,
  LinkButton,
  Screen,
  Text,
  s,
} from '../../components/ui';
import { NAV_MODE } from '../../constants';
import { AssistantMark } from '../../components/assistant-mark';
import { c, radius, space, type } from '../../theme/tokens';

const SUGGESTIONS = [
  'What’s one useful step for today?',
  'Help me understand my recent meals.',
  'What could I ask about my latest report?',
];

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
  const [cheer, setCheer] = useState(false);
  useEffect(() => {
    if (!cheer) return;
    const t = setTimeout(() => setCheer(false), 1600);
    return () => clearTimeout(t);
  }, [cheer]);
  const newestMessage = results[0]?.id;
  useEffect(() => {
    if (!newestMessage) return;
    const timer = setTimeout(
      () => scroll.current?.scrollToEnd({ animated: true }),
      80,
    );
    return () => clearTimeout(timer);
  }, [newestMessage]);
  useEffect(() => {
    if (!busy) return;
    const timer = setTimeout(
      () => scroll.current?.scrollToEnd({ animated: true }),
      60,
    );
    return () => clearTimeout(timer);
  }, [busy]);
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
        setCheer(true);
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
  const empty = messages.length === 0;
  const canSend = draft.ready && !!draft.value.text.trim() && !busy;
  return (
    <Screen
      tabbed={NAV_MODE === 'tabs'}
      scrollRef={scroll}
      footer={
        <View style={{ gap: space.sm }}>
          {!!error && (
            <Banner
              error
              action={
                <LinkButton title="Retry" color={c.error} onPress={submit} />
              }
            >
              {error}
            </Banner>
          )}
          {!empty && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: space.sm }}
            >
              <Chip label="Log a meal" icon={Camera} tone="outline" onPress={() => router.push('/meal')} />
              <Chip label="Reports" icon={FileText} tone="outline" onPress={() => router.navigate('/reports')} />
              <Chip label="Preferences" icon={SlidersHorizontal} tone="outline" onPress={() => router.push('/goal')} />
            </ScrollView>
          )}
          <View
            style={[
              s.row,
              {
                alignItems: 'flex-end',
                backgroundColor: c.surface,
                borderRadius: 26,
                paddingLeft: space.base,
                padding: 5,
              },
            ]}
          >
            <TextInput
              accessibilityLabel="Message Tenday"
              placeholder="Ask about your day, meals or reports…"
              placeholderTextColor={c.muted}
              selectionColor={c.ink}
              cursorColor={c.ink}
              multiline
              value={draft.value.text}
              editable={!busy}
              maxLength={3000}
              onChangeText={(text) => {
                void draft.change({ text, operationId: operationId() });
                setError('');
              }}
              style={{
                ...type.body,
                flex: 1,
                color: c.ink,
                minHeight: 44,
                maxHeight: 132,
                paddingTop: 11,
                paddingBottom: 11,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={busy ? 'Sending' : 'Send message'}
              accessibilityState={{ disabled: !canSend, busy }}
              disabled={!canSend}
              onPress={submit}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: canSend || busy ? c.ink : c.surfaceStrong,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pressed ? 0.92 : 1 }],
              })}
            >
              <ArrowUp
                size={21}
                color={busy ? c.onInkMuted : canSend ? c.lime : c.muted}
                strokeWidth={2.6}
              />
            </Pressable>
          </View>
          <Text variant="caption" color={c.secondary} style={{ textAlign: 'center' }}>
            General information, not diagnosis. Records change only when you save them.
          </Text>
        </View>
      }
    >
      {/* Header */}
      <View style={[s.between, { marginBottom: space.lg, minHeight: 44 }]}>
        <View style={[s.row, { gap: space.md, flex: 1 }]}>
          {NAV_MODE === 'fullscreen' && (
            <IconButton icon={ArrowLeft} label="Back to Today" onPress={() => router.navigate('/')} />
          )}
          <AssistantMark size={44} state={busy ? 'thinking' : cheer ? 'happy' : 'idle'} accessibilityLabel="Tenday assistant" />
          <View style={{ flex: 1 }}>
            <Text variant="heading" accessibilityRole="header">
              Assistant
            </Text>
            <Text variant="caption" color={c.secondary} numberOfLines={1}>
              {connected ? 'Knows your goal, meals and reports' : 'Offline · messages wait here'}
            </Text>
          </View>
        </View>
        <View style={[s.row, { gap: 6 }]}>
          <IconButton
            icon={SlidersHorizontal}
            label="Edit remembered preferences"
            onPress={() => router.push('/goal')}
          />
          {!empty && (
            <IconButton
              icon={Trash2}
              label="Clear conversation"
              onPress={() => setConfirmClear(true)}
            />
          )}
        </View>
      </View>

      <View style={{ gap: space.base, flexGrow: 1 }}>
        <ConnectionBanner />
        {confirmClear && (
          <Card tone="outline" style={{ gap: space.sm }}>
            <Text variant="heading">Clear this conversation?</Text>
            <Text variant="small" color={c.secondary}>
              Your goal, meals and reports stay exactly as they are.
            </Text>
            <View style={[s.row, { marginTop: space.sm }]}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Keep it"
                  variant="secondary"
                  size="medium"
                  onPress={() => setConfirmClear(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Clear"
                  variant="danger"
                  size="medium"
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
              </View>
            </View>
          </Card>
        )}

        {empty ? (
          <View style={{ flexGrow: 1, justifyContent: 'center', gap: space.lg, paddingVertical: space.xl }}>
            <View style={{ alignItems: 'center', gap: space.md }}>
              <AssistantMark size={96} />
              <Text variant="title" style={{ textAlign: 'center' }}>
                How can I help today?
              </Text>
              <Text color={c.secondary} style={{ textAlign: 'center', maxWidth: 300 }}>
                Ask about your saved meals or reports, or find one small step for your goal.
              </Text>
            </View>
            <View style={{ gap: space.sm }}>
              {SUGGESTIONS.map((text) => (
                <Pressable
                  key={text}
                  accessibilityRole="button"
                  onPress={() => {
                    void draft.change({ text, operationId: operationId() });
                  }}
                  style={({ pressed }) => [
                    s.between,
                    {
                      backgroundColor: pressed ? c.surfaceStrong : c.surface,
                      borderRadius: radius.lg,
                      paddingHorizontal: space.base,
                      minHeight: 56,
                    },
                  ]}
                >
                  <Text variant="smallStrong" style={{ flex: 1 }}>
                    {text}
                  </Text>
                  <ArrowUp size={16} color={c.secondary} style={{ transform: [{ rotate: '45deg' }] }} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <>
            {profile?.goal.preferences ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remembered preference: ${profile.goal.preferences}. Edit or forget`}
                onPress={() => router.push('/goal')}
                style={({ pressed }) => [
                  s.row,
                  {
                    gap: space.md,
                    backgroundColor: pressed ? c.surfaceStrong : c.surface,
                    borderRadius: radius.lg,
                    padding: space.md,
                    alignItems: 'flex-start',
                  },
                ]}
              >
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.screen, alignItems: 'center', justifyContent: 'center' }}>
                  <History size={16} color={c.ink} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="caption" color={c.secondary}>
                    Remembered because you confirmed it
                  </Text>
                  <Text variant="small" numberOfLines={2}>
                    {profile.goal.preferences}
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {status === 'CanLoadMore' && (
              <View style={{ alignItems: 'center' }}>
                <Chip label="Earlier messages" icon={History} onPress={() => loadMore(30)} />
              </View>
            )}
            {messages.map((m) =>
              m.role === 'user' ? (
                <View
                  key={m.id}
                  style={{
                    alignSelf: 'flex-end',
                    maxWidth: '85%',
                    backgroundColor: c.ink,
                    borderRadius: 22,
                    borderBottomRightRadius: 6,
                    paddingHorizontal: space.base,
                    paddingVertical: 11,
                  }}
                >
                  <Text selectable color={c.onInk}>
                    {m.text}
                  </Text>
                </View>
              ) : (
                <View key={m.id} style={{ gap: space.sm, maxWidth: '100%' }}>
                  <View style={[s.row, { gap: space.sm }]}>
                    <AssistantMark size={26} live={false} />
                    <Text variant="smallStrong">Tenday</Text>
                  </View>
                  <Text selectable style={{ lineHeight: 25 }}>
                    {m.text}
                  </Text>
                  {m.status === 'failed' && (
                    <Text variant="caption" color={c.error}>
                      This reply couldn’t finish.
                    </Text>
                  )}
                </View>
              ),
            )}
          </>
        )}
        {busy && (
          <View style={[s.row, { gap: space.sm }]} accessibilityLiveRegion="polite">
            <AssistantMark size={28} state="thinking" />
            <View style={[s.row, { gap: 8, backgroundColor: c.surface, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 }]}>
              <Text variant="small" color={c.secondary}>
                Thinking with your goal, meals and reports…
              </Text>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
