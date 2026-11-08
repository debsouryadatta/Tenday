import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAction, useQuery } from 'convex/react';
import { useAuthToken } from '@convex-dev/auth/react';
import { operationId } from '../../lib/operation-id';
import * as DocumentPicker from 'expo-document-picker';
import { Check, FileUp, ShieldCheck } from 'lucide-react-native';
import { localDay, reportSchema, type ReportInput } from '@tenday/domain';
import { api, type Id } from '../../lib/backend';
import { useApp, message } from '../../lib/app-state';
import { useDraft } from '../../lib/storage';
import { openSource, uploadFile } from '../../lib/files';
import {
  Banner,
  Button,
  Card,
  Loading,
  Screen,
  Text,
  s,
} from '../../components/ui';
import { blankReading, ReportReview } from '../../features/report-review';
import { c, space } from '../../theme/tokens';

type Draft = {
  operationId: string;
  file?: { uri: string; name: string; mime: string; fileId?: Id<'files'> };
  review?: ReportInput;
};
export default function AddReport() {
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
        setBusy('Uploading your private source…');
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
        setBusy('Attaching your private source…');
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
  return (
    <Screen
      close
      title={
        draft.value.review
          ? 'Keep the details right.'
          : 'Your report, made clearer.'
      }
      subtitle={
        draft.value.review
          ? 'Check every value against the source before confirming.'
          : 'Upload a short lab report. You’ll review the values before saving.'
      }
      footer={
        draft.value.review ? (
          <Button
            title="Confirm and save report"
            icon={Check}
            onPress={save}
            busy={!!busy}
          />
        ) : (
          <>
            <Button
              title={busy || 'Extract values for review'}
              onPress={run}
              busy={!!busy}
              disabled={!draft.value.file}
            />
            <Button
              title="Enter values manually"
              variant="secondary"
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
      <View style={s.stack}>
        {!!error && <Banner error>{error}</Banner>}
        {draft.value.review ? (
          <>
            {draft.value.file?.fileId && (
              <Button
                title="Check the original source"
                variant="secondary"
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
            )}
            <ReportReview
              report={draft.value.review}
              onChange={(review) => {
                void draft.change((old) => ({ ...old, review }));
              }}
            />
            <Button
              title="Back to source selection"
              variant="secondary"
              onPress={() => {
                void draft.change((old) => ({
                  ...old,
                  review: undefined,
                  operationId: operationId(),
                }));
              }}
            />
          </>
        ) : (
          <>
            <Card tone="sage">
              <ShieldCheck color={c.forest} size={28} />
              <Text variant="heading">Your source stays attached.</Text>
              <Text color={c.secondary}>
                Keep the report date, exact units, and lab intervals together.
                Tenday won’t turn a result into a diagnosis.
              </Text>
            </Card>
            <Button
              title={
                draft.value.file
                  ? 'Choose a different source'
                  : 'Choose PDF or image'
              }
              icon={FileUp}
              variant="secondary"
              onPress={() => {
                void choose().catch(() =>
                  setError(
                    'The file picker could not open. Try again or enter values manually.',
                  ),
                );
              }}
              disabled={!!busy}
            />
            {draft.value.file && (
              <Card tone="outline">
                <Text variant="strong">{draft.value.file.name}</Text>
                <Text variant="small" color={c.secondary}>
                  Selected, not yet confirmed.
                </Text>
              </Card>
            )}
            {!!busy && (
              <Banner>
                {busy} You can close this sheet; your draft is kept.
              </Banner>
            )}
            <View style={{ marginTop: space.sm, gap: space.base }}>
              <Text variant="small" color={c.secondary}>
                JPEG/PNG images or text-based PDFs, up to 3 pages and 6 MB. For
                scanned PDFs, choose clear page images instead.
              </Text>
              <Text variant="small" color={c.muted}>
                AI reads the source you choose when you tap Extract values.
                Unconfirmed cloud uploads expire after 24 hours.
              </Text>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
