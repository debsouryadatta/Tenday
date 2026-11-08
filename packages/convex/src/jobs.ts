import { v, ConvexError } from 'convex/values';
import { internalMutation, query, mutation } from './_generated/server';
import { components } from './_generated/api';
import { RateLimiter, MINUTE, DAY } from '@convex-dev/rate-limiter';
import { createThread } from '@convex-dev/agent';
import { owner, requireOwned, bounded } from './lib/access';

const limits = new RateLimiter(components.rateLimiter, {
  global: { kind: 'fixed window', rate: 40, period: DAY },
  personal: { kind: 'token bucket', rate: 4, period: MINUTE, capacity: 2 },
  guidance: { kind: 'fixed window', rate: 4, period: DAY },
});
export const begin = internalMutation({
  args: { owner: v.id('users'), operationId: v.string(), kind: v.string() },
  handler: async (ctx, args) => {
    bounded(args.operationId, 100);
    const existing = await ctx.db
      .query('jobs')
      .withIndex('by_owner_and_operationId', (q) =>
        q.eq('owner', args.owner).eq('operationId', args.operationId),
      )
      .unique();
    if (existing && existing.kind !== args.kind)
      throw new ConvexError('Start a fresh analysis for this input.');
    if (
      existing &&
      (existing.status === 'ready' ||
        (existing.status === 'processing' &&
          Date.now() - existing.updatedAt < 90000))
    )
      return { run: false, job: existing };
    if (existing && Date.now() - existing.updatedAt < 5000)
      throw new ConvexError('Please wait a moment before retrying.');
    try {
      await limits.limit(ctx, 'personal', { key: args.owner, throws: true });
      await limits.limit(ctx, 'global', { throws: true });
      if (args.kind === 'guidance')
        await limits.limit(ctx, 'guidance', { key: args.owner, throws: true });
    } catch {
      throw new ConvexError(
        'The free AI allowance is busy or used for now. Your input is kept; retry later or enter values manually.',
      );
    }
    const updatedAt = Date.now();
    if (existing) {
      await ctx.db.patch('jobs', existing._id, {
        status: 'processing',
        output: undefined,
        error: undefined,
        updatedAt,
      });
      return {
        run: true,
        job: {
          ...existing,
          status: 'processing' as const,
          output: undefined,
          error: undefined,
          updatedAt,
        },
      };
    }
    const id = await ctx.db.insert('jobs', {
      ...args,
      status: 'processing',
      updatedAt,
    });
    return { run: true, job: (await ctx.db.get('jobs', id))! };
  },
});
export const finish = internalMutation({
  args: {
    id: v.id('jobs'),
    lease: v.number(),
    output: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get('jobs', args.id);
    if (!job || job.updatedAt !== args.lease) return;
    if ((args.output?.length ?? 0) > 100000)
      throw new ConvexError('The response was too long. Try a smaller input.');
    await ctx.db.patch('jobs', args.id, {
      status: args.error ? 'error' : 'ready',
      output: args.output,
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});
export const get = query({
  args: { operationId: v.string() },
  handler: async (ctx, args) => {
    const id = await owner(ctx);
    return ctx.db
      .query('jobs')
      .withIndex('by_owner_and_operationId', (q) =>
        q.eq('owner', id).eq('operationId', args.operationId),
      )
      .unique();
  },
});
export const ensureThread = internalMutation({
  args: { owner: v.id('users') },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_owner', (q) => q.eq('owner', args.owner))
      .unique();
    if (!profile) throw new ConvexError('Set your goal first.');
    if (profile.threadId) return profile.threadId;
    const threadId = await createThread(ctx, components.agent, {
      userId: args.owner,
      title: 'Your Tenday companion',
    });
    await ctx.db.patch('profiles', profile._id, { threadId });
    return threadId;
  },
});
export const setInsight = internalMutation({
  args: {
    owner: v.id('users'),
    day: v.string(),
    revision: v.number(),
    text: v.string(),
    basis: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_owner', (q) => q.eq('owner', args.owner))
      .unique();
    if (profile?.revision !== args.revision) return;
    const existing = await ctx.db
      .query('insights')
      .withIndex('by_owner_and_day', (q) =>
        q.eq('owner', args.owner).eq('day', args.day),
      )
      .unique();
    if (existing) await ctx.db.replace('insights', existing._id, args);
    else await ctx.db.insert('insights', args);
  },
});
export const remove = mutation({
  args: { id: v.id('jobs') },
  handler: async (ctx, args) => {
    const id = await owner(ctx);
    requireOwned(await ctx.db.get('jobs', args.id), id);
    await ctx.db.delete('jobs', args.id);
  },
});
