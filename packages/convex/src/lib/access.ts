import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx, ActionCtx } from '../_generated/server';

export async function owner(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const id = await getAuthUserId(ctx);
  if (!id)
    throw new ConvexError(
      'Your private session is unavailable. Reconnect and try again.',
    );
  return id;
}
export function requireOwned<T extends { owner: string }>(
  row: T | null,
  id: string,
): T {
  if (!row || row.owner !== id)
    throw new ConvexError('This record is unavailable.');
  return row;
}
export function bounded(value: string, max = 500) {
  if (value.length > max)
    throw new ConvexError('This input is too long. Please shorten it.');
  return value.trim();
}
