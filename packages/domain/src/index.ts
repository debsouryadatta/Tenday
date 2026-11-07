import { z } from 'zod';

export const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s, 'Choose a valid date');
export const mealItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  portion: z.string().trim().min(1).max(80),
  quantity: z.number().positive().max(100),
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
});
export type MealItem = z.infer<typeof mealItemSchema>;
export const mealSchema = z.object({
  title: z.string().trim().min(1).max(100),
  day: daySchema,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  items: z.array(mealItemSchema).min(1).max(30),
  note: z.string().max(600),
  source: z.enum(['text', 'photo', 'voice', 'manual']),
});
export type MealInput = z.infer<typeof mealSchema>;
export const mealAnalysisSchema = z.object({
  title: z.string().trim().min(1).max(100),
  items: z.array(mealItemSchema).min(1).max(30),
  note: z.string().max(600),
});
export const goalSchema = z.object({
  kind: z.enum(['consistency', 'awareness', 'protein']),
  target: z.number().min(1).max(10000),
  preferences: z.string().trim().max(600),
  rationale: z.string().max(400),
});
export type Goal = z.infer<typeof goalSchema>;
export const readingSchema = z.object({
  marker: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(80),
  unit: z.string().max(50),
  reference: z.string().max(100),
  low: z.number().finite().nullable(),
  high: z.number().finite().nullable(),
  page: z.number().int().min(1).max(3).nullable(),
}).refine(r => r.low === null || r.high === null || r.low <= r.high, 'Range lower bound must be below upper bound');
export type Reading = z.infer<typeof readingSchema>;
export const reportSchema = z.object({
  title: z.string().trim().min(1).max(100),
  day: daySchema,
  readings: z.array(readingSchema).min(1).max(60),
  note: z.string().max(600),
});
export type ReportInput = z.infer<typeof reportSchema>;

export function totals(items: MealItem[]) {
  return items.reduce((acc, item) => ({
    calories: acc.calories + item.calories * item.quantity,
    protein: acc.protein + item.protein * item.quantity,
    carbs: acc.carbs + item.carbs * item.quantity,
    fat: acc.fat + item.fat * item.quantity,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function localTime(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
export function readingStatus(reading: Reading): 'below' | 'above' | 'within' | 'unavailable' {
  if (!/^-?\d+(\.\d+)?$/.test(reading.value.trim())) return 'unavailable';
  const value = Number(reading.value);
  if (reading.low !== null && value < reading.low) return 'below';
  if (reading.high !== null && value > reading.high) return 'above';
  return reading.low !== null || reading.high !== null ? 'within' : 'unavailable';
}
export function comparable(a: Reading, b: Reading) {
  return a.marker.trim().toLowerCase() === b.marker.trim().toLowerCase() && a.unit.trim().toLowerCase() === b.unit.trim().toLowerCase() && /^-?\d+(\.\d+)?$/.test(a.value) && /^-?\d+(\.\d+)?$/.test(b.value);
}
export const blankItem = (): MealItem => ({ name: '', portion: '1 serving', quantity: 1, calories: 0, protein: 0, carbs: 0, fat: 0 });
export function goalProgress(goal: Goal, meals: { items: MealItem[] }[]) {
  const daily = totals(meals.flatMap(m => m.items));
  const value = goal.kind === 'consistency' ? meals.length : goal.kind === 'protein' ? daily.protein : daily.calories;
  return { value, target: goal.target, fraction: Math.min(value / goal.target, 1), unit: goal.kind === 'consistency' ? 'meals' : goal.kind === 'protein' ? 'g protein' : 'kcal', daily };
}
