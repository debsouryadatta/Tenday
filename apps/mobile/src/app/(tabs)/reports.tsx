import { View } from 'react-native';
import { router } from 'expo-router';
import { usePaginatedQuery } from 'convex/react';
import { FileText, Plus, ShieldCheck } from 'lucide-react-native';
import { api } from '../../lib/backend';
import { ConnectionBanner, useApp } from '../../lib/app-state';
import {
  Button,
  Card,
  Empty,
  Loading,
  Row,
  Screen,
  Text,
  s,
} from '../../components/ui';
import { c, space } from '../../theme/tokens';
export default function Reports() {
  const { connected } = useApp();
  const { results, status, loadMore } = usePaginatedQuery(
    api.records.reports,
    {},
    { initialNumItems: 20 },
  );
  if (status === 'LoadingFirstPage')
    return connected ? (
      <Loading />
    ) : (
      <Screen
        title="Your reports"
        subtitle="Reconnect to open saved reports."
        footer={
          <Button
            title="Add a report"
            icon={Plus}
            onPress={() => router.push('/report/new')}
          />
        }
      >
        <ConnectionBanner />
      </Screen>
    );
  return (
    <Screen
      title="A clearer picture."
      subtitle="Your health reports, with the context kept close."
      footer={
        <Button
          title="Add a report"
          icon={Plus}
          onPress={() => router.push('/report/new')}
        />
      }
    >
      <View style={s.stack}>
        <ConnectionBanner />
        {results.length === 0 ? (
          <Empty
            icon={FileText}
            title="From report to understanding"
            body="Add a lab report. Review the extracted values, then keep a clear record with its original source."
          />
        ) : (
          <>
            <Card tone="sage">
              <View style={s.row}>
                <ShieldCheck color={c.forest} size={22} />
                <Text variant="strong">Reviewed by you. Kept private.</Text>
              </View>
              <Text variant="small" color={c.secondary}>
                Values are shown with their units and the lab’s own reference
                intervals.
              </Text>
            </Card>
            <View style={{ marginTop: space.sm }}>
              {results.map((r) => (
                <Row
                  key={r._id}
                  icon={FileText}
                  title={r.report.title}
                  subtitle={`${r.day} · ${r.report.readings.length} confirmed ${r.report.readings.length === 1 ? 'value' : 'values'}`}
                  onPress={() =>
                    router.push({
                      pathname: '/report/[id]',
                      params: { id: r._id },
                    })
                  }
                />
              ))}
            </View>
            {status === 'CanLoadMore' && (
              <Button
                title="Earlier reports"
                variant="secondary"
                onPress={() => loadMore(20)}
              />
            )}
          </>
        )}
        <Text variant="small" color={c.muted}>
          Supported: JPEG/PNG images and text-based PDFs up to 3 pages, 6 MB.
          Unconfirmed sources expire after 24 hours.
        </Text>
      </View>
    </Screen>
  );
}
