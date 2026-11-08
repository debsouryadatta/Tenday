import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Cookie,
  Moon,
  Sun,
  Sunrise,
  type LucideIcon,
} from 'lucide-react-native';
import { totals } from '@tenday/domain';
import type { Doc } from '../lib/backend';
import { Text, s } from '../components/ui';
import { c, radius, space } from '../theme/tokens';
import { formatDay } from '../lib/format';

/** A meal-time cue derived from the saved time (no extra data). */
export function mealMoment(time: string): {
  icon: LucideIcon;
  label: string;
  bg: string;
} {
  const h = Number(time.slice(0, 2));
  if (h >= 4 && h < 11) return { icon: Sunrise, label: 'Breakfast', bg: c.carbsSoft };
  if (h >= 11 && h < 16) return { icon: Sun, label: 'Lunch', bg: c.limeSoft };
  if (h >= 16 && h < 18) return { icon: Cookie, label: 'Snack', bg: c.proteinSoft };
  return { icon: Moon, label: 'Dinner', bg: c.fatSoft };
}

export function MacroLine({
  protein,
  carbs,
  fat,
}: {
  protein: number;
  carbs: number;
  fat: number;
}) {
  return (
    <View style={[s.row, { gap: space.md, flexWrap: 'wrap' }]}>
      {(
        [
          ['P', protein, c.protein],
          ['C', carbs, c.carbs],
          ['F', fat, c.fat],
        ] as const
      ).map(([k, v, col]) => (
        <View key={k} style={[s.row, { gap: 5 }]}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: col }} />
          <Text variant="caption" color={c.secondary} tabular>
            {k} {Math.round(v)}g
          </Text>
        </View>
      ))}
    </View>
  );
}

export function MealRow({
  entry,
  showDay = false,
}: {
  entry: Doc<'meals'>;
  showDay?: boolean;
}) {
  const router = useRouter();
  const t = totals(entry.meal.items);
  const moment = mealMoment(entry.meal.time);
  const Icon = moment.icon;
  const items = entry.meal.items.length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.meal.title}, ${Math.round(t.calories)} kilocalories, ${entry.meal.time}. Edit meal`}
      onPress={() =>
        router.push({ pathname: '/meal', params: { id: entry._id } })
      }
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          padding: 14,
          borderRadius: radius.lg,
          backgroundColor: pressed ? c.surfaceStrong : c.surface,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: moment.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={22} color={c.ink} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="strong" numberOfLines={1}>
          {entry.meal.title}
        </Text>
        <Text variant="caption" color={c.secondary} numberOfLines={1}>
          {showDay ? `${formatDay(entry.day, 'short')} · ` : `${moment.label} · `}
          {entry.meal.time} · {items} {items === 1 ? 'item' : 'items'}
        </Text>
        <MacroLine protein={t.protein} carbs={t.carbs} fat={t.fat} />
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text variant="metricSm" tabular>
          {Math.round(t.calories)}
        </Text>
        <Text variant="caption" color={c.secondary}>
          kcal
        </Text>
      </View>
    </Pressable>
  );
}
