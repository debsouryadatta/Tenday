import { useNavigate } from 'react-router-dom';
import { Cookie, Moon, Sun, Sunrise, type LucideIcon } from 'lucide-react';
import { totals } from '@tenday/domain';
import type { Doc } from '../lib/backend';
import { formatDay } from '../lib/format';

/** A meal-time cue derived from the saved time (no extra data). */
export function mealMoment(time: string): {
  icon: LucideIcon;
  label: string;
  tone: string;
} {
  const h = Number(time.slice(0, 2));
  if (h >= 4 && h < 11) return { icon: Sunrise, label: 'Breakfast', tone: 'carbs' };
  if (h >= 11 && h < 16) return { icon: Sun, label: 'Lunch', tone: 'lime' };
  if (h >= 16 && h < 18) return { icon: Cookie, label: 'Snack', tone: 'protein' };
  return { icon: Moon, label: 'Dinner', tone: 'fat' };
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
    <span className="macro-line">
      {(
        [
          ['P', protein, 'protein'],
          ['C', carbs, 'carbs'],
          ['F', fat, 'fat'],
        ] as const
      ).map(([k, v, col]) => (
        <span key={k}>
          <i style={{ background: `var(--${col})` }} />
          {k} {Math.round(v)}g
        </span>
      ))}
    </span>
  );
}
export function MealRow({
  entry,
  showDay = false,
  returnTo,
}: {
  entry: Doc<'meals'>;
  showDay?: boolean;
  returnTo?: string;
}) {
  const navigate = useNavigate();
  const t = totals(entry.meal.items);
  const moment = mealMoment(entry.meal.time);
  const Icon = moment.icon;
  const items = entry.meal.items.length;
  return (
    <button
      type="button"
      className="meal-row"
      aria-label={`${entry.meal.title}, ${Math.round(t.calories)} kilocalories, ${entry.meal.time}. Edit meal`}
      onClick={() =>
        navigate(`/meal/${entry._id}`, {
          state: { returnTo: returnTo ?? (showDay ? '/history' : '/') },
        })
      }
    >
      <span className={`meal-tile tone-${moment.tone}`}>
        <Icon size={22} strokeWidth={2} />
      </span>
      <span className="meal-text">
        <strong>{entry.meal.title}</strong>
        <small>
          {showDay ? `${formatDay(entry.day, 'short')} · ` : `${moment.label} · `}
          {entry.meal.time} · {items} {items === 1 ? 'item' : 'items'}
        </small>
        <MacroLine protein={t.protein} carbs={t.carbs} fat={t.fat} />
      </span>
      <span className="meal-kcal">
        <strong>{Math.round(t.calories)}</strong>
        <small>kcal</small>
      </span>
    </button>
  );
}
