/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as assistant from "../assistant.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as demo from "../demo.js";
import type * as demoSources from "../demoSources.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_assistantText from "../lib/assistantText.js";
import type * as lib_demoData from "../lib/demoData.js";
import type * as lib_models from "../lib/models.js";
import type * as lib_validators from "../lib/validators.js";
import type * as records from "../records.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  assistant: typeof assistant;
  auth: typeof auth;
  crons: typeof crons;
  demo: typeof demo;
  demoSources: typeof demoSources;
  files: typeof files;
  http: typeof http;
  jobs: typeof jobs;
  "lib/access": typeof lib_access;
  "lib/assistantText": typeof lib_assistantText;
  "lib/demoData": typeof lib_demoData;
  "lib/models": typeof lib_models;
  "lib/validators": typeof lib_validators;
  records: typeof records;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
