import { z } from 'zod';

export const demoSlugSchema = z.enum(['maya', 'arjun', 'leah']);
export type DemoSlug = z.infer<typeof demoSlugSchema>;
export const DEMO_PROFILES = [
  {
    slug: 'maya' as const,
    name: 'Maya',
    initials: 'M',
    title: 'A steadier meal rhythm',
    description:
      'Quick vegetarian meals, a week of history and a gentle daily routine.',
    goal: 'consistency' as const,
    target: 3,
    preferences:
      'Vegetarian. Quick lunches between meetings. Enjoys Indian home cooking.',
  },
  {
    slug: 'arjun' as const,
    name: 'Arjun',
    initials: 'A',
    title: 'Protein in everyday meals',
    description:
      'Simple home cooking, practical protein choices and clear meal totals.',
    goal: 'protein' as const,
    target: 90,
    preferences:
      'Mixed diet. Prefers eggs, dal, fish and simple home-cooked meals. Likes batch cooking.',
  },
  {
    slug: 'leah' as const,
    name: 'Leah',
    initials: 'L',
    title: 'A clearer view of the day',
    description:
      'Flexible meals, energy awareness and reports with their original context.',
    goal: 'awareness' as const,
    target: 2000,
    preferences:
      'Flexible mixed diet. Prefers Mediterranean-inspired meals. Likes easy packed lunches.',
  },
] as const;
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(12).max(128);
export const accountNameSchema = z.string().trim().min(2).max(60);
export function authError(step: 'signIn' | 'signUp') {
  return step === 'signIn'
    ? 'Sign-in could not finish. Check your email and password, or reconnect and try again.'
    : 'Your account could not be created. Check your connection, or try signing in if you already have an account.';
}
