import { usePaginatedQuery } from 'convex/react';
import { Utensils } from 'lucide-react-native';
import { api } from '../lib/backend';
import { Screen, Loading, Empty, Button } from '../components/ui';
import { MealRow } from '../features/meal-row';
export default function History() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.records.mealHistory,
    {},
    { initialNumItems: 20 },
  );
  if (status === 'LoadingFirstPage') return <Loading />;
  return (
    <Screen
      back
      title="Your meal history"
      subtitle="A record of your rhythm, one day at a time."
    >
      {results.length ? (
        results.map((entry) => (
          <MealRow key={entry._id} entry={entry} showDay />
        ))
      ) : (
        <Empty
          icon={Utensils}
          title="A fresh page"
          body="Your confirmed meals will appear here."
        />
      )}
      {status === 'CanLoadMore' && (
        <Button
          title="Show earlier meals"
          variant="secondary"
          onPress={() => loadMore(20)}
        />
      )}
    </Screen>
  );
}
