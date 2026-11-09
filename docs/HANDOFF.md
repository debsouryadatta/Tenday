# Tenday build handoff

The owner wants the complete app built autonomously with short, high-level updates. This file and linked documents preserve the working state across threads.

## Current change: Night & Lime visual redesign — 9 November 2026

The owner rejected the previous UI as generic and asked for a full visual redesign of both apps with no functional change, inspired by Cal AI and Apple News. They picked the **Night & Lime** palette from five options. The Carefold shape is unchanged; it's recoloured only (ink emblem on light surfaces, lime on the ink app icon/favicon). Every mobile screen and every web page was rebuilt on new shared primitives; see `docs/DESIGN_SYSTEM.md`. Web at phone widths mirrors mobile; at 1024px and up it's a sidebar dashboard. The assistant has an animated mark adapted from MemoHack. Bottom tabs were chosen over the full-screen variant after comparing both on the device. Android gesture and 3-button navigation were both checked. System back now pops in-app screens (`predictiveBackGestureEnabled: false`).

Verified live on Android (debug + Metro) with the Maya demo: sign-in, Today, a real AI meal estimate → review → save → ring/toast update, a real assistant reply with the thinking mark, Reports, report detail, account sheet. Web was checked at 1280/390/320px. Lint, all typechecks, 40 tests and the web build pass.

Physical-device delivery: at the owner's request, the redesigned signed APK was transferred through `ssh mac-pro` and installed successfully on their USB-connected Poco X3 Pro (Android 12, arm64). Tenday opened to its real sign-in/demo screen. Remote taps are blocked by the phone's `INJECT_EVENTS` security restriction, including the diagnostic retry; no post-login physical-device flow is claimed. The Mac T3 connector rejected the calling thread, so the owner-authorised SSH route used a separate named agent-device session. The Mac emulator was not targeted. See the physical-device entry in `docs/VERIFICATION.md`.

Submission release (v1.0.0): splash screen and sheet nested-scroll patch, an arm64-only 20 MB APK, and the web app on Vercel at https://tenday-two.vercel.app. The owner sends the email themselves, adding their own Loom link; a draft is in `.local/submission-email.md`. Pending: the owner's manual check that sheets scroll to the top before dismissing. Details are in `docs/VERIFICATION.md`.

## Earlier change: accounts and three shared demos

The owner's latest instruction supersedes anonymous-only entry: both apps now have custom email/password sign-up/sign-in, with Maya, Arjun and Leah demo cards directly underneath. Personal accounts use Convex Auth Password (Scrypt), remain isolated and work across Android/web. The `demo` credentials provider only issues one of three canonical server-selected demo identities; it never trusts a caller-supplied owner ID. Existing anonymous records remain separate and are not migrated into public demos.

Demos are intentionally shared/editable by anyone who enters them. Each contains 23 fictional meals across eight days, 3 comparable dated lab reports with generated original PDFs, goal/preferences, a grounded starter suggestion and 8 explicitly labelled example messages. Later user actions and AI replies use the real backend. Shared demo mode is labelled in both apps. No paid AI is enabled.

Sign-out/profile switching lives under Profiles and account. Pending confirmed writes block switching; unsent drafts stay keyed to their owner. The shared platform-independent identity hook is in `apps/mobile/src/lib/auth-session.tsx`, imported by the web client as well. No duplicate auth storage/backend is introduced. Email verification/password recovery are not configured in this preview and require an email-delivery provider before actual-user rollout.

Demo fixtures are in `packages/convex/src/lib/demoData.ts`. Entry/seeding is transactional and idempotent; later logins preserve edits/deletions. A new current day is added once on a later login. Private internal maintenance `demo:reset` can reset one demo, keeping its canonical identity. Never reset personal users or copy private records into demos.

Verification: 40 tests, all three typechecks/lint; live personal signup, case-normalized cross-client signin, wrong-password denial, three shared demo signins, cross-client writes/deletes, arbitrary-owner rejection and 9 generated source PDFs with access checks passed. The first native UI pass covered the sign-in/sign-up forms and demo entry. A session-switch race was found and fixed with a shared, staged sign-out → transport-clear → sign-in → confirmed-owner transition, plus five React lifecycle regression tests. Native verification also found that navigating away before switching remounted the root auth provider; the account sheet now starts the transition without that navigation. Maya → Arjun → Leah switching and sign-out passed on Android. The final APK also passed fresh personal email/password sign-in and Maya → Arjun switching. Refreshed APK, standalone Vite archive and walkthrough are packaged for the existing GitHub preview release. Exact source/checksums are in `output/delivery/BUILD_INFO.md` and `SHA256SUMS.txt`.

## Earlier preview, before the account/demo update — 8 November 2026

The owner’s initial gate is settled: Android APK + web preview, no fixed deadline, free-only OpenRouter AI through server-side configurable model IDs. Continue autonomously for fixes; do not re-ask brand, stack, account or minor engineering choices.

The scoped app is implemented with real persistence/AI: goal setup; photo/device-speech/text meal capture, editable review, save/history; Today progress and grounded guidance/contextual conversation; private report image/text-PDF upload, review, confirmation, history and original source. Convex Auth issues private anonymous sessions. Normal paths contain no seeded personal data or disguised sample responses.

Delivery files: `output/android/Tenday.apk` (signed, minified universal, 58.47 MiB), `output/web/Tenday-web.zip` (standalone React Vite build), `output/video/Tenday-walkthrough.mp4`, `output/delivery/BUILD_INFO.md` and checksums. Public release: https://github.com/debsouryadatta/Tenday/releases/tag/v1.0.0-preview . The recording is edited at 2× with cuts and synthetic health data.

Native delivery verification: 29 tests, lint, mobile/backend TypeScript, historical Expo web export, signed native builds, signature/artifact scans, live text/photo meal recognition and PDF/image report extraction. Native checks covered onboarding, review/correction/save, offline pending/reconnect, report picker/extraction/confirmation/source, contextual chat, camera denial, unavailable speech and enlarged text. Install/update preserved the identity, records and conversation. See `docs/VERIFICATION.md` for exact limits; no physical camera or successful microphone transcript is claimed on this minimal emulator. Its source fallback opens Android’s share sheet because no PDF viewer is installed, and its headless input method limits keyboard evidence.

Important regression fixes: Android activity recreation exposed Expo Router’s shared imperative router becoming unbound. Every screen now uses scoped `useRouter()`; parameter clearing and back checks use scoped `useNavigation()`. Font-size recreation → goal navigation and report → Understand → send/clear were retested successfully. Do not reintroduce shared imperative navigation. Chat follows new messages and shows errors beside the composer. The server rejects known overconfident clinical phrases before saving assistant output; this is a narrow check, not medical validation.

Web delivery correction: the owner requires a standalone React + Vite + TypeScript app in `apps/web`, alongside Expo `apps/mobile`. Both use the existing Convex backend, shared domain rules and semantic theme tokens. Public URLs are in each app’s `src/constants/index.ts` with environment overrides. Root `pnpm dev:web` runs Vite; `pnpm build:web` builds `apps/web/dist`. Do not publish or manage ChatGPT Sites. The owner is deleting the unwanted Site themselves; local hosting wrapper/archive and current links have been removed. GitHub’s web workflow now creates a portable build artifact without automatic hosting.

T3 browser: the owner explicitly requested recovery. Official `t3 browser setup` installed its scoped Chrome AppArmor profile; global user-namespace restrictions stay enabled. The browser opens normally. No ChatGPT sign-in is needed for Tenday.

AI: `dots-studio/dots-3-note-preview:free` for text and vision, served by AtlasCloud. Zero-price provider caps, collection denied, no paid fallback/OCR. NVIDIA trial endpoints were excluded because they prohibit personal input. The current model retires 31 December 2026; change Convex variables as needed. Anonymous identity has no cross-device recovery: clearing local storage loses access to that private space.

Android APK source: `6856df4` (includes activity recreation/completion fixes). The standalone Vite correction has 31 passing tests, web/mobile/backend typechecks, lint and production build. Browser checks cover onboarding, real text meal analysis, fractional edit/save/reload, synthetic PDF extraction/review/save/private source and contextual chat. See verification for limits. Public documentation may have a later commit. Private brief, synthetic live-test sessions, independent Tenday JWT/signing material and the authorised key remain ignored in `.local/` / `.env.local`. Never copy another app’s keys or use its deployment. No email/WhatsApp submission was sent.

## Original first-turn instructions (completed)

1. Read `AGENTS.md`, this file, `docs/CONTEXT.md`, `docs/BRIEF.md`, `docs/DECISIONS.md`, `docs/DESIGN_SYSTEM.md`, `plans/IMPLEMENTATION.md` and `docs/SETUP.md`.
2. Inspect `assets/brand/approved-carefold-board.png`. The chosen symbol is Carefold, not Tender T; the wordmark must read **Tenday**.
3. Read the [original brief](https://docs.google.com/document/d/1aZeIitZOeb8W9lqR6rL36Mkspq65T2hpa0hr848rbNc/edit?tab=t.0) end to end. On this machine the full export is `.local/source-brief.txt`; use it if Google Docs is inaccessible. The public restatement intentionally omits the brief's prohibited placeholder/organisation strings and submission contacts.
4. Read `.local/LOCAL_CONTEXT.md` for the MemoHack checkout, available secrets, tooling caveats and local preview limitation. Do not print `.env.local` or inspect unrelated credentials.
5. Ask ONE concise group of unresolved essential questions from `docs/DECISIONS.md`, with sensible recommended choices. Explain little technical detail. Wait for required answers before app implementation; do not interpret silence as approval.

The initial decision round is complete and the app exists. Do not restart brand exploration, scaffold a replacement app or re-ask approved choices.

## After the owner answers

Update decisions and refine the plan around the deadline/budget, then implement all four core journeys with real persistence and honest AI behavior. Follow the design system, share primitives, verify on device and keep the owner informed briefly. Resolve minor implementation choices yourself. Revisit only genuinely blocking account/credential, scope or cost issues.

The source brief emphasises 3–4 polished real flows, thoughtful UX, state/edge-case handling, small build size, architecture, public GitHub commits/README, installable delivery and a short recording. Product quality has priority over feature count. The app needs an active personal-assistant loop; a passive tracker or chat-only home will miss the intent.

## Setup and secrets

The root `.env.local` contains ONLY the owner-authorised OpenRouter key and is ignored. The separate Tenday deployment is configured and the authorised key is already set server-side. Never reuse MemoHack's deployment, signing keys or email-service credentials. No key belongs in mobile public env variables, committed files, prompts or logs.

If a new credential is needed, use the active secret-input mechanism. Existing authorised local credentials should not be requested again. Firebase should be included only for a concrete need and should not become a duplicate database.

## Scope and brand are settled

Use Expo/React Native/TypeScript + Convex + OpenRouter. Convex is the owner's latest explicit choice, despite the original SQL suggestion. Tenday, Carefold, capital T, Night & Lime (replaced calm sage on 9 November 2026), Inter, white-first screens, flat cards, pill buttons and native sheets are approved. Reuse MemoHack's patterns, not its full architecture or study content.

The earlier visual exploration is context only. Normal app features now use real records/AI; never replace them with simulated responses.

## Communication and handback

The owner does not want detailed technical interrogation. Ask only the few high-level decisions needed to run independently. At completion, give a short summary with repository/build/recording links and honest remaining limitations. Do not send email or WhatsApp messages just because the brief lists submission instructions.
