# Tenday implementation plan

Build four complete flows around one loop: understand the user's goal, make recording effortless, explain the day, and suggest one useful next action. Deliver a working app with credible states rather than a broad collection of mock screens.

## 1 First turn and scope gate

Read the handoff, full brief, decisions, design system and local setup context. Inspect available cloud/build credentials without printing secrets. Ask the owner one short group of unresolved important questions before app implementation. Resolve the deadline/platform and AI spend; ask about cloud identity only when a necessary service cannot be provisioned with existing access. Do not reopen the approved brand, stack or repository decision.

Record answers in `docs/DECISIONS.md`. A required answer cannot be inferred from elapsed time. Until then, limit work to reading, account/tool preflight and setup verification. After the answers, proceed autonomously through the plan, surfacing only genuine blockers and decisions outside the agreed scope.

## 2 Product scope

### Core flow A Goal and first useful day

Two or three short steps establish the person's objective, a few relevant preferences and an understandable daily goal. The default product is an adult general-wellbeing prototype. Ask only for information the selected goal actually needs. Optional data is skippable.

Prefer a habit-led first goal such as more consistent meals. Where energy/protein targets are used, explain their basis, units and editability. A prototype sample of 2,000 kcal is not a recommendation for everyone. Do not infer calorie restriction from report abnormalities or present a model guess as an appropriate personal target. If the user chooses a health condition, pregnancy, minor age or another context outside the product's supported scope, offer non-prescriptive tracking and appropriate professional support rather than inventing a diet plan.

First run leads to Today with a clear goal and a concrete next action, not an empty chat. Persist onboarding as it progresses. On app restart the person resumes their state; a demo reset is deliberate and clearly labelled. Compact profile/goal/preference editing can live in sheets rather than a fourth navigation tab.

Acceptance: a fresh user can reach a useful Today screen quickly, see what and why, skip optional data, edit the goal later and relaunch without losing it.

### Core flow B Meal capture and confirmation

Today → Log a meal opens one native sheet with photo, voice and text choices. Request permission at the relevant action. Gallery upload and manual text are fallbacks when a camera is unavailable. Voice uses real recording/transcription and an editable transcript; label any seeded demonstration separately. Do not ship a voice button that only injects a hardcoded example.

Capture state: idle → capturing/uploading → analysing → review → saving → saved. Error/cancel transitions return to a useful state and preserve recoverable input. A timed-out AI call must not create a partially confirmed meal.

The common review screen shows recognised items, portions/units, calorie and macro estimates, meal/date and any uncertain assumptions. Let the user edit or remove individual items, adjust portions, add an omitted item and save once. For mixed dishes, ask the single most useful missing detail when needed; do not imply a photo can measure hidden oil or exact mass.

Changing a portion recalculates displayed item and meal totals consistently. Keep a clear distinction between AI-estimated values, user corrections and database-backed values if such a source is added. Model output is a draft. Only confirmation writes a saved meal and updates daily totals. Use request/confirmation IDs to prevent double logs after retry or repeated taps.

Recent meals and a simple history support editing/deleting an entry. Edits replace/recompute values rather than adding the meal twice. Show dates in the user's local timezone and store canonical timestamps plus the intended local meal day. Preserve meaningful custom time changes.

Acceptance: real photo, real voice and text each reach the same editable review; confirmation updates Today; cancelling does not log; double tap/retry does not duplicate; offline input is retained; editing/deleting corrects totals; relaunch preserves confirmed entries and recoverable drafts.

### Core flow C Today and personal assistance

Today contains the goal summary, compact meaningful balance, recent meals and ONE next best action. Avoid filling the screen with invented wellness scores, unrelated charts or generic motivational paragraphs. Every suggestion should answer what to do and why based on relevant saved inputs. On a new account, show an honest starter action rather than a conclusion about meals that do not exist.

The assistant uses a compact server-built context: user-confirmed goal/preferences, relevant recent meal totals and selected confirmed report readings. It must not invent allergies, preferences, meals, diagnoses or completed actions. Store explicit memory with user visibility and an edit/forget path. Distinguish inferred suggestions from confirmed preferences. Changes to memory or goals need an appropriate visible confirmation.

Conversation can stream where the platform permits, with a stable loading state, cancel/retry and retention of the draft question. Suggestions can open a prefilled meal review or report detail to reduce typing. Do not save an AI-proposed meal directly from an answer without review.

Generate proactive guidance at bounded events such as app open after meaningful data changes, confirmed meals or a report confirmation. Cache by context/version and limit expensive regeneration. A notification is optional; an in-app next step satisfies the proactive loop without requiring background agents or wearable/calendar access.

Motivation is gentle: acknowledge successful recording and consistency without guilt, punishment or claims of medical improvement. Missing data is missing data, not failure. If using streaks, define timezone/day boundaries and tolerate imperfect days.

Acceptance: suggestions change appropriately with actual data; the explanation names its basis; no-data and AI-unavailable states remain useful; conversation survives navigation/restart as intended; a suggested action opens the relevant flow with little effort.

### Core flow D Health reports

Reports → Add report accepts an image or supported PDF. Validate MIME, size and supported page count before upload. Plan a bounded supported document set, such as short lab reports; state limits clearly instead of pretending all files work. Keep an original private source reference and report date.

Pipeline: selected → validated → uploaded → extracting → needs review → confirmed, with explicit failed/cancelled states. Preserve extraction drafts separately from confirmed health readings. Allow retry and removal; invalid, encrypted, blurred, unsupported or empty reports should produce a useful explanation and manual correction path.

Review includes marker name, value, exact unit, report date, lab-provided reference range and source page when available. Missing reference ranges remain missing. Distinguish numeric and qualitative results; never coerce '<5' or 'negative' into an arbitrary number. Users can correct readings before saving.

Report detail explains terms in plain language and links each reading to its original source. Show out-of-range only using the report's own reference interval, preserving context; do not diagnose or prescribe. Trends require matching marker, compatible units and dates; do not connect incomparable measurements or make a trend from one observation. With insufficient data, show the dated reading, not a fake chart.

Reports and conversations may contain sensitive data. Scope access, minimise model context, apply file expiry/retention rules and support deletion of source + readings according to the selected data model. Use synthetic reports for automated testing and public demo material.

Acceptance: image and supported PDF uploads work end-to-end; review precedes save; values/units/dates stay intact; source opens; invalid files have recovery; deleted files and readings stop appearing in guidance; two identities cannot access each other's reports.

### Deferred

Workout planning/logging, wearables, HealthKit/Health Connect, social/community, barcode databases, broad meal-planning engines, subscriptions, multiple frontend apps, complex admin tooling and autonomous actions in unrelated services are out of v1. Add only if the core flows are complete and the owner explicitly extends scope.

## 3 User experience and design sequence

1. Map first-run, daily-return, capture, report-review and failure journeys. Keep the four primary paths visible and avoid choice-heavy funnels.
2. Establish tokens and shared native primitives before duplicating screens. Implement Carefold branding and the approved light palette.
3. Build Today, common sheets and meal review first using clearly labelled development fixtures. Verify small-screen composition before extending the same patterns.
4. Wire real data and AI early, removing fixtures from normal mode. Development/demo fixtures need explicit labels and a reset mechanism.
5. Exercise all complete journeys on a device/emulator; check click count, reachability, back/cancel behavior, keyboard, focus and permission recovery.

The previous HTML is a visual direction, not a component spec. Improve its layout/content when needed for real functionality. Copy the useful restraint of MemoHack rather than its unrelated study features or exact indigo styling.

## 4 Architecture

### Workspace

```text
apps/mobile/              Expo Router app, UI primitives, theme, feature UI
packages/convex/          Convex schema, functions, AI actions, storage access
packages/domain/          Only if pure validators/types/calculations are genuinely shared
assets/brand/             Approved and production brand assets
docs/                     Brief, decisions, design and operating instructions
plans/                    Execution and verification plan
```

Use one pnpm workspace and a compatible current Expo SDK, React Native, React and native module set. Inspect actual package versions; do not copy the stale versions in MemoHack's historical instructions. Prefer official Expo installation/version checks for native modules. Pin the selected set and commit the lockfile. No Turborepo, UI framework or second app is required for one mobile app and backend.

Frontend owns presentation, device permissions/capture, draft editing and a small durable offline queue. The backend owns access control, confirmation writes, aggregation, private files, model credentials and policy. Share pure calculations where useful; never import server-only keys/actions into the client bundle.

Keep domain modules narrow: profile/goals, meals, reports/readings, assistant/memory and AI jobs. Use explicit input schemas, typed error codes with safe client messages and one common error presentation path. Read the installed Convex guidelines and use its supported agent component for durable conversation history; the conversation row below is a logical data requirement, not an instruction to hand-roll a competing message store. Avoid creating a generic agent framework for these four workflows.

### Proposed records

| Record | Essential fields and behavior |
| --- | --- |
| Profile / identity | Secure identity scope, timezone, goal, consent/preferences, created/updated timestamps |
| Goal version | Kind, editable target/unit, rationale/basis, active interval |
| Meal draft / AI job | Owner, request ID, input type, status, validated output, retry metadata/expiry |
| Meal | Owner, local day/time, items/portions, confirmed estimates/corrections, totals, source, revision |
| Report | Owner, private file reference, date, processing/review status, source metadata |
| Reading | Owner, report/source page, canonical/display marker, raw value, unit, reference range, confirmed status |
| Conversation/message | Owner, thread, role, text, safe source references, timestamps/status |
| Memory | Owner, explicit preference/value, provenance, confirmation state and update/delete path |
| Daily insight/cache | Owner/day, relevant context version, suggestion, rationale/source references, expiry |

Use indexes keyed by owner and date/status. Avoid full-table scans for Today. Derive aggregates from confirmed records with one consistent calculation path; if counters are cached, update them transactionally. Bound history/prompt queries and paginate conversations.

### Identity and Firebase

No login screen is required, but persisted private health records still need real access control. Choose the smallest supported anonymous identity/session approach after checking Convex/Expo support. Firebase anonymous identity is an option if the owner has or wants a Firebase project; do not add Firestore as a second system of record. Alternatively use a well-supported Convex-compatible anonymous auth mechanism. Never pass a freely chosen profile ID as the only protection for cloud data. Do not clone MemoHack's full custom authentication system just for the demo.

Demo profiles must contain synthetic information and must not expose real documents between viewers. Real private uploads cannot rely on a public shared demo account. Explain this tradeoff briefly only if it requires an owner decision.

### AI integration

Use OpenRouter through server-side Convex actions. Select explicit configurable models by task: conversational guidance, visual meal recognition, report extraction and transcription only where supported. Verify current model capabilities, provider/data policy, costs and rate limits from primary docs and a small smoke check. The owner has authorised reusing the existing key, not unlimited spending.

Validate structured model responses before rendering or persisting. Preserve raw user input for recovery, not unrestricted model payloads in logs. Use timeouts, bounded retries/backoff, cancellation state and idempotent confirmations. Never retry billable operations indefinitely. Include one affordable fallback where worthwhile, and a manual path that does not erase user effort when AI is unavailable.

Keep provenance/uncertainty in the UI: estimated food portions, missing lab units, unsupported pages and assistant source context. Follow the approved budget and data-retention policy. Do not ship claims of diagnostic accuracy or exact calories from a photo.

### Storage and offline behavior

Use Convex storage or a justified single private storage service; avoid uploading the same report to multiple vendors. Check upload and retrieval authorisation, file limits, source retention and deletion. Do not expose permanent public report URLs.

Local storage persists onboarding, draft capture/review and a queue of explicitly confirmed pending writes. Clearly distinguish queued, saving and saved. Use stable operation IDs across reconnects. On conflict/retry, reconcile server confirmation before writing again. Do not promise offline AI; allow users to enter/retain data and resume processing when online.

## 5 Delivery sequence and checkpoints

### Checkpoint A Foundation

Resolve essential questions; finalise device target and hard deadline. Provision separate Tenday services. Wire secrets safely, select the compatible SDK, create the app shell, theme, shared primitives and real identity boundary. Produce app icon/splash/vector assets matching the board. Run a clean typecheck/build and smoke launch.

### Checkpoint B Complete daily loop

Implement onboarding, goal persistence, Today, text capture/review/confirmation, history edits and local-day aggregation with real backend records. Then add photo recognition and voice transcription to the same review. Validate durable recovery, duplicate prevention, portion maths and permissions on device.

### Checkpoint C Assistant and reports

Wire bounded personal context, conversation persistence, explicit memory and daily guidance with source explanations. Implement report image/PDF processing, editable extraction, confirmation, detail/source and valid comparisons. Handle real API failures and deletion. Complete two-identity isolation checks.

### Checkpoint D Polish and submission readiness

Review every normal/empty/loading/offline/denied/error/success state. Fix small-device and large-font issues. Perform full user-style journeys, measure capture friction and inspect app startup/bundle/release size. Finish checks and an optimised installable build. Record a short walkthrough, prepare public-safe screenshots/sample reports and update README with exact reproducible commands and honest limits.

Do not call the work complete while primary flows are simulated or broken. When time is tight, narrow secondary scope transparently rather than adding dead controls or claiming a demo response is live AI. The owner can seek the assignment's early feedback once the scope and main screens are reviewable; do not send messages automatically.

## 6 Verification matrix

| Area | Meaningful checks |
| --- | --- |
| Goals | Fresh onboarding, optional skip, edit, invalid target, relaunch |
| Nutrition domain | Per-item portion scaling, units, aggregation, edits/deletes, local midnight/timezone |
| Meal flow | Real text/photo/voice, low-confidence response, correction, cancel, denied permission |
| Reliability | Offline queued save, timeout/retry, duplicate request/tap, crash/restart, stale response |
| Reports | Supported image/PDF, bad MIME/oversize/blurred/empty, missing units, qualitative/bounded values, duplicate upload |
| Report review | Draft vs confirmed, source/units/ranges, correction, compatible-only trends, deletion |
| Assistant | Data-grounded context, no invented memory, context changes/cache, rate limit, unavailable model |
| Privacy | Two-identity query/mutation/storage isolation, secret-free client and Git, deletion/context removal |
| Usability | Small phone, text scale, keyboard/safe areas, back/cancel, screen reader, contrast, reduced motion |
| Delivery | Clean install, lint/types, production bundle, installable build, size report, recording and README |

Test pure rules and integration boundaries where failures matter. Use a lightweight appropriate harness, not a large test platform for trivial view wrappers. Perform manual/native device flows as well as automated checks. Record commands and evidence with limitations in `docs/VERIFICATION.md` during implementation.

## 7 Definition of done

All four journeys work with real persistence and live configured AI or a clearly explained recoverable unavailability state. No normal-path fake analysis, empty tap targets or unlabelled hardcoded personal data. Brand and core primitives are consistent, capture is low friction, values are reviewable, health explanations are non-diagnostic, private records are isolated, and credentials never reach the client/repository.

The public repo has meaningful commits, a committed lockfile, reproducible setup/run/build steps, disclosed scope/stack choices, a verification record and an optimised build plus walkthrough. The owner sees a short handback with links, what works and any remaining limitation. External submission still needs an explicit sending instruction.


## Delivery checkpoint — 8 November 2026

- A complete: scope, separate services, real anonymous identity and signed native launch.
- B complete: real text/photo analysis, editable review and portion maths, confirmation/history, Today aggregation, durable drafts and offline pending/reconnect.
- C complete: contextual Agent conversation, visible preferences, grounded daily guidance, PDF/image reports, exact-value review, private source retrieval and owner isolation.
- D delivered as a preview: 29 tests, lint/types, web export, signed 58.47 MiB APK, activity-recreation regression checks, enlarged text, artifact scan, public-safe screenshots and short recording. Physical microphone/camera capture and a full software-keyboard check remain device limitations, not claims of successful emulator testing. The owner subsequently requested separate React + Vite web delivery in `apps/web`; Sites is no longer a delivery target.

## Web correction checkpoint

React + Vite + TypeScript web client in `apps/web`, sharing existing Convex ownership/auth/AI policies and domain validators with mobile. Public-URL configuration follows the MemoHack pattern. Four flows, durable drafts/confirmation queue and private-source handling must be verified before replacing the web release archive. The owner handles the unwanted cloud Site deletion; no new hosting or login funnel is requested.

## Owner-requested account and demo expansion

- Replace automatic anonymous entry with custom email/password sign-in/sign-up screens, followed by three demo-profile choices.
- Use the established Convex Auth password implementation and a restricted server-issued demo provider; never share personal credentials or permit arbitrary owner selection.
- Seed three distinct fictional personas with a week of varied meals, current-day progress, comparable dated lab reports with real source PDFs, and explicitly labelled example conversations. All post-entry actions remain real and durable.
- Add profile identity, demo-mode disclosure, sign-out/switching and owner-scoped drafts/queues. Do not switch identities while confirmed writes are pending.
- Verify duplicate/concurrent demo entry, cross-platform shared persistence, real signup/signin, wrong-password denial, private/demo isolation, uploads/chat and updated release builds.
