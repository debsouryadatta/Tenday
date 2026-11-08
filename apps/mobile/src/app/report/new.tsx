import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAction, useQuery } from 'convex/react';
import { useAuthToken } from '@convex-dev/auth/react';
import { operationId } from '../../lib/operation-id';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FileText,
  FileUp,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { localDay, reportSchema, type ReportInput } from '@tenday/domain';
import { api, type Id } from '../../lib/backend';
import { useApp, message } from '../../lib/app-state';
import { useDraft } from '../../lib/storage';
import { openSource, uploadFile } from '../../lib/files';
import {
  Banner,
  Button,
  Group,
  LinkButton,
  Loading,
  Row,
  Screen,
  Text,
  s,
} from '../../components/ui';
import { blankReading, ReportReview } from '../../features/report-review';
import { c, radius, space } from '../../theme/tokens';

const STEPS = [
  ['Upload', 'A short lab PDF or a clear photo'],
  ['Review', 'Check each value against the source'],
  ['Keep', 'Saved with its original, privately'],
] as const;

type Draft = {
  operationId: string;
  file?: { uri: string; name: string; mime: string; fileId?: Id<'files'> };
  review?: ReportInput;
};
export default function AddReport() {
  const router = useRouter();
  const { sessionId, connected, enqueue } = useApp();
  const token = useAuthToken();
  const draft = useDraft<Draft>(`tenday:report:${sessionId}`, {
    operationId: operationId(),
  });
  const { change: changeDraft, value: draftValue } = draft;
  const analyse = useAction(api.ai.analyseReport);
  const job = useQuery(
    api.jobs.get,
    draft.ready ? { operationId: draft.value.operationId } : 'skip',
  );
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const locked = useRef(false);
  const analysisLock = useRef(false);
  useEffect(() => {
    if (job?.status === 'ready' && job.output && !draftValue.review) {
      try {
        const review = reportSchema.parse(JSON.parse(job.output));
        void changeDraft((old) => ({ ...old, review }));
        setBusy('');
      } catch {
        setError(
          'This analysis could not be restored. Review manually or retry.',
        );
      }
    }
    if (job?.status === 'error') {
      setBusy('');
      setError(job.error ?? 'The report could not be read.');
    }
  }, [job, draftValue.review, changeDraft]);
  if (!draft.ready) return <Loading />;
  async function choose() {
    setError('');
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    if ((file.size ?? 0) > 6 * 1024 * 1024) {
      setError('Choose a report smaller than 6 MB.');
      return;
    }
    if (
      !file.mimeType ||
      !['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimeType)
    ) {
      setError('Choose a PDF, JPEG, or PNG file.');
      return;
    }
    await draft.change({
      operationId: operationId(),
      file: { uri: file.uri, name: file.name, mime: file.mimeType },
    });
  }
  async function run() {
    if (busy || analysisLock.current || !draft.value.file) return;
    if (!connected) {
      setError(
        'Reconnect to analyse this report. The selected source is kept here.',
      );
      return;
    }
    analysisLock.current = true;
    setError('');
    try {
      let fileId = draft.value.file.fileId;
      if (!fileId) {
        setBusy('Uploading your source…');
        fileId = await uploadFile(
          draft.value.file.uri,
          draft.value.file.name,
          draft.value.file.mime,
          'report',
          token,
        );
        await draft.change((old) => ({
          ...old,
          file: { ...old.file!, fileId },
        }));
      }
      setBusy('Reading values for your review…');
      const result = await analyse({
        operationId: draft.value.operationId,
        fileId,
        day: localDay(),
      });
      if (result.status === 'error')
        setError(result.error ?? 'Try again or enter values manually.');
      setBusy('');
    } catch (e) {
      setError(
        e instanceof Error && !(e as { data?: unknown }).data
          ? e.message
          : message(e),
      );
      setBusy('');
    } finally {
      analysisLock.current = false;
    }
  }
  async function save() {
    if (locked.current || !draft.value.review) return;
    const parsed = reportSchema.safeParse(draft.value.review);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ??
          'Check each value and the report date.',
      );
      return;
    }
    locked.current = true;
    setBusy('Keeping your confirmed report…');
    try {
      let fileId = draft.value.file?.fileId;
      if (draft.value.file && !fileId) {
        if (!connected)
          throw new Error(
            'Reconnect to attach this source before saving. All your entered values are kept.',
          );
        setBusy('Attaching your source…');
        fileId = await uploadFile(
          draft.value.file.uri,
          draft.value.file.name,
          draft.value.file.mime,
          'report',
          token,
        );
        await draft.change((old) => ({
          ...old,
          file: { ...old.file!, fileId },
        }));
      }
      await enqueue({
        kind: 'report',
        operationId: draft.value.operationId,
        report: parsed.data,
        fileId,
        status: 'queued',
      });
      await draft.clear();
      router.back();
    } catch (e) {
      setError(message(e));
      setBusy('');
      locked.current = false;
    }
  }
  const pickFile = () => {
    void choose().catch(() =>
      setError(
        'The file picker could not open. Try again or enter values manually.',
      ),
    );
  };
  return (
    <Screen
      close
      eyebrow={draft.value.review ? 'Review' : 'New report'}
      title={draft.value.review ? 'Check every value' : 'Add a lab report'}
      subtitle={
        draft.value.review
          ? 'Compare with the source before confirming. Keep exact units and symbols.'
          : 'We’ll read the values for you to review. Nothing is saved until you confirm.'
      }
      trailing={
        draft.value.review ? (
          <Button
            title="Source"
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
        draft.value.review ? (
          <Button
            title={busy || 'Confirm and save'}
            icon={Check}
            onPress={save}
            busy={!!busy}
          />
        ) : (
          <>
            <Button
              title={busy || 'Read values'}
              icon={Sparkles}
              onPress={run}
              busy={!!busy}
              disabled={!draft.value.file}
            />
            <Button
              title="Enter values manually"
              variant="ghost"
              size="medium"
              onPress={() => {
                setBusy('');
                void draft.change((old) => ({
                  ...old,
                  operationId: operationId(),
                  review: {
                    title: '',
                    day: localDay(),
                    readings: [blankReading()],
                    note: 'Values entered manually.',
                  },
                }));
              }}
            />
          </>
        )
      }
    >
      <View style={{ gap: space.base }}>
        {!!error && <Banner error>{error}</Banner>}
        {draft.value.review ? (
          <>
            {draft.value.file?.fileId && (
              <Group>
                <Row
                  padded
                  icon={FileText}
                  title="Check the original"
                  subtitle={draft.value.file.name}
                  chevron={false}
                  trailing={<ExternalLink size={18} color={c.secondary} />}
                  onPress={() => {
                    void openSource(
                      draft.value.file!.fileId!,
                      draft.value.file!.name,
                      token,
                    ).catch((e) =>
                      setError(
                        e instanceof Error ? e.message : 'Source could not open.',
                      ),
                    );
                  }}
                />
              </Group>
            )}
            <ReportReview
              report={draft.value.review}
              onChange={(review) => {
                void draft.change((old) => ({ ...old, review }));
              }}
            />
          </>
        ) : (
          <>
            {draft.value.file ? (
              <View
                style={[
                  s.row,
                  {
                    gap: space.md,
                    backgroundColor: c.surface,
                    borderRadius: radius.xl,
                    padding: space.base,
                  },
                ]}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: c.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={22} color={c.lime} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="strong" numberOfLines={1}>
                    {draft.value.file.name}
                  </Text>
                  <Text variant="caption" color={c.secondary}>
                    {draft.value.file.fileId ? 'Uploaded · not saved yet' : 'Selected · not saved yet'}
                  </Text>
                </View>
                {!busy && <LinkButton title="Change" chevron={false} onPress={pickFile} />}
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose PDF or image"
                disabled={!!busy}
                onPress={pickFile}
                style={({ pressed }) => ({
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: pressed ? c.ink : c.lineStrong,
                  backgroundColor: pressed ? c.surface : c.screen,
                  borderRadius: radius.xl,
                  paddingVertical: space.xl,
                  paddingHorizontal: space.lg,
                  alignItems: 'center',
                  gap: space.sm,
                })}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: c.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: space.xs,
                  }}
                >
                  <FileUp size={24} color={c.lime} strokeWidth={2.2} />
                </View>
                <Text variant="heading">Choose a PDF or image</Text>
                <Text variant="small" color={c.secondary} style={{ textAlign: 'center' }}>
                  JPEG or PNG, or a text-based PDF · up to 3 pages, 6 MB
                </Text>
              </Pressable>
            )}
            {!!busy && <Banner tone="lime">{`${busy} You can close this sheet; your draft is kept.`}</Banner>}
            <View style={{ gap: 0, marginTop: space.sm }}>
              {STEPS.map(([title, body], i) => (
                <View key={title} style={[s.row, { gap: space.md, alignItems: 'flex-start' }]}>
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: i === 0 ? c.lime : c.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text variant="smallStrong">{i + 1}</Text>
                    </View>
                    {i < STEPS.length - 1 && (
                      <View style={{ width: 2, height: 22, backgroundColor: c.surfaceStrong }} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingTop: 4, gap: 1 }}>
                    <Text variant="smallStrong">{title}</Text>
                    <Text variant="caption" color={c.secondary}>
                      {body}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={[s.row, { gap: 8, alignItems: 'flex-start', marginTop: space.sm }]}>
              <ShieldCheck size={16} color={c.secondary} strokeWidth={2.2} style={{ marginTop: 1 }} />
              <Text variant="caption" color={c.secondary} style={{ flex: 1 }}>
                AI reads only the file you choose, when you tap Read values. For
                scanned PDFs, use clear page photos. Unconfirmed uploads expire
                after 24 hours. Tenday never turns a result into a diagnosis.
              </Text>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
