import { describe, expect, it } from 'vitest';
import { comparable, daySchema, goalProgress, mealSchema, readingStatus, totals, type Reading } from './index';

const items = [{ name: 'Toast', portion: '1 slice', quantity: 2, calories: 90, protein: 3, carbs: 16, fat: 1 }, { name: 'Egg', portion: '1 egg', quantity: 0.5, calories: 80, protein: 6, carbs: 0.5, fat: 5 }];
const base: Reading = { marker: 'Glucose', value: '100', unit: 'mg/dL', reference: '70–110', low: 70, high: 110, page: 1 };
describe('nutrition and local-day boundaries', () => {
  it('scales each portion once, including fractional quantities', () => { expect(totals(items)).toEqual({ calories: 220, protein: 9, carbs: 32.25, fat: 4.5 }); });
  it('recalculates totals after a portion change and removal', () => { expect(totals([{ ...items[0], quantity: 3 }]).calories).toBe(270); expect(totals([]).calories).toBe(0); });
  it('counts logged meals for a habit goal rather than interpreting calories as success', () => { expect(goalProgress({ kind: 'consistency', target: 3, preferences: '', rationale: '' }, [{ items }])).toMatchObject({ value: 1, unit: 'meals', fraction: 1 / 3 }); });
  it.each(['2026-02-29','2026-02-31','2026-13-01','2026-1-01','not a date'])('rejects impossible or ambiguous dates: %s', value => { expect(daySchema.safeParse(value).success).toBe(false); });
  it('retains a leap day and an explicitly chosen local meal day', () => { expect(daySchema.parse('2028-02-29')).toBe('2028-02-29'); expect(mealSchema.parse({ title: 'Late supper', day: '2026-11-07', time: '23:55', items, note: '', source: 'manual' }).day).toBe('2026-11-07'); });
  it('rejects zero portions and non-finite nutrition', () => { for (const patch of [{ quantity: 0 }, { quantity: -1 }, { protein: Infinity }]) expect(mealSchema.safeParse({ title: 'Meal', day: '2026-11-08', time: '12:00', items: [{ ...items[0], ...patch }], note: '', source: 'text' }).success).toBe(false); });
});
describe('source-faithful report interpretation', () => {
  it.each(['<5','>100','negative','not detected','1,000',''])('does not coerce a bounded or qualitative result: %s', value => { expect(readingStatus({ ...base, value })).toBe('unavailable'); });
  it('uses only supplied numeric bounds and includes interval edges', () => { expect(readingStatus({ ...base, value: '70' })).toBe('within'); expect(readingStatus({ ...base, value: '110.1' })).toBe('above'); expect(readingStatus({ ...base, value: '69' })).toBe('below'); expect(readingStatus({ ...base, low: null, high: null })).toBe('unavailable'); });
  it('does not compare different units or qualitative results', () => { expect(comparable(base, { ...base, unit: 'mmol/L' })).toBe(false); expect(comparable(base, { ...base, value: '<100' })).toBe(false); expect(comparable(base, { ...base, marker: ' glucose ', value: '90' })).toBe(true); });
});
