import { ConvexError, v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { query, mutation, internalQuery } from './_generated/server';
import { owner, requireOwned, bounded } from './lib/access';
import { goalV, mealV, reportV } from './lib/validators';
import {
  daySchema,
  goalSchema,
  mealSchema,
  reportSchema,
  goalProgress,
} from '../../domain/src/index';

export const session = query({
  args: {},
  handler: async (ctx) => ({ id: await owner(ctx) }),
});

export const profile = query({
  args: {},
  handler: async (ctx) => {
    const id = await owner(ctx);
    return ctx.db
      .query('profiles')
      .withIndex('by_owner', (q) => q.eq('owner', id))
      .unique();
  },
});
export const setGoal = mutation({
  args: { goal: goalV, timezone: v.string() },
  handler: async (ctx, args) => {
    const id = await owner(ctx);
    const goal = goalSchema.parse(args.goal);
    if (
      goal.kind === 'consistency' &&
      (!Number.isInteger(goal.target) || goal.target > 10)
    )
      throw new ConvexError('Choose between 1 and 10 meals.');
    if (goal.kind === 'protein' && goal.target > 300)
      throw new ConvexError('Choose a protein target of 300 g or less.');
    try {
      new Intl.DateTimeFormat('en', { timeZone: args.timezone });
    } catch {
      throw new ConvexError('Choose a valid timezone.');
    }
    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_owner', (q) => q.eq('owner', id))
      .unique();
    if (existing)
      await ctx.db.patch('profiles', existing._id, {
        goal,
        timezone: args.timezone,
        revision: existing.revision + 1,
      });
    else
      await ctx.db.insert('profiles', {
        owner: id,
        goal,
        timezone: args.timezone,
        revision: 1,
      });
  },
});
export const today = query({
  args: { day: v.string() },
  handler: async (ctx, { day }) => {
    const id = await owner(ctx);
    daySchema.parse(day);
    const meals = await ctx.db
      .query('meals')
      .withIndex('by_owner_and_day', (q) => q.eq('owner', id).eq('day', day))
      .order('desc')
      .take(120);
    const insight = await ctx.db
      .query('insights')
      .withIndex('by_owner_and_day', (q) => q.eq('owner', id).eq('day', day))
      .unique();
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_owner', (q) => q.eq('owner', id))
      .unique();
    return {
      meals,
      progress: profile
        ? goalProgress(
            profile.goal,
            meals.map((entry) => entry.meal),
          )
        : null,
      insight: insight?.revision === profile?.revision ? insight : null,
    };
  },
});
export const mealHistory = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const id = await owner(ctx);
    return ctx.db
      .query('meals')
      .withIndex('by_owner_and_day', (q) => q.eq('owner', id))
      .order('desc')
      .paginate(args.paginationOpts);
  },
});
export const meal = query({
  args: { id: v.id('meals') },
  handler: async (ctx, args) =>
    requireOwned(await ctx.db.get('meals', args.id), await owner(ctx)),
});
export const saveMeal = mutation({
  args: {
    operationId: v.string(),
    meal: mealV,
    id: v.optional(v.id('meals')),
    revision: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await owner(ctx);
    bounded(args.operationId, 100);
    const meal = mealSchema.parse(args.meal);
    const duplicate = await ctx.db
      .query('meals')
      .withIndex('by_owner_and_operationId', (q) =>
        q.eq('owner', id).eq('operationId', args.operationId),
      )
      .unique();
    if (args.id && duplicate && duplicate._id !== args.id)
      throw new ConvexError(
        'This save belongs to another entry. Reopen the meal and try again.',
      );
    if (args.id) {
      const existing = requireOwned(await ctx.db.get('meals', args.id), id);
      if (existing.operationId === args.operationId) return existing._id;
      if (args.revision !== existing.revision)
        throw new ConvexError(
          'This meal changed elsewhere. Reopen it before editing.',
        );
      if (meal.day !== existing.day) {
        const entries = await ctx.db
          .query('meals')
          .withIndex('by_owner_and_day', (q) =>
            q.eq('owner', id).eq('day', meal.day),
          )
          .take(120);
        if (entries.length >= 120)
          throw new ConvexError(
            'The selected day has reached its entry limit.',
          );
      }
      await ctx.db.patch('meals', existing._id, {
        meal,
        day: meal.day,
        operationId: args.operationId,
        revision: existing.revision + 1,
      });
      await bump(ctx, id);
      return existing._id;
    }
    const existing = await ctx.db
      .query('meals')
      .withIndex('by_owner_and_operationId', (q) =>
        q.eq('owner', id).eq('operationId', args.operationId),
      )
      .unique();
    if (existing) return existing._id;
    const dayMeals = await ctx.db
      .query('meals')
      .withIndex('by_owner_and_day', (q) =>
        q.eq('owner', id).eq('day', meal.day),
      )
      .take(120);
    if (dayMeals.length >= 120)
      throw new ConvexError(
        'This day has reached the entry limit. Edit an existing meal.',
      );
    const result = await ctx.db.insert('meals', {
      owner: id,
      operationId: args.operationId,
      meal,
      day: meal.day,
      revision: 1,
    });
    const draft = await ctx.db
      .query('jobs')
      .withIndex('by_owner_and_operationId', (q) =>
        q.eq('owner', id).eq('operationId', args.operationId),
      )
      .unique();
    if (draft?.kind === 'meal') await ctx.db.delete('jobs', draft._id);
    await bump(ctx, id);
    return result;
  },
});
export const deleteMeal = mutation({
  args: { id: v.id('meals') },
  handler: async (ctx, args) => {
    const id = await owner(ctx);
    requireOwned(await ctx.db.get('meals', args.id), id);
    await ctx.db.delete('meals', args.id);
    await bump(ctx, id);
  },
});
export const reports = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const id = await owner(ctx);
    return ctx.db
      .query('reports')
      .withIndex('by_owner_and_day', (q) => q.eq('owner', id))
      .order('desc')
      .paginate(args.paginationOpts);
  },
});
export const report = query({
  args: { id: v.id('reports') },
  handler: async (ctx, args) => {
    const id = await owner(ctx);
    const report = requireOwned(await ctx.db.get('reports', args.id), id);
    const file = report.fileId
      ? requireOwned(await ctx.db.get('files', report.fileId), id)
      : null;
    const recent = await ctx.db
      .query('reports')
      .withIndex('by_owner_and_day', (q) => q.eq('owner', id))
      .order('desc')
      .take(60);
    return {
      ...report,
      file: file ? { id: file._id, name: file.name, mime: file.mime } : null,
      previous: recent
        .filter((r) => r._id !== report._id && r.day < report.day)
        .map((r) => ({ day: r.day, readings: r.report.readings })),
    };
  },
});
export const reportSummary = query({
  args: { id: v.id('reports') },
  handler: async (ctx, args) => {
    const id = await owner(ctx);
    const report = await ctx.db.get('reports', args.id);
    if (!report || report.owner !== id) return null;
    return { title: report.report.title, day: report.day };
  },
});
export const saveReport = mutation({
  args: {
    operationId: v.string(),
    fileId: v.optional(v.id('files')),
    report: reportV,
  },
  handler: async (ctx, args) => {
    const id = await owner(ctx);
    bounded(args.operationId, 100);
    const report = reportSchema.parse(args.report);
    const existing = await ctx.db
      .query('reports')
      .withIndex('by_owner_and_operationId', (q) =>
        q.eq('owner', id).eq('operationId', args.operationId),
      )
      .unique();
    if (existing) return existing._id;
    if (args.fileId) {
      const file = requireOwned(await ctx.db.get('files', args.fileId), id);
      if (file.kind !== 'report')
        throw new ConvexError('Choose a report source.');
      if (file.expiresAt !== undefined && file.expiresAt < Date.now())
        throw new ConvexError(
          'This unconfirmed source has expired. Choose it again before saving.',
        );
      const duplicate = await ctx.db
        .query('reports')
        .withIndex('by_owner_and_fileId', (q) =>
          q.eq('owner', id).eq('fileId', args.fileId),
        )
        .unique();
      if (duplicate) throw new ConvexError('This source is already saved.');
      await ctx.db.patch('files', file._id, { expiresAt: undefined });
    }
    const result = await ctx.db.insert('reports', {
      owner: id,
      operationId: args.operationId,
      fileId: args.fileId,
      report,
      day: report.day,
    });
    const draft = await ctx.db
      .query('jobs')
      .withIndex('by_owner_and_operationId', (q) =>
        q.eq('owner', id).eq('operationId', args.operationId),
      )
      .unique();
    if (draft?.kind === 'report') await ctx.db.delete('jobs', draft._id);
    await bump(ctx, id);
    return result;
  },
});
export const deleteReport = mutation({
  args: { id: v.id('reports') },
  handler: async (ctx, args) => {
    const id = await owner(ctx);
    const report = requireOwned(await ctx.db.get('reports', args.id), id);
    if (report.fileId) {
      const file = requireOwned(await ctx.db.get('files', report.fileId), id);
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete('files', file._id);
    }
    await ctx.db.delete('reports', args.id);
    await bump(ctx, id);
  },
});
export const context = internalQuery({
  args: {
    owner: v.id('users'),
    day: v.string(),
    reportId: v.optional(v.id('reports')),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_owner', (q) => q.eq('owner', args.owner))
      .unique();
    const meals = await ctx.db
      .query('meals')
      .withIndex('by_owner_and_day', (q) =>
        q.eq('owner', args.owner).eq('day', args.day),
      )
      .take(120);
    const reports = args.reportId
      ? [requireOwned(await ctx.db.get('reports', args.reportId), args.owner)]
      : await ctx.db
          .query('reports')
          .withIndex('by_owner_and_day', (q) => q.eq('owner', args.owner))
          .order('desc')
          .take(5);
    return {
      profile,
      day: args.day,
      meals: meals.map((m) => ({ title: m.meal.title, items: m.meal.items })),
      reports: reports.map((r) => ({
        id: r._id,
        day: r.day,
        title: r.report.title,
        readings: r.report.readings,
      })),
    };
  },
});

import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
export async function bump(ctx: MutationCtx, id: Id<'users'>) {
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_owner', (q) => q.eq('owner', id))
    .unique();
  if (profile)
    await ctx.db.patch('profiles', profile._id, {
      revision: profile.revision + 1,
    });
}
