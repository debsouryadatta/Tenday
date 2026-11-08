import { Password } from '@convex-dev/auth/providers/Password';
import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials';
import { convexAuth } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';
import {
  emailSchema,
  passwordSchema,
  accountNameSchema,
  demoSlugSchema,
} from '../../domain/src/index';
import { internal } from './_generated/api';
import type { DataModel, Id } from './_generated/dataModel';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        const email = emailSchema.safeParse(params.email);
        if (!email.success)
          throw new ConvexError('Enter a valid email address.');
        if (params.flow !== 'signUp') return { email: email.data };
        const name = accountNameSchema.safeParse(params.name);
        if (!name.success)
          throw new ConvexError('Enter your name (2–60 characters).');
        return { email: email.data, name: name.data };
      },
      validatePasswordRequirements(password) {
        if (!passwordSchema.safeParse(password).success)
          throw new ConvexError('Use a password with 12–128 characters.');
      },
    }),
    ConvexCredentials<DataModel>({
      id: 'demo',
      async authorize(params, ctx): Promise<{ userId: Id<'users'> }> {
        const parsed = demoSlugSchema.safeParse(params.profile);
        if (!parsed.success)
          throw new ConvexError('Choose one of the three demo profiles.');
        // Only canonical, synthetic demo identities can be issued here. Never
        // accept a user/profile ID or search personal accounts by supplied data.
        const userId: Id<'users'> = await ctx.runMutation(internal.demo.enter, {
          slug: parsed.data,
          day: typeof params.day === 'string' ? params.day : undefined,
        });
        return { userId };
      },
    }),
  ],
});
