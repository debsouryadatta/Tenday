import { View } from 'react-native';
import { usePaginatedQuery } from 'convex/react';
import { Utensils } from 'lucide-react-native';
import { totals } from '@tenday/domain';
import { api } from '../lib/backend';
import { Screen, Loading, Empty, Button, Text, s } from '../components/ui';
import { MealRow } from '../features/meal-row';
import { formatDay, groupByDay } from '../lib/format';
import { localDay } from '@tenday/domain';
import { c, space } from '../theme/tokens';
export default function History() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.records.mealHistory,
    {},
    { initialNumItems: 20 },
  );
  if (status === 'LoadingFirstPage') return <Loading label="Opening history…" />;
  const today = localDay();
  return (
    <Screen
      back
      eyebrow="Meal history"
      title="Your rhythm"
      subtitle="Every confirmed meal, one day at a time."
    >
      {results.length ? (
        <View style={{ gap: space.xl }}>
          {groupByDay(results).map((group) => {
            const kcal = group.items.reduce(
              (sum, m) => sum + totals(m.meal.items).calories,
              0,
            );
            return (
              <View key={group.day} style={{ gap: 10 }}>
                <View style={[s.between, { alignItems: 'baseline' }]}>
                  <Text variant="heading" accessibilityRole="header">
                    {group.day === today ? 'Today' : formatDay(group.day, 'weekday')}
                  </Text>
                  <Text variant="caption" color={c.secondary} tabular>
                    {group.items.length} {group.items.length === 1 ? 'meal' : 'meals'} ·{' '}
                    {Math.round(kcal).toLocaleString()} kcal
                  </Text>
                </View>
                {group.items.map((entry) => (
                  <MealRow key={entry._id} entry={entry} />
                ))}
              </View>
            );
          })}
        </View>
      ) : (
        <Empty
          icon={Utensils}
          title="A fresh page"
          body="Your confirmed meals will appear here, grouped by day."
        />
      )}
      {status === 'CanLoadMore' && (
        <View style={{ marginTop: space.xl }}>
          <Button
            title="Show earlier meals"
            variant="secondary"
            size="medium"
            onPress={() => loadMore(20)}
          />
        </View>
      )}
    </Screen>
  );
}
