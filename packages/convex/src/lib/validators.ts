import { v } from 'convex/values';
export const itemV = v.object({ name: v.string(), portion: v.string(), quantity: v.number(), calories: v.number(), protein: v.number(), carbs: v.number(), fat: v.number() });
export const goalV = v.object({ kind: v.union(v.literal('consistency'), v.literal('awareness'), v.literal('protein')), target: v.number(), preferences: v.string(), rationale: v.string() });
export const mealV = v.object({ title: v.string(), day: v.string(), time: v.string(), items: v.array(itemV), note: v.string(), source: v.union(v.literal('text'), v.literal('photo'), v.literal('voice'), v.literal('manual')) });
export const readingV = v.object({ marker: v.string(), value: v.string(), unit: v.string(), reference: v.string(), low: v.union(v.number(), v.null()), high: v.union(v.number(), v.null()), page: v.union(v.number(), v.null()) });
export const reportV = v.object({ title: v.string(), day: v.string(), readings: v.array(readingV), note: v.string() });
