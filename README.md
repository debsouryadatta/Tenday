# Tenday

A calm personal health companion. Set a useful goal, log a meal with less effort, understand your day, and keep health reports with their original context.

Tenday uses the approved **Carefold** emblem, Inter, forest green, sage and a white-first interface. Today is home; the assistant stays one tap away.

## Four complete journeys

- **Find your rhythm:** short goal setup, optional preferences, an editable daily reference and persistent anonymous identity.
- **Log a meal:** photo, device/browser speech recognition or text → editable food and portion review → explicit Save. History supports corrections and deletion.
- **Understand today:** progress from confirmed records, one grounded next step, and a durable contextual conversation. Preferences are visible and editable; AI cannot silently save a meal or change a goal.
- **Read a report:** private image/text-PDF upload → exact-value review → confirmation → history, original source and plain-language explanation through Assistant.

Workouts, wearables, social features, subscriptions and complex signup are deliberately out of scope. No normal flow is seeded with pretend personal records or hardcoded AI results.

## Run it

Requires Node 26, pnpm 12.18.0 and a separate Convex development project. Android release builds additionally need JDK 21 and the Android SDK.

```sh
pnpm install --frozen-lockfile
pnpm --filter @tenday/convex exec convex dev
```

Follow [setup instructions](docs/SETUP.md) to prepare private anonymous-auth/signing configuration and the public mobile backend addresses, then:

```sh
pnpm --filter @tenday/mobile start
pnpm verify
pnpm build:web
pnpm build:android
```

The existing Tenday deployment is already configured on the original machine. No further credentials should be requested there. OpenRouter credentials stay on the backend; mobile environment variables contain only public Convex addresses.

## AI and privacy

AI is **free-only**. `OPENROUTER_TEXT_MODEL` and `OPENROUTER_VISION_MODEL` are server-side Convex variables, currently set to `dots-studio/dots-3-note-preview:free`. Requests cap model prices at zero and disallow collection-based routing; there is no paid fallback or paid PDF OCR. See [model research, configuration and limits](docs/AI.md).

Convex Auth securely issues anonymous sessions. Every health record, action context and file operation derives ownership from the authenticated session. Sources are retrieved through authenticated HTTP, without permanent public storage links. Draft AI output is separate from confirmed records. An upload alone never saves a report.

A stable local queue retains explicitly confirmed pending writes, with server-side operation IDs preventing duplicate saves. Offline AI is unavailable. Reopening without a network may require reconnection before private cloud records can open; local drafts and pending writes remain stored. Clearing app/browser storage loses access to an anonymous space; cross-device account recovery is outside this version.

## Boundaries

- Nutrition is estimated and user-reviewable. Calorie references are editable examples, not personal prescriptions.
- Supported reports: JPEG/PNG and unlocked, text-based PDFs up to 3 pages and 6 MB. Scanned PDFs need clear page images or manual entry. Exact qualitative/bounded values and missing units stay intact.
- Intervals come from the source lab. Earlier values are listed only for the same marker and exact unit; different lab methods may still make comparison inappropriate.
- Voice requires an available device/browser speech service and permission. Unavailable capture has text/gallery/manual fallbacks.
- Free model availability and rate limits change. Input is retained when AI fails. The current preview model is listed for retirement on 31 December 2026; switching its Convex variables requires no app rebuild.
- This is an adult general-wellbeing prototype, not a diagnostic service.

## Architecture and evidence

`apps/mobile` owns native UI, permissions, editable drafts and the local queue. `packages/convex` owns authenticated records, daily aggregation, files, AI policy/jobs and the Convex Agent conversation. `packages/domain` contains shared validation and calculations. Convex deliberately replaces the source brief's SQL suggestion following the owner's explicit stack choice; Firebase is unnecessary for this implementation.

See [verification evidence](docs/VERIFICATION.md), [design system](docs/DESIGN_SYSTEM.md), [implementation plan](plans/IMPLEMENTATION.md) and [continuation handoff](docs/HANDOFF.md). The synthetic report in `output/pdf` is labelled as invented test data and is not a clinical reference.

Public GitHub: https://github.com/debsouryadatta/Tenday . Release APK, hosted-preview and recording links will be added after final native verification.
