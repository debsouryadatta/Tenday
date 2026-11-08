import {
  internalMutation,
  internalQuery,
  internalAction,
  type MutationCtx,
} from './_generated/server';
import { components, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { v } from 'convex/values';
import { createThread, saveMessage } from '@convex-dev/agent';
import {
  DEMO_PROFILES,
  demoSlugSchema,
  mealSchema,
  reportSchema,
  totals,
  daySchema,
  type DemoSlug,
} from '../../domain/src/index';
import { demoDay, dayBefore, demoMeals, demoReports } from './lib/demoData';
const slugV = v.union(v.literal('maya'), v.literal('arjun'), v.literal('leah'));

async function addDay(
  ctx: MutationCtx,
  userId: Id<'users'>,
  slug: DemoSlug,
  day: string,
  offset: number,
) {
  for (const meal of demoMeals(slug, day, offset)) {
    const operationId = `demo:v1:${day}:${meal.time}`;
    const exists = await ctx.db
      .query('meals')
      .withIndex('by_owner_and_operationId', (q) =>
        q.eq('owner', userId).eq('operationId', operationId),
      )
      .unique();
    if (!exists)
      await ctx.db.insert('meals', {
        owner: userId,
        operationId,
        day,
        meal: mealSchema.parse(meal),
        revision: 1,
      });
  }
}
export const enter = internalMutation({
  args: { slug: slugV, day: v.optional(v.string()) },
  handler: async (ctx, { slug, day: requestedDay }): Promise<Id<'users'>> => {
    demoSlugSchema.parse(slug);
    const person = DEMO_PROFILES.find((p) => p.slug === slug)!;
    let demo = await ctx.db
      .query('demoProfiles')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique();
    const day = requestedDay ?? demoDay();
    daySchema.parse(day);
    if (Math.abs(Date.parse(`${day}T12:00:00Z`) - Date.now()) > 2 * 86400000)
      throw new Error('Check the device date before opening a demo.');
    if (!demo) {
      const userId = await ctx.db.insert('users', {
        name: person.name,
        isAnonymous: false,
      });
      const id = await ctx.db.insert('demoProfiles', {
        slug,
        userId,
        seededDay: '',
        version: 0,
      });
      demo = (await ctx.db.get('demoProfiles', id))!;
    }
    if (demo.version === 0) {
      const threadId = await createThread(ctx, components.agent, {
        userId: demo.userId,
        title: `${person.name}'s shared demo conversation`,
      });
      await ctx.db.insert('profiles', {
        owner: demo.userId,
        timezone: 'Asia/Kolkata',
        revision: 1,
        threadId,
        goal: {
          kind: person.goal,
          target: person.target,
          preferences: person.preferences,
          rationale:
            person.goal === 'consistency'
              ? 'Notice your meal rhythm with a simple logging habit. Missing a day is okay.'
              : person.goal === 'protein'
                ? 'Notice protein across your everyday meals. This editable demo target is not a personal recommendation.'
                : 'Notice how meals add up across the day. This editable demo energy reference is not a personal calorie recommendation.',
        },
      });
      for (let offset = 7; offset >= 0; offset--) {
        await addDay(ctx, demo.userId, slug, dayBefore(day, offset), offset);
        await ctx.db.insert('demoDays', {
          owner: demo.userId,
          day: dayBefore(day, offset),
        });
      }
      for (const [i, input] of demoReports(slug, day).entries()) {
        const report = reportSchema.parse(input);
        const reportId = await ctx.db.insert('reports', {
          owner: demo.userId,
          operationId: `demo:v1:report:${i}`,
          day: report.day,
          report,
        });
        await ctx.scheduler.runAfter(0, internal.demoSources.attach, {
          reportId,
        });
      }
      const daily = totals(demoMeals(slug, day, 0).flatMap((m) => m.items));
      const newest = demoReports(slug, day)[2];
      const examples = [
        [
          'What is this profile working toward?',
          `Demo example: ${person.name}'s focus is ${person.title.toLowerCase()}. The saved preferences are: ${person.preferences} The daily reference is editable and is not a medical recommendation.`,
        ],
        [
          'How does my day look so far?',
          `Demo example from ${day}: the two starter meals add up to about ${Math.round(daily.calories)} kcal and ${Math.round(daily.protein)} g protein. These are estimates. A simple next step is to keep the next meal easy to prepare and log; your saved preference is for ${slug === 'maya' ? 'quick vegetarian lunches' : slug === 'arjun' ? 'simple home cooking' : 'flexible packed lunches'}.`,
        ],
        [
          'What should I ask about my recent report?',
          `Demo example: the fictional report dated ${newest.day} lists LDL cholesterol as 106 mg/dL, above its printed interval of 0 - 100 mg/dL. This does not establish a diagnosis. A useful clinician question is whether the result needs follow-up in context, and whether the same lab/method was used for earlier readings.`,
        ],
        [
          'Can I add a meal from a photo?',
          'Demo example: Yes. Open Log a meal, take or choose a photo, then check the foods and portions in the review. Saving is your explicit confirmation. You can also use your voice, type a description, or enter values manually.',
        ],
      ];
      for (const [question, answer] of examples) {
        const prompt = await saveMessage(ctx, components.agent, {
          threadId,
          userId: demo.userId,
          prompt: `Demo example: ${question}`,
        });
        await saveMessage(ctx, components.agent, {
          threadId,
          userId: demo.userId,
          promptMessageId: prompt.messageId,
          message: { role: 'assistant', content: answer },
        });
      }
    }
    const existingDay = await ctx.db
      .query('demoDays')
      .withIndex('by_owner_and_day', (q) =>
        q.eq('owner', demo.userId).eq('day', day),
      )
      .unique();
    if (!existingDay) {
      // A fresh current day is added once. Existing edits and deletions are kept.
      await addDay(ctx, demo.userId, slug, day, 0);
      await ctx.db.insert('demoDays', { owner: demo.userId, day });
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_owner', (q) => q.eq('owner', demo.userId))
        .unique();
      if (profile)
        await ctx.db.patch('profiles', profile._id, {
          revision: profile.revision + 1,
        });
    }
    if (!existingDay || demo.version === 0) {
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_owner', (q) => q.eq('owner', demo.userId))
        .unique();
      if (profile) {
        const insight = {
          owner: demo.userId,
          day,
          revision: profile.revision,
          text:
            person.goal === 'protein'
              ? 'Keep a familiar protein option ready for your next meal.'
              : 'Make your next meal easy to log, with a photo or a few words.',
          basis: `A demo starter suggestion based on ${person.name}'s saved food preferences and goal.`,
        };
        const existing = await ctx.db
          .query('insights')
          .withIndex('by_owner_and_day', (q) =>
            q.eq('owner', demo.userId).eq('day', day),
          )
          .unique();
        if (existing) await ctx.db.replace('insights', existing._id, insight);
        else await ctx.db.insert('insights', insight);
      }
      await ctx.db.patch('demoProfiles', demo._id, {
        seededDay: day,
        version: 1,
      });
    }
    return demo.userId;
  },
});
export const reportSource = internalQuery({
  args: { reportId: v.id('reports') },
  handler: async (ctx, { reportId }) => {
    const report = await ctx.db.get('reports', reportId);
    if (!report || report.fileId) return null;
    const demo = await ctx.db
      .query('demoProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', report.owner))
      .unique();
    return demo
      ? {
          report,
          name: DEMO_PROFILES.find((p) => p.slug === demo.slug)!.name,
          slug: demo.slug,
        }
      : null;
  },
});
export const attachSource = internalMutation({
  args: {
    reportId: v.id('reports'),
    storageId: v.id('_storage'),
    size: v.number(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get('reports', args.reportId);
    if (!report || report.fileId) {
      await ctx.storage.delete(args.storageId);
      return;
    }
    const demo = await ctx.db
      .query('demoProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', report.owner))
      .unique();
    if (!demo) {
      await ctx.storage.delete(args.storageId);
      return;
    }
    const fileId = await ctx.db.insert('files', {
      owner: report.owner,
      storageId: args.storageId,
      size: args.size,
      name: args.name,
      mime: 'application/pdf',
      kind: 'report',
    });
    await ctx.db.patch('reports', report._id, { fileId });
  },
});

// Admin-only maintenance: never exposed as a public mutation or a client ID.
export const clearBatch = internalMutation({
  args: { slug: slugV },
  handler: async (ctx, { slug }) => {
    const demo = await ctx.db
      .query('demoProfiles')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique();
    if (!demo) return true;
    for (const table of [
      'meals',
      'reports',
      'files',
      'jobs',
      'insights',
      'demoDays',
    ] as const) {
      const rows =
        table === 'files'
          ? await ctx.db
              .query(table)
              .withIndex('by_owner', (q) => q.eq('owner', demo.userId))
              .take(50)
          : table === 'jobs'
            ? await ctx.db
                .query(table)
                .withIndex('by_owner_and_operationId', (q) =>
                  q.eq('owner', demo.userId),
                )
                .take(50)
            : await ctx.db
                .query(table)
                .withIndex('by_owner_and_day', (q) =>
                  q.eq('owner', demo.userId),
                )
                .take(50);
      if (rows.length) {
        for (const row of rows) {
          if ('storageId' in row) await ctx.storage.delete(row.storageId);
          await ctx.db.delete(table, row._id);
        }
        return false;
      }
    }
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_owner', (q) => q.eq('owner', demo.userId))
      .unique();
    if (profile) {
      if (profile.threadId)
        await ctx.runMutation(
          components.agent.threads.deleteAllForThreadIdAsync,
          { threadId: profile.threadId },
        );
      await ctx.db.delete('profiles', profile._id);
    }
    await ctx.db.patch('demoProfiles', demo._id, { version: 0, seededDay: '' });
    return true;
  },
});
export const reset = internalAction({
  args: { slug: slugV },
  handler: async (ctx, { slug }): Promise<void> => {
    for (let i = 0; i < 100; i++) {
      const done: boolean = await ctx.runMutation(internal.demo.clearBatch, {
        slug,
      });
      if (done) {
        await ctx.runMutation(internal.demo.enter, { slug });
        return;
      }
    }
    throw new Error('Demo reset needs another bounded pass.');
  },
});
