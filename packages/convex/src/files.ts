import { internalMutation, internalQuery, mutation } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { owner, requireOwned, bounded } from './lib/access';

export const register = internalMutation({ args: { owner: v.id('users'), storageId: v.id('_storage'), name: v.string(), mime: v.string(), size: v.number(), kind: v.union(v.literal('meal'), v.literal('report')) }, handler: async (ctx, args) => {
  bounded(args.name, 120);
  const files = await ctx.db.query('files').withIndex('by_owner', q => q.eq('owner', args.owner)).take(200);
  if (files.length >= 200) throw new ConvexError('Storage limit reached. Remove an unused report before uploading another.');
  return ctx.db.insert('files', { ...args, expiresAt: Date.now() + 86400000 });
} });
export const owned = internalQuery({ args: { owner: v.id('users'), id: v.id('files') }, handler: async (ctx, args) => requireOwned(await ctx.db.get('files', args.id), args.owner) });
export const remove = mutation({ args: { id: v.id('files') }, handler: async (ctx, args) => {
  const id = await owner(ctx); const file = requireOwned(await ctx.db.get('files', args.id), id);
  if (file.expiresAt === undefined) throw new ConvexError('Delete the saved report to remove its source.');
  await ctx.storage.delete(file.storageId); await ctx.db.delete('files', file._id);
} });
export const expire = internalMutation({ args: {}, handler: async ctx => {
  const files = await ctx.db.query('files').withIndex('by_expiresAt', q => q.gt('expiresAt', 0).lt('expiresAt', Date.now())).take(50);
  for (const file of files) { await ctx.storage.delete(file.storageId); await ctx.db.delete('files', file._id); }
  const jobs = await ctx.db.query('jobs').withIndex('by_updatedAt', q => q.lt('updatedAt', Date.now() - 7 * 86400000)).take(100);
  for (const job of jobs) await ctx.db.delete('jobs', job._id);
} });
