# Tenday build handoff

You are starting a new top-level build thread. The previous discussion is fully represented here and in the linked files; do not assume access to its chat history. The owner wants the complete app built autonomously after one short round of important decisions.

## Active build status — 8 November 2026

The initial gate is complete: Android APK + web preview, no fixed deadline, free-only OpenRouter AI, with server-side configurable model IDs. Continue autonomously; do not re-ask approved choices.

Implemented: Expo SDK 58 / React Native 0.88 app, shared Inter/sage components, two-step goal setup, Today, text/photo/voice-service capture, editable meal review, history/edit/delete, durable confirmed-write queue, private report upload/review/history/source, and contextual conversation using the Convex Agent component. Convex Auth issues persistent anonymous sessions; cloud ownership comes from authenticated identity.

Verified so far: 25 domain/backend tests, lint, mobile/backend TypeScript, web export, live anonymous auth and goal persistence, free text meal analysis, real-food photo recognition, grounded assistant replies, and synthetic PDF/image report extraction. Live source HTTP checks returned 200 for the owner and 404 without auth. The web flow was exercised in the Android WebView shell: onboarding → Today → text analysis → editable portion correction → Save → correct updated totals. Analysis alone did not create saved meals.

AI: `dots-studio/dots-3-note-preview:free` is configured on Tenday's dev deployment for text and vision. Requests disallow collection-based routing and cap all model prices at zero. NVIDIA free endpoints were excluded because their terms prohibit personal input. No paid inference or OCR was used. See `docs/AI.md` for retirement/availability caveats.

Remaining: complete the signed Android release build and native UI journeys; check permission/unavailable speech behavior, offline queued saves/relaunch, report picker/review/source on device, small/large text layouts, and final build size; prepare the recording and hosted web preview; update README/setup/verification and publish the remaining source commits. Do not call the app complete until this evidence exists. T3 browser preview failed twice with the Ubuntu AppArmor restriction; CUA browser host was also unavailable. Android WebView through T3 Device tools worked as the browser fallback. Do not change host security settings.

The first backend commit is `bef5cf9`; the mobile app and later fixes are still uncommitted at this checkpoint. `scripts/build-android.mjs` builds with two workers and independent Tenday signing from ignored `.local/android-signing.properties`; no MemoHack signing material is used. The current native build was interrupted before producing an APK and is being resumed. Logs and synthetic live-test sessions stay in ignored `.local/`. Only synthetic health inputs were used for tests.

## Original first-turn instructions (completed)

1. Read `AGENTS.md`, this file, `docs/CONTEXT.md`, `docs/BRIEF.md`, `docs/DECISIONS.md`, `docs/DESIGN_SYSTEM.md`, `plans/IMPLEMENTATION.md` and `docs/SETUP.md`.
2. Inspect `assets/brand/approved-carefold-board.png`. The chosen symbol is Carefold, not Tender T; the wordmark must read **Tenday**.
3. Read the [original brief](https://docs.google.com/document/d/1aZeIitZOeb8W9lqR6rL36Mkspq65T2hpa0hr848rbNc/edit?tab=t.0) end to end. On this machine the full export is `.local/source-brief.txt`; use it if Google Docs is inaccessible. The public restatement intentionally omits the brief's prohibited placeholder/organisation strings and submission contacts.
4. Read `.local/LOCAL_CONTEXT.md` for the MemoHack checkout, available secrets, tooling caveats and local preview limitation. Do not print `.env.local` or inspect unrelated credentials.
5. Ask ONE concise group of unresolved essential questions from `docs/DECISIONS.md`, with sensible recommended choices. Explain little technical detail. Wait for required answers before app implementation; do not interpret silence as approval.

The current setup thread has deliberately stopped before feature implementation. Do not assume an Expo app, deployed schema or production services exist unless the setup record explicitly confirms them. Do not restart brand exploration or ask again for authorised repository/workspace creation.

## After the owner answers

Update decisions and refine the plan around the deadline/budget, then implement all four core journeys with real persistence and honest AI behavior. Follow the design system, share primitives, verify on device and keep the owner informed briefly. Resolve minor implementation choices yourself. Revisit only genuinely blocking account/credential, scope or cost issues.

The source brief emphasises 3–4 polished real flows, thoughtful UX, state/edge-case handling, small build size, architecture, public GitHub commits/README, installable delivery and a short recording. Product quality has priority over feature count. The app needs an active personal-assistant loop; a passive tracker or chat-only home will miss the intent.

## Setup and secrets

The root `.env.local` contains ONLY the owner-authorised OpenRouter key and is ignored. Once a separate Tenday Convex deployment is configured, set it as a server-side backend environment variable without echoing the value. Never reuse MemoHack's deployment, signing keys or email-service credentials. No key belongs in mobile public env variables, committed files, prompts or logs.

If a new credential is needed, use the active secret-input mechanism. Existing authorised local credentials should not be requested again. Firebase should be included only for a concrete need and should not become a duplicate database.

## Scope and brand are settled

Use Expo/React Native/TypeScript + Convex + OpenRouter. Convex is the owner's latest explicit choice, despite the original SQL suggestion. Tenday, Carefold, capital T, calm sage, Inter, white-first screens, flat cards, pill buttons and native sheets are approved. Reuse MemoHack's patterns, not its full architecture or study content.

The repo contains the earlier visual exploration for context. All its samples are illustrative. Replace simulated capture/report responses with real behavior during implementation and keep any demo mode visibly labelled.

## Communication and handback

The owner does not want detailed technical interrogation. Ask only the few high-level decisions needed to run independently. At completion, give a short summary with repository/build/recording links and honest remaining limitations. Do not send email or WhatsApp messages just because the brief lists submission instructions.
