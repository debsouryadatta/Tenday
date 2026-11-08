/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import agent from '@convex-dev/agent/test';
import rateLimiter from '@convex-dev/rate-limiter/test';
import schema from './schema';
import { api, internal } from './_generated/api';
import { demoDay, dayBefore } from './lib/demoData';
import {
  goalSchema,
  mealSchema,
  reportSchema,
  DEMO_PROFILES,
} from '../../domain/src/index';
const modules = import.meta.glob('./**/*.ts');
const contexts: ReturnType<typeof convexTest>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  try {
    for (const t of contexts)
      await t.finishAllScheduledFunctions(() => vi.advanceTimersToNextTimer());
  } finally {
    contexts.length = 0;
    vi.useRealTimers();
  }
});
function setup() {
  const t = convexTest(schema, modules);
  contexts.push(t);
  agent.register(t);
  rateLimiter.register(t);
  return t;
}
describe('shared fictional demos', () => {
  it('creates exactly three canonical profiles with rich validated data and idempotent entry', async () => {
    const t = setup();
    for (const person of DEMO_PROFILES) {
      const one = await t.mutation(internal.demo.enter, { slug: person.slug });
      const two = await t.mutation(internal.demo.enter, { slug: person.slug });
      expect(one).toBe(two);
      const client = t.withIdentity({ subject: `${one}|session` });
      const account = await client.query(api.records.session, {});
      expect(account.demo).toBe(person.slug);
      expect(account.legacy).toBe(false);
      const profile = await client.query(api.records.profile, {});
      expect(goalSchema.safeParse(profile!.goal).success).toBe(true);
      expect(profile!.goal.kind).toBe(person.goal);
      const meals = await client.query(api.records.mealHistory, {
        paginationOpts: { numItems: 50, cursor: null },
      });
      expect(meals.page).toHaveLength(23);
      expect(
        meals.page.every((m) => mealSchema.safeParse(m.meal).success),
      ).toBe(true);
      const reports = await client.query(api.records.reports, {
        paginationOpts: { numItems: 20, cursor: null },
      });
      expect(reports.page).toHaveLength(3);
      expect(
        reports.page.every(
          (r) =>
            reportSchema.safeParse(r.report).success &&
            r.report.note.includes('FICTIONAL'),
        ),
      ).toBe(true);
      const chat = await client.query(api.assistant.messages, {
        paginationOpts: { numItems: 30, cursor: null },
      });
      expect(chat.page).toHaveLength(8);
      expect(chat.page.every((m) => m.text.startsWith('Demo example'))).toBe(
        true,
      );
      const today = await client.query(api.records.today, { day: demoDay() });
      expect(today.meals).toHaveLength(2);
      expect(today.insight?.basis).toContain('demo');
    }
    expect(
      await t.run(
        async (ctx) => (await ctx.db.query('demoProfiles').take(4)).length,
      ),
    ).toBe(3);
  });
  it('shares changes between sessions, keeps demos and personal data isolated, and preserves edits on re-entry', async () => {
    const t = setup();
    const maya = await t.mutation(internal.demo.enter, { slug: 'maya' });
    const arjun = await t.mutation(internal.demo.enter, { slug: 'arjun' });
    const personal = await t.run((ctx) =>
      ctx.db.insert('users', {
        email: 'test-private@example.com',
        name: 'Personal test',
      }),
    );
    const a = t.withIdentity({ subject: `${maya}|android` }),
      b = t.withIdentity({ subject: `${maya}|web` }),
      other = t.withIdentity({ subject: `${arjun}|other` }),
      privateClient = t.withIdentity({ subject: `${personal}|private` });
    const original = (await a.query(api.records.today, { day: demoDay() }))
      .meals[0];
    await a.mutation(api.records.saveMeal, {
      id: original._id,
      revision: original.revision,
      operationId: 'shared-edit',
      meal: { ...original.meal, title: 'Shared edited lunch' },
    });
    expect(
      (await b.query(api.records.meal, { id: original._id })).meal.title,
    ).toBe('Shared edited lunch');
    await expect(
      other.query(api.records.meal, { id: original._id }),
    ).rejects.toThrow('unavailable');
    await expect(
      privateClient.query(api.records.meal, { id: original._id }),
    ).rejects.toThrow('unavailable');
    const privateId = await privateClient.mutation(api.records.saveMeal, {
      operationId: 'personal-only',
      meal: { ...original.meal, title: 'Personal-only meal' },
    });
    await expect(a.query(api.records.meal, { id: privateId })).rejects.toThrow(
      'unavailable',
    );
    await a.mutation(api.records.deleteMeal, { id: original._id });
    await t.mutation(internal.demo.enter, { slug: 'maya' });
    expect(
      (await b.query(api.records.today, { day: demoDay() })).meals,
    ).toHaveLength(1);
    expect(
      (await privateClient.query(api.records.meal, { id: privateId })).meal
        .title,
    ).toBe('Personal-only meal');
  });
  it('rejects arbitrary profile names before creating an identity', async () => {
    const t = setup();
    // The runtime validator must reject a caller-supplied owner ID, not just TS.
    await expect(
      t.mutation(internal.demo.enter, { slug: 'not-a-demo' as 'maya' }),
    ).rejects.toThrow();
    expect(
      await t.run(async (ctx) => (await ctx.db.query('users').take(1)).length),
    ).toBe(0);
  });
  it('seeds a local day once and does not restore deleted meals when visitors change timezones', async () => {
    const t = setup(),
      day = demoDay();
    const id = await t.mutation(internal.demo.enter, { slug: 'maya', day });
    const client = t.withIdentity({ subject: `${id}|session` });
    const original = (await client.query(api.records.today, { day })).meals[0];
    await client.mutation(api.records.deleteMeal, { id: original._id });
    const tomorrow = dayBefore(day, -1);
    await t.mutation(internal.demo.enter, { slug: 'maya', day: tomorrow });
    await t.mutation(internal.demo.enter, { slug: 'maya', day });
    await t.mutation(internal.demo.enter, { slug: 'maya', day: tomorrow });
    expect((await client.query(api.records.today, { day })).meals).toHaveLength(
      1,
    );
    expect(
      (await client.query(api.records.today, { day: tomorrow })).meals,
    ).toHaveLength(2);
    await expect(
      t.mutation(internal.demo.enter, { slug: 'maya', day: '2099-01-01' }),
    ).rejects.toThrow('device date');
  });
});
