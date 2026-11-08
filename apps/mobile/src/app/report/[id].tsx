import { useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useAuthToken } from '@convex-dev/auth/react';
import {
  ExternalLink,
  FileText,
  Info,
  PenLine,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { comparable, readingStatus } from '@tenday/domain';
import { api, type Id } from '../../lib/backend';
import { useApp, message } from '../../lib/app-state';
import { openSource } from '../../lib/files';
import {
  Banner,
  Button,
  Card,
  Group,
  IconButton,
  LinkButton,
  Loading,
  Row,
  Screen,
  Section,
  Text,
  s,
} from '../../components/ui';
import { RangeBar, StatusChip, statusCounts } from '../../features/reading';
import { formatDay } from '../../lib/format';
import { c, radius, space } from '../../theme/tokens';

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
  if (!report) return <Loading label="Opening report…" />;
  const counts = statusCounts(report.report.readings);
  return (
    <Screen
      back
      trailing={
        <IconButton
          icon={Trash2}
          label="Delete report and source"
          onPress={() => setConfirmDelete(true)}
        />
      }
      eyebrow={`${formatDay(report.day)} · Confirmed by you`}
      title={report.report.title}
      footer={
        <Button
          title="Understand this report"
          icon={Sparkles}
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
        {confirmDelete && (
          <Card tone="outline" style={{ gap: space.sm }}>
            <Text variant="heading">Delete this report and its source?</Text>
            <Text variant="small" color={c.secondary}>
              Its readings will be removed from future guidance. Earlier
              conversation messages can be cleared in Assistant.
            </Text>
            <View style={[s.row, { marginTop: space.sm }]}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Keep"
                  variant="secondary"
                  size="medium"
                  onPress={() => setConfirmDelete(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Delete"
                  variant="danger"
                  size="medium"
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
              </View>
            </View>
          </Card>
        )}

        {/* Summary */}
        <View style={[s.row, { gap: 10, alignItems: 'stretch' }]}>
          {(
            [
              ['In range', counts.within, c.successSurface, c.success],
              ['Outside', counts.outside, c.warningSurface, c.warning],
              ['No range', counts.unavailable, c.surface, c.secondary],
            ] as const
          ).map(([label, n, bg, ink]) => (
            <View
              key={label}
              accessible
              accessibilityLabel={`${n} ${label}`}
              style={{
                flex: 1,
                backgroundColor: bg,
                borderRadius: radius.lg,
                padding: 14,
                gap: 2,
              }}
            >
              <Text variant="metricSm" color={c.ink} tabular>
                {n}
              </Text>
              <Text variant="caption" color={ink}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {report.file ? (
          <Group>
            <Row
              padded
              icon={FileText}
              title="Original source"
              subtitle={busy ? 'Opening…' : report.file.name}
              chevron={false}
              trailing={
                busy ? (
                  <ActivityIndicator size="small" color={c.ink} />
                ) : (
                  <ExternalLink size={18} color={c.secondary} />
                )
              }
              onPress={async () => {
                if (busy) return;
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
          </Group>
        ) : (
          <Banner title="Entered manually">
            No original file is attached to these values.
          </Banner>
        )}
      </View>

      <Section
        title="Results"
        subtitle="Exact values with the lab’s own intervals"
      />
      <View style={{ gap: 10 }}>
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
            <View
              key={i}
              style={{
                backgroundColor: c.surface,
                borderRadius: radius.lg,
                padding: space.base,
                gap: space.sm,
              }}
            >
              <View style={[s.between, { alignItems: 'flex-start' }]}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text variant="strong">{reading.marker}</Text>
                  <StatusChip reading={reading} />
                </View>
                <View style={{ alignItems: 'flex-end', maxWidth: '50%' }}>
                  <Text
                    variant="metricSm"
                    tabular
                    color={status === 'above' || status === 'below' ? c.warning : c.ink}
                  >
                    {reading.value}
                  </Text>
                  {!!reading.unit && (
                    <Text variant="caption" color={c.secondary}>
                      {reading.unit}
                    </Text>
                  )}
                </View>
              </View>
              <RangeBar reading={reading} />
              <Text variant="caption" color={c.secondary}>
                Lab interval: {reading.reference || 'Not supplied'}
                {reading.page ? ` · Page ${reading.page}` : ''}
              </Text>
              {previous.length > 0 && (
                <View
                  style={{
                    gap: 6,
                    borderTopWidth: 1,
                    borderColor: c.line,
                    paddingTop: space.sm,
                    marginTop: 2,
                  }}
                >
                  <Text variant="caption" color={c.secondary}>
                    Earlier · same marker and unit
                  </Text>
                  <View style={[s.row, { flexWrap: 'wrap', gap: 6 }]}>
                    {previous.map((p) => (
                      <View
                        key={`${p.day}:${p.value}`}
                        style={[
                          s.row,
                          {
                            gap: 6,
                            backgroundColor: c.screen,
                            borderRadius: radius.pill,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                          },
                        ]}
                      >
                        <Text variant="caption" color={c.secondary}>
                          {formatDay(p.day, 'short')}
                        </Text>
                        <Text variant="caption" tabular style={{ fontFamily: 'Inter_700Bold' }}>
                          {p.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text variant="caption" color={c.muted}>
                    Methods may differ between labs; a few readings don’t establish a trend.
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {!!report.report.note && (
        <View style={[s.row, { gap: 8, marginTop: space.base, alignItems: 'flex-start' }]}>
          <PenLine size={15} color={c.secondary} style={{ marginTop: 2 }} />
          <Text variant="small" color={c.secondary} style={{ flex: 1 }}>
            {report.report.note}
          </Text>
        </View>
      )}

      <Card tone="lime" style={{ marginTop: space.lg, gap: space.sm }}>
        <View style={[s.row, { gap: 6 }]}>
          <Info size={15} color={c.limeInk} strokeWidth={2.4} />
          <Text variant="eyebrow" color={c.limeInk}>
            Keep in mind
          </Text>
        </View>
        <Text variant="heading">A result is one piece of the picture.</Text>
        <Text variant="small" color={c.inkSoft}>
          Intervals vary by lab and method. A value inside or outside one
          doesn’t establish a diagnosis. Review questions with your clinician.
        </Text>
        <LinkButton
          title="How to read lab results · MedlinePlus"
          onPress={() => {
            void Linking.openURL(
              'https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/',
            );
          }}
        />
      </Card>
    </Screen>
  );
}
