import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useAuthToken } from '@convex-dev/auth/react';
import { FileText, MessageCircle } from 'lucide-react-native';
import { comparable, readingStatus } from '@tenday/domain';
import { api, type Id } from '../../lib/backend';
import { useApp, message } from '../../lib/app-state';
import { openSource } from '../../lib/files';
import {
  Banner,
  Button,
  Card,
  Loading,
  Screen,
  Text,
  s,
} from '../../components/ui';
import { c, space } from '../../theme/tokens';
export default function ReportDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: Id<'reports'> }>();
  const report = useQuery(api.records.report, { id });
  const token = useAuthToken();
  const remove = useMutation(api.records.deleteReport);
  const { connected, toast } = useApp();
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!report) return <Loading />;
  return (
    <Screen
      back
      title={report.report.title}
      subtitle={`${report.day} · Values reviewed and confirmed by you`}
      footer={
        <Button
          title="Understand this report"
          icon={MessageCircle}
          onPress={() =>
            router.push({
              pathname: '/assistant',
              params: {
                reportId: report._id,
                request: String(Date.now()),
              },
            })
          }
        />
      }
    >
      <View style={s.stack}>
        {!!error && <Banner error>{error}</Banner>}
        {report.file ? (
          <Button
            title={`Open source · ${report.file.name}`}
            icon={FileText}
            variant="secondary"
            busy={busy}
            onPress={async () => {
              setBusy(true);
              setError('');
              try {
                await openSource(report.file!.id, report.file!.name, token);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : 'Source could not open.',
                );
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : (
          <Banner>
            These values were entered manually. No original file is attached.
          </Banner>
        )}
        <Card tone="sage">
          <Text variant="strong">A result is one piece of the picture.</Text>
          <Text variant="small" color={c.secondary}>
            Reference intervals vary by lab and method. A value inside or
            outside an interval does not establish a diagnosis. Review questions
            with your clinician.
          </Text>
          <Button
            title="How to read lab results · MedlinePlus"
            compact
            variant="secondary"
            onPress={() => {
              void Linking.openURL(
                'https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/',
              );
            }}
          />
        </Card>
        {report.report.readings.map((reading, i) => {
          const status = readingStatus(reading);
          const previous = report.previous
            .flatMap((r) =>
              r.readings
                .filter((v) => comparable(reading, v))
                .map((v) => ({ day: r.day, value: v.value })),
            )
            .slice(0, 4);
          return (
            <Card key={i} tone="outline">
              <View style={s.between}>
                <Text variant="heading" style={{ flex: 1 }}>
                  {reading.marker}
                </Text>
                <Text variant="heading">
                  {reading.value} {reading.unit}
                </Text>
              </View>
              <Text variant="small" color={c.secondary}>
                Lab interval: {reading.reference || 'Not supplied'}
                {reading.page ? ` · Source page ${reading.page}` : ''}
              </Text>
              <Text
                variant="small"
                color={
                  status === 'above' || status === 'below'
                    ? c.warning
                    : c.secondary
                }
              >
                {status === 'unavailable'
                  ? 'No numeric comparison available.'
                  : status === 'within'
                    ? 'Within the interval supplied with this report.'
                    : `${status === 'above' ? 'Above' : 'Below'} the interval supplied with this report.`}
              </Text>
              {previous.length > 0 && (
                <View style={{ gap: space.xs, marginTop: space.sm }}>
                  <Text variant="small" color={c.secondary}>
                    Earlier recorded values · same marker and unit
                  </Text>
                  {previous.map((p) => (
                    <Text key={`${p.day}:${p.value}`} variant="small">
                      {p.day} · {p.value} {reading.unit}
                    </Text>
                  ))}
                  <Text variant="small" color={c.muted}>
                    Lab methods may differ; these readings alone do not
                    establish a trend.
                  </Text>
                </View>
              )}
            </Card>
          );
        })}
        {!!report.report.note && (
          <Text variant="small" color={c.secondary}>
            {report.report.note}
          </Text>
        )}
        {confirmDelete ? (
          <Card tone="outline">
            <Text variant="strong">Delete this report and source?</Text>
            <Text variant="small" color={c.secondary}>
              Its readings will also be removed from future guidance. Existing
              conversation messages can be cleared in Assistant.
            </Text>
            <Button
              title="Delete report permanently"
              variant="danger"
              onPress={async () => {
                if (!connected) {
                  setError('Reconnect to delete this report.');
                  return;
                }
                try {
                  await remove({ id });
                  toast('Report and source removed.');
                  router.back();
                } catch (e) {
                  setError(message(e));
                }
              }}
            />
            <Button
              title="Keep report"
              variant="secondary"
              onPress={() => setConfirmDelete(false)}
            />
          </Card>
        ) : (
          <Button
            title="Delete report & source"
            variant="danger"
            onPress={() => setConfirmDelete(true)}
          />
        )}
      </View>
    </Screen>
  );
}
