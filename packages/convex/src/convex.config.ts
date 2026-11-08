import { defineApp } from 'convex/server';
import { v } from 'convex/values';
import agent from '@convex-dev/agent/convex.config';
import rateLimiter from '@convex-dev/rate-limiter/convex.config';

const app = defineApp({
  env: {
    OPENROUTER_API_KEY: v.string(),
    OPENROUTER_TEXT_MODEL: v.optional(v.string()),
    OPENROUTER_VISION_MODEL: v.optional(v.string()),
  },
});
app.use(agent);
app.use(rateLimiter);
export default app;
