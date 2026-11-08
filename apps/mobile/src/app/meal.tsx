import { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
  ImagePlus,
  Mic,
  Square,
  PenLine,
  Check,
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
  Card,
  Input,
  Loading,
  Screen,
  Text,
  s,
} from '../components/ui';
import { MealReview } from '../features/meal-review';
import { c, radius, space } from '../theme/tokens';

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
  return (
    <Screen
      close
      title={
        review
          ? existing
            ? 'Edit your meal'
            : 'Does this look right?'
          : 'What’s on your plate?'
      }
      subtitle={
        review
          ? 'You’re in charge. Adjust anything before saving.'
          : 'A photo, your voice, or a few words. Whatever is easiest.'
      }
      footer={
        <>
          {review ? (
            <Button
              title="Save meal"
              icon={Check}
              busy={!!busy}
              onPress={save}
            />
          ) : (
            <Button
              title={busy || 'Review my meal'}
              busy={!!busy}
              onPress={run}
              disabled={!draft.value.text.trim() && !draft.value.photo}
            />
          )}
          {!review && (
            <Button
              title="Enter manually"
              variant="secondary"
              onPress={() => {
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
              }}
            />
          )}
        </>
      }
    >
      <View style={s.stack}>
        {!!error && <Banner error>{error}</Banner>}
        {review ? (
          <>
            <MealReview
              meal={review}
              onChange={(meal) => {
                void draft.change((old) => ({ ...old, review: meal }));
              }}
            />
            {!existing && (
              <Button
                title="Back to capture"
                variant="secondary"
                onPress={() => {
                  void draft.change((old) => ({
                    ...old,
                    review: undefined,
                    operationId: operationId(),
                  }));
                }}
              />
            )}
            {existing && (
              <Button
                title="Delete this meal"
                variant="danger"
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
            <View style={{ gap: space.sm }}>
              <Button
                title="Take a photo"
                icon={Camera}
                variant="quiet"
                onPress={() => {
                  void photo(true);
                }}
                disabled={!!busy || listening}
              />
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Choose photo"
                    icon={ImagePlus}
                    variant="secondary"
                    onPress={() => {
                      void photo(false);
                    }}
                    disabled={!!busy || listening}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title={listening ? 'Stop' : 'Speak'}
                    icon={listening ? Square : Mic}
                    variant="secondary"
                    onPress={
                      listening
                        ? () => ExpoSpeechRecognitionModule.stop()
                        : voice
                    }
                    disabled={!!busy}
                  />
                </View>
              </View>
            </View>
            {listening && (
              <Banner>
                Listening… Describe your meal, including amounts if you know
                them. Your device’s speech service turns it into text.
              </Banner>
            )}
            {draft.value.photo && (
              <Card tone="outline">
                <Image
                  source={{ uri: draft.value.photo.uri }}
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: radius.md,
                  }}
                  resizeMode="cover"
                  accessibilityLabel="Selected meal photo"
                />
                <Button
                  title="Remove photo"
                  variant="secondary"
                  onPress={() => {
                    void draft.change((old) => ({
                      ...old,
                      photo: undefined,
                      source: 'text',
                      operationId: operationId(),
                    }));
                  }}
                />
              </Card>
            )}
            <Input
              label={
                draft.value.source === 'voice'
                  ? 'Your transcript — edit if needed'
                  : 'Or describe your meal'
              }
              placeholder="Two eggs on toast, with a little butter…"
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
            <View style={s.row}>
              <PenLine size={18} color={c.forest} />
              <Text variant="small" color={c.secondary}>
                One review. Nothing saved until you say so.
              </Text>
            </View>
            {!!busy && (
              <Banner>
                {busy} You can close this sheet; your input is kept.
              </Banner>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
