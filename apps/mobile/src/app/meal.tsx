import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useAuthToken } from '@convex-dev/auth/react';
import { operationId } from '../lib/operation-id';
import * as ImagePicker from 'expo-image-picker';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import {
  Camera,
  Images,
  Mic,
  Square,
  Check,
  ShieldCheck,
  Sparkles,
  X,
  Trash2,
  ArrowLeft,
} from 'lucide-react-native';
import {
  blankItem,
  localDay,
  localTime,
  mealSchema,
  type MealInput,
} from '@tenday/domain';
import { api, type Doc, type Id } from '../lib/backend';
import { useApp, message } from '../lib/app-state';
import { useDraft } from '../lib/storage';
import { mealPhoto, preparePhoto, uploadFile } from '../lib/files';
import {
  Banner,
  Button,
  IconButton,
  Input,
  Loading,
  Screen,
  Text,
  s,
} from '../components/ui';
import { MealReview } from '../features/meal-review';
import { c, radius, space } from '../theme/tokens';

function CaptureTile({
  icon: Icon,
  title,
  subtitle,
  onPress,
  disabled,
  active,
}: {
  icon: typeof Camera;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 112,
        borderRadius: radius.lg,
        padding: space.base,
        justifyContent: 'space-between',
        backgroundColor: active ? c.lime : pressed ? c.surfaceStrong : c.surface,
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: active ? c.ink : c.screen,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={19} color={active ? c.lime : c.ink} strokeWidth={2.2} />
      </View>
      <View style={{ gap: 2 }}>
        <Text variant="strong">{title}</Text>
        <Text variant="caption" color={active ? c.limeInk : c.secondary}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

type Draft = {
  day: string;
  time: string;
  text: string;
  operationId: string;
  source: MealInput['source'];
  photo?: { uri: string; fileId?: Id<'files'> };
  review?: MealInput;
};
export default function MealScreen() {
  const { id } = useLocalSearchParams<{ id?: Id<'meals'> }>();
  const existing = useQuery(api.records.meal, id ? { id } : 'skip');
  if (id && !existing) return <Loading />;
  return <MealEditor key={id ?? 'new'} existing={existing} />;
}
function MealEditor({ existing }: { existing?: Doc<'meals'> | null }) {
  const router = useRouter();
  const { sessionId, enqueue, connected, toast } = useApp();
  const token = useAuthToken();
  const draft = useDraft<Draft>(
    `tenday:meal:${sessionId}:${existing?._id ?? 'new'}`,
    {
      day: localDay(),
      time: localTime(),
      text: '',
      operationId: operationId(),
      source: 'text',
      review: existing?.meal,
    },
  );
  const { change: changeDraft, value: draftValue } = draft;
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const generation = useRef(0);
  const saveLock = useRef(false);
  const analysisLock = useRef(false);
  const analyse = useAction(api.ai.analyseMeal);
  const remove = useMutation(api.records.deleteMeal);
  const job = useQuery(
    api.jobs.get,
    draft.ready && draft.value.operationId
      ? { operationId: draft.value.operationId }
      : 'skip',
  );
  useEffect(() => {
    if (job?.status === 'ready' && job.output && !draftValue.review) {
      try {
        const parsed = JSON.parse(job.output);
        void changeDraft((old) => ({
          ...old,
          review: {
            ...parsed,
            day: old.day ?? localDay(),
            time: old.time ?? localTime(),
            source: old.source,
          },
        }));
        setBusy('');
      } catch {
        setError('This draft could not be restored. Try analysis again.');
      }
    }
    if (job?.status === 'error') {
      setError(job.error ?? 'Analysis could not finish.');
      setBusy('');
    }
  }, [job, draftValue.review, changeDraft]);
  useEffect(
    () => () => {
      generation.current++;
      ExpoSpeechRecognitionModule.abort();
    },
    [],
  );
  useEffect(() => {
    void ImagePicker.getPendingResultAsync()
      .then(async (result) => {
        if (result && 'assets' in result && result.assets?.[0]) {
          const photo = await preparePhoto(result.assets[0]);
          await changeDraft((old) => ({
            ...old,
            photo: { uri: photo.uri },
            source: 'photo',
            operationId: operationId(),
            review: undefined,
          }));
        }
      })
      .catch(() => {});
  }, [changeDraft]);
  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript;
    if (text)
      void draft.change((old) => ({
        ...old,
        text,
        source: 'voice',
        operationId: operationId(),
      }));
  });
  useSpeechRecognitionEvent('error', () => {
    setListening(false);
    setError(
      'Voice recognition is unavailable. You can type the same description or use a photo.',
    );
  });
  if (!draft.ready) return <Loading />;
  async function photo(camera: boolean) {
    setError('');
    try {
      const result = await mealPhoto(camera);
      if (result)
        await draft.change((old) => ({
          ...old,
          source: 'photo',
          photo: { uri: result.uri },
          operationId: operationId(),
          review: undefined,
        }));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'The photo could not open. Try text instead.',
      );
    }
  }
  async function voice() {
    setError('');
    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable())
        throw new Error();
      const permissions =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permissions.granted) {
        setError(
          'Microphone access is off. Enable it in settings or type your meal.',
        );
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
    } catch {
      setError(
        'This device has no available speech service. Type a description or choose a photo.',
      );
    }
  }
  async function run() {
    if (busy || saveLock.current || analysisLock.current) return;
    if (!connected) {
      setError(
        'AI needs a connection. Your description is kept; you can also enter the meal manually.',
      );
      return;
    }
    analysisLock.current = true;
    setError('');
    const ticket = ++generation.current;
    try {
      let fileId = draft.value.photo?.fileId;
      if (draft.value.photo && !fileId) {
        setBusy('Uploading photo…');
        fileId = await uploadFile(
          draft.value.photo.uri,
          'meal.jpg',
          'image/jpeg',
          'meal',
          token,
        );
        await draft.change((old) => ({
          ...old,
          photo: { uri: old.photo!.uri, fileId },
        }));
      }
      setBusy('Making an editable estimate…');
      const result = await analyse({
        operationId: draft.value.operationId,
        text: draft.value.text,
        fileId,
      });
      if (generation.current !== ticket) return;
      if (result.status === 'error')
        setError(result.error ?? 'Try again later.');
      setBusy('');
    } catch (e) {
      if (generation.current === ticket) {
        setError(
          e instanceof Error && !(e as { data?: unknown }).data
            ? e.message
            : message(e),
        );
        setBusy('');
      }
    } finally {
      analysisLock.current = false;
    }
  }
  async function save() {
    if (saveLock.current || !draft.value.review) return;
    const parsed = mealSchema.safeParse(draft.value.review);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? 'Check each food, portion and date.',
      );
      return;
    }
    saveLock.current = true;
    setBusy('Keeping your confirmed meal…');
    try {
      await enqueue({
        kind: 'meal',
        operationId: draft.value.operationId,
        meal: parsed.data,
        id: existing?._id,
        revision: existing?.revision,
        status: 'queued',
      });
      await draft.clear();
      router.back();
    } catch (e) {
      setError(message(e));
      setBusy('');
      saveLock.current = false;
    }
  }
  const review = draft.value.review;
  const capturing = !!busy || listening;
  function manual() {
    generation.current++;
    setBusy('');
    void draft.change((old) => ({
      ...old,
      operationId: operationId(),
      source: 'manual',
      review: {
        title: '',
        items: [blankItem()],
        day: old.day ?? localDay(),
        time: old.time ?? localTime(),
        note: '',
        source: 'manual',
      },
    }));
  }
  return (
    <Screen
      close
      eyebrow={review ? (existing ? 'Saved meal' : 'Review') : 'New meal'}
      title={
        review
          ? existing
            ? 'Edit your meal'
            : 'Does this look right?'
          : 'What are you eating?'
      }
      subtitle={
        review
          ? 'Adjust anything before saving. Nothing is logged until you do.'
          : 'Snap it, say it or type it. You’ll review an estimate first.'
      }
      trailing={
        review && !existing ? (
          <Button
            title="Recapture"
            icon={ArrowLeft}
            size="small"
            variant="secondary"
            onPress={() => {
              void draft.change((old) => ({
                ...old,
                review: undefined,
                operationId: operationId(),
              }));
            }}
          />
        ) : undefined
      }
      footer={
        review ? (
          <Button
            title={busy || 'Save meal'}
            icon={Check}
            busy={!!busy}
            onPress={save}
          />
        ) : (
          <>
            <Button
              title={busy || 'Estimate my meal'}
              icon={Sparkles}
              busy={!!busy}
              onPress={run}
              disabled={!draft.value.text.trim() && !draft.value.photo}
            />
            <Button title="Enter manually" variant="ghost" size="medium" onPress={manual} />
          </>
        )
      }
    >
      <View style={{ gap: space.base }}>
        {!!error && <Banner error>{error}</Banner>}
        {draft.value.photo && (
          <View>
            <Image
              source={{ uri: draft.value.photo.uri }}
              style={{
                width: '100%',
                height: review ? 170 : 220,
                borderRadius: radius.xl,
                backgroundColor: c.surface,
              }}
              resizeMode="cover"
              accessibilityLabel="Selected meal photo"
            />
            {!review && (
              <View style={{ position: 'absolute', top: 12, right: 12 }}>
                <IconButton
                  icon={X}
                  label="Remove photo"
                  tone="outline"
                  size={38}
                  onPress={() => {
                    void draft.change((old) => ({
                      ...old,
                      photo: undefined,
                      source: 'text',
                      operationId: operationId(),
                    }));
                  }}
                />
              </View>
            )}
          </View>
        )}
        {review ? (
          <>
            <MealReview
              meal={review}
              onChange={(meal) => {
                void draft.change((old) => ({ ...old, review: meal }));
              }}
            />
            {existing && (
              <Button
                title="Delete this meal"
                icon={Trash2}
                variant="danger"
                size="medium"
                onPress={async () => {
                  if (!connected) {
                    setError('Reconnect to delete this meal.');
                    return;
                  }
                  setBusy('Deleting…');
                  try {
                    await remove({ id: existing._id });
                    await draft.clear();
                    toast('Meal removed. Your totals are updated.');
                    router.back();
                  } catch (e) {
                    setError(message(e));
                    setBusy('');
                  }
                }}
              />
            )}
          </>
        ) : (
          <>
            {!draft.value.photo && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Take a photo"
                disabled={capturing}
                onPress={() => {
                  void photo(true);
                }}
                style={({ pressed }) => ({
                  minHeight: 150,
                  borderRadius: radius.xl,
                  backgroundColor: pressed ? c.inkSoft : c.ink,
                  padding: space.lg,
                  justifyContent: 'space-between',
                  opacity: capturing ? 0.5 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                })}
              >
                <View style={s.between}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: c.lime,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Camera size={22} color={c.ink} strokeWidth={2.2} />
                  </View>
                  <Text variant="eyebrow" color={c.lime}>
                    Fastest
                  </Text>
                </View>
                <View style={{ gap: 2 }}>
                  <Text variant="section" color={c.onInk}>
                    Take a photo
                  </Text>
                  <Text variant="small" color={c.onInkMuted}>
                    Point at your plate. We’ll estimate each item.
                  </Text>
                </View>
              </Pressable>
            )}
            <View style={[s.row, { gap: 10, alignItems: 'stretch' }]}>
              <CaptureTile
                icon={draft.value.photo ? Camera : Images}
                title={draft.value.photo ? 'Retake' : 'Library'}
                subtitle={draft.value.photo ? 'Use the camera' : 'Choose a photo'}
                disabled={capturing}
                onPress={() => {
                  void photo(!!draft.value.photo);
                }}
              />
              <CaptureTile
                icon={listening ? Square : Mic}
                title={listening ? 'Listening…' : 'Speak'}
                subtitle={listening ? 'Tap to stop' : 'Describe it aloud'}
                active={listening}
                disabled={!!busy}
                onPress={
                  listening ? () => ExpoSpeechRecognitionModule.stop() : voice
                }
              />
            </View>
            {listening && (
              <Banner tone="lime">
                Describe your meal, with amounts if you know them. Your device’s
                speech service turns it into text.
              </Banner>
            )}
            <Input
              label={
                draft.value.source === 'voice'
                  ? 'Your words — edit if needed'
                  : draft.value.photo
                    ? 'Add detail (optional)'
                    : 'Or type it'
              }
              placeholder="Two eggs on toast with a little butter…"
              multiline
              value={draft.value.text}
              editable={!busy}
              maxLength={3000}
              onChangeText={(text) => {
                void draft.change((old) => ({
                  ...old,
                  text,
                  operationId: operationId(),
                }));
                setError('');
              }}
            />
            {busy ? (
              <Banner tone="lime">
                {`${busy} You can close this sheet; your input is kept.`}
              </Banner>
            ) : (
              <View style={[s.row, { gap: 8 }]}>
                <ShieldCheck size={16} color={c.secondary} strokeWidth={2.2} />
                <Text variant="caption" color={c.secondary} style={{ flex: 1 }}>
                  One quick review. Nothing is saved until you confirm.
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
