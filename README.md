# Tenday

A calm personal health companion. Set a useful goal, log a meal with less effort, understand your day, and keep health reports with their original context.

Tenday uses the **Carefold** emblem and the **Night & Lime** design system: white-first screens, ink actions, a lime accent, Inter and an animated assistant mark. Today is home; the assistant stays one tap away.

## Try it

- **Web app:** https://tenday-two.vercel.app (phone width behaves like the mobile app; desktop opens a dashboard)
- **Android APK:** [Tenday.apk](https://github.com/debsouryadatta/Tenday/releases/download/v1.0.0/Tenday.apk) from the [v1.0.0 release](https://github.com/debsouryadatta/Tenday/releases/tag/v1.0.0)
- **Quick start:** tap the **Maya**, **Arjun** or **Leah** demo on the sign-in screen to explore populated, fictional data, or create your own account. The same account works on Android and web.

## Four complete journeys

- **Find your rhythm:** email/password sign-up or sign-in, short goal setup, optional preferences and an editable daily reference.
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

Follow [setup instructions](docs/SETUP.md) to prepare private auth/signing configuration and the public backend addresses, then:

```sh
pnpm --filter @tenday/mobile start
pnpm dev:web
pnpm verify
pnpm build:web
pnpm build:android
```

The existing Tenday deployment is already configured on the original machine. No further credentials should be requested there. OpenRouter credentials stay on the backend; client config contains only public Convex addresses.

## AI and privacy

AI is **free-only**. `OPENROUTER_TEXT_MODEL` and `OPENROUTER_VISION_MODEL` are server-side Convex variables, currently set to `dots-studio/dots-3-note-preview:free`. Requests cap model prices at zero and disallow collection-based routing; there is no paid fallback or paid PDF OCR. See [model research, configuration and limits](docs/AI.md).

Tenday has custom email/password sign-up and sign-in screens on Android and web. Convex Auth hashes passwords with Scrypt and issues signed sessions. The same personal account opens the same records on either platform. Personal accounts start empty and stay separate from the demos. Every record, action context and source-file operation still derives ownership on the backend.

Three **shared, fictional demo profiles** sit directly below the auth form: Maya (meal rhythm), Arjun (protein awareness) and Leah (energy awareness). Each starts with 23 meals over eight days, 3 dated reports with original labelled PDFs, preferences, a starter suggestion and 8 clearly labelled example messages. Anyone may enter and edit a demo; changes are visible to everyone using that profile across Android/web. Only use sample information there. Subsequent capture, confirmation, upload and AI chat run through the real backend.

Sign out or switch profiles from the account control. Unsent drafts remain scoped to their account; pending confirmed writes must finish or be discarded before switching. The backend prevents duplicate saves and rejects cross-owner access. Offline AI is unavailable; reopening cloud data may require reconnection.

Email addresses are not verified, and password recovery is not configured in this preview. An email-delivery provider and recovery/verification should be configured before opening personal accounts to actual users. Existing anonymous preview records are retained separately; they are not copied into shared demos.

## Boundaries

- Nutrition is estimated and user-reviewable. Calorie references are editable examples, not personal prescriptions.
- Supported reports: JPEG/PNG and unlocked, text-based PDFs up to 3 pages and 6 MB. Scanned PDFs need clear page images or manual entry. Exact qualitative/bounded values and missing units stay intact.
- Intervals come from the source lab. Earlier values are listed only for the same marker and exact unit; different lab methods may still make comparison inappropriate.
- Voice requires an available device/browser speech service and permission. Unavailable capture has text/gallery/manual fallbacks.
- Free model availability and rate limits change. Input is retained when AI fails. The current preview model is listed for retirement on 31 December 2026; switching its Convex variables requires no app rebuild.
- This is an adult general-wellbeing prototype, not a diagnostic service.

## Architecture and evidence

`apps/mobile` owns the Expo/React Native Android app. `apps/web` is a standalone React + Vite + TypeScript app with React Router, native HTML dialogs, browser capture, durable drafts and a confirmation queue. Both share the semantic theme tokens and Convex/domain packages. Public Convex addresses live in each app’s `src/constants/index.ts`, with optional environment overrides. `packages/convex` owns authenticated records, daily aggregation, files, AI policy/jobs and the Convex Agent conversation. `packages/domain` contains shared validation and calculations. Convex deliberately replaces the source brief's SQL suggestion following the owner's explicit stack choice; Firebase is unnecessary for this implementation.

See [verification evidence](docs/VERIFICATION.md), [design system](docs/DESIGN_SYSTEM.md), [implementation plan](plans/IMPLEMENTATION.md) and [continuation handoff](docs/HANDOFF.md). The synthetic report in `output/pdf` is labelled as invented test data and is not a clinical reference.

Public GitHub: https://github.com/debsouryadatta/Tenday .

Downloads: [Android APK](https://github.com/debsouryadatta/Tenday/releases/download/v1.0.0/Tenday.apk) (arm64, signed release) and [static web build](https://github.com/debsouryadatta/Tenday/releases/download/v1.0.0/Tenday-web.zip). The hosted web app is https://tenday-two.vercel.app . Run it locally with `pnpm dev:web` (port 5173), or deploy `apps/web/dist` to any HTTPS static host with an SPA fallback (`apps/web/vercel.json` supplies the rewrite for Vercel). See [verification](docs/VERIFICATION.md) for exact evidence and device limitations.
