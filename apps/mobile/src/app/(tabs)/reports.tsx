import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePaginatedQuery } from 'convex/react';
import {
  ArrowUpRight,
  FileText,
  FlaskConical,
  Plus,
  ShieldCheck,
} from 'lucide-react-native';
import { type Reading } from '@tenday/domain';
import { statusCounts } from '../../features/reading';
import { api, type Doc } from '../../lib/backend';
import { ConnectionBanner, useApp } from '../../lib/app-state';
import {
  Button,
  Chip,
  Empty,
  Group,
  Loading,
  Row,
  Screen,
  Section,
  Text,
  s,
} from '../../components/ui';
import { AccountBar } from '../../features/auth';
import { useIdentity } from '../../lib/auth-session';
import { formatDay } from '../../lib/format';
import { c, radius, space } from '../../theme/tokens';

function StatusChips({ readings }: { readings: Reading[] }) {
  const n = statusCounts(readings);
  return (
    <View style={[s.row, { flexWrap: 'wrap', gap: 6 }]}>
      {n.within > 0 && <Chip label={`${n.within} in range`} tone="success" />}
      {n.outside > 0 && <Chip label={`${n.outside} outside range`} tone="warning" />}
      {n.unavailable > 0 && <Chip label={`${n.unavailable} no range`} />}
    </View>
  );
}

function LeadReport({ r }: { r: Doc<'reports'> }) {
  const router = useRouter();
  const count = r.report.readings.length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Latest report: ${r.report.title}, ${formatDay(r.day)}, ${count} values. Open`}
      onPress={() =>
        router.push({ pathname: '/report/[id]', params: { id: r._id } })
      }
      style={({ pressed }) => ({
        backgroundColor: c.ink,
        borderRadius: radius.xl,
        padding: space.lg,
        gap: space.base,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View style={s.between}>
        <Text variant="eyebrow" color={c.lime}>
          Latest · {formatDay(r.day, 'short')}
        </Text>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: c.lime,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowUpRight size={18} color={c.ink} strokeWidth={2.4} />
        </View>
      </View>
      <Text variant="title" color={c.onInk} numberOfLines={3}>
        {r.report.title}
      </Text>
      <View style={[s.row, { gap: space.lg }]}>
        {(() => {
          const n = statusCounts(r.report.readings);
          return (
            [
              [count, 'values'],
              [n.within, 'in range'],
              [n.outside, 'outside'],
            ] as const
          ).map(([v, label]) => (
            <View key={label} style={{ gap: 2 }}>
              <Text variant="metricSm" color={c.onInk} tabular>
                {v}
              </Text>
              <Text variant="caption" color={c.onInkMuted}>
                {label}
              </Text>
            </View>
          ));
        })()}
      </View>
    </Pressable>
  );
}

export default function Reports() {
  const router = useRouter();
  const { account } = useIdentity();
  const { connected } = useApp();
  const { results, status, loadMore } = usePaginatedQuery(
    api.records.reports,
    {},
    { initialNumItems: 20 },
  );
  const add = (
    <Button
      title="Add"
      icon={Plus}
      size="small"
      compact
      onPress={() => router.push('/report/new')}
    />
  );
  if (status === 'LoadingFirstPage')
    return connected ? (
      <Loading label="Opening your reports…" />
    ) : (
      <Screen>
        <AccountBar back />
        <Text variant="display" accessibilityRole="header" style={{ marginBottom: space.lg }}>
          Reports
        </Text>
        <ConnectionBanner />
      </Screen>
    );
  const [lead, ...rest] = results;
  return (
    <Screen>
      <AccountBar back />
      <View style={[s.between, { alignItems: 'flex-end', marginBottom: space.lg }]}>
        <View style={{ gap: 6, flex: 1 }}>
          <Text variant="eyebrow" color={c.secondary}>
            Health records
          </Text>
          <Text variant="display" accessibilityRole="header">
            Reports
          </Text>
        </View>
        {results.length > 0 && add}
      </View>
      <View style={s.stack}>
        <ConnectionBanner />
        {results.length === 0 ? (
          <Empty
            icon={FlaskConical}
            title="From report to understanding"
            body="Add a lab report. You’ll check the extracted values, then keep a clear record with its original source."
            action={
              <Button
                title="Add your first report"
                icon={Plus}
                onPress={() => router.push('/report/new')}
              />
            }
          />
        ) : (
          <>
            <LeadReport r={lead} />
            {rest.length > 0 && <Section title="Earlier" />}
            {rest.length > 0 && (
              <Group>
                {rest.map((r) => (
                  <Row
                    key={r._id}
                    padded
                    leading={
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          backgroundColor: c.screen,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileText size={20} color={c.ink} strokeWidth={2} />
                      </View>
                    }
                    title={r.report.title}
                    subtitle={`${formatDay(r.day)} · ${r.report.readings.length} ${r.report.readings.length === 1 ? 'value' : 'values'}`}
                    trailing={
                      statusCounts(r.report.readings).outside > 0 ? (
                        <View
                          accessibilityLabel="Has values outside range"
                          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.carbs }}
                        />
                      ) : undefined
                    }
                    onPress={() =>
                      router.push({
                        pathname: '/report/[id]',
                        params: { id: r._id },
                      })
                    }
                  />
                ))}
              </Group>
            )}
            {lead && rest.length === 0 && (
              <View style={{ marginTop: space.xs }}>
                <StatusChips readings={lead.report.readings} />
              </View>
            )}
            {status === 'CanLoadMore' && (
              <Button
                title="Earlier reports"
                variant="secondary"
                size="medium"
                onPress={() => loadMore(20)}
              />
            )}
          </>
        )}
        <View style={[s.row, { gap: 8, marginTop: space.lg, alignItems: 'flex-start' }]}>
          <ShieldCheck size={16} color={c.secondary} strokeWidth={2.2} style={{ marginTop: 1 }} />
          <Text variant="caption" color={c.secondary} style={{ flex: 1 }}>
            {account?.demo
              ? 'Shared demo reports with fictional values. '
              : 'Reviewed by you and kept private. '}
            JPEG/PNG images or text PDFs up to 3 pages and 6 MB. Unconfirmed
            uploads expire after 24 hours.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
