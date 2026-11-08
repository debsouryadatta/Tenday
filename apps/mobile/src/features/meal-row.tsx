import { Utensils } from 'lucide-react-native';
import { router } from 'expo-router';
import { totals } from '@tenday/domain';
import type { Doc } from '../lib/backend';
import { Row, Text } from '../components/ui';
export function MealRow({
  entry,
  showDay = false,
}: {
  entry: Doc<'meals'>;
  showDay?: boolean;
}) {
  return (
    <Row
      icon={Utensils}
      title={entry.meal.title}
      subtitle={`${showDay ? entry.day + ' · ' : ''}${entry.meal.time} · ${entry.meal.items.length} ${entry.meal.items.length === 1 ? 'item' : 'items'}`}
      trailing={
        <Text variant="small">
          {Math.round(totals(entry.meal.items).calories)} kcal
        </Text>
      }
      onPress={() =>
        router.push({ pathname: '/meal', params: { id: entry._id } })
      }
    />
  );
}
