import { defineSchema, defineTable } from 'convex/server';
import { authTables } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { goalV, mealV, reportV } from './lib/validators';

export default defineSchema({
  ...authTables,
  demoDays: defineTable({ owner: v.id('users'), day: v.string() }).index(
    'by_owner_and_day',
    ['owner', 'day'],
  ),
  demoProfiles: defineTable({
    slug: v.union(v.literal('maya'), v.literal('arjun'), v.literal('leah')),
    userId: v.id('users'),
    seededDay: v.string(),
    version: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_userId', ['userId']),
  profiles: defineTable({
    owner: v.id('users'),
    goal: goalV,
    timezone: v.string(),
    threadId: v.optional(v.string()),
    revision: v.number(),
  }).index('by_owner', ['owner']),
  meals: defineTable({
    owner: v.id('users'),
    operationId: v.string(),
    meal: mealV,
    day: v.string(),
    revision: v.number(),
  })
    .index('by_owner_and_day', ['owner', 'day'])
    .index('by_owner_and_operationId', ['owner', 'operationId']),
  files: defineTable({
    owner: v.id('users'),
    storageId: v.id('_storage'),
    name: v.string(),
    mime: v.string(),
    size: v.number(),
    kind: v.union(v.literal('meal'), v.literal('report')),
    expiresAt: v.optional(v.number()),
  })
    .index('by_owner', ['owner'])
    .index('by_expiresAt', ['expiresAt']),
  reports: defineTable({
    owner: v.id('users'),
    operationId: v.string(),
    fileId: v.optional(v.id('files')),
    report: reportV,
    day: v.string(),
  })
    .index('by_owner_and_day', ['owner', 'day'])
    .index('by_owner_and_operationId', ['owner', 'operationId'])
    .index('by_owner_and_fileId', ['owner', 'fileId']),
  jobs: defineTable({
    owner: v.id('users'),
    operationId: v.string(),
    kind: v.string(),
    promptMessageId: v.optional(v.string()),
    status: v.union(
      v.literal('processing'),
      v.literal('ready'),
      v.literal('error'),
    ),
    output: v.optional(v.string()),
    error: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index('by_owner_and_operationId', ['owner', 'operationId'])
    .index('by_updatedAt', ['updatedAt']),
  insights: defineTable({
    owner: v.id('users'),
    day: v.string(),
    revision: v.number(),
    text: v.string(),
    basis: v.string(),
  }).index('by_owner_and_day', ['owner', 'day']),
});
