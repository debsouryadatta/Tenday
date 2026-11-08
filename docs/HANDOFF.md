# Tenday build handoff

The owner wants the complete app built autonomously with short, high-level updates. This file and linked documents preserve the working state across threads.

## Delivered preview — 8 November 2026

The owner’s initial gate is settled: Android APK + web preview, no fixed deadline, free-only OpenRouter AI through server-side configurable model IDs. Continue autonomously for fixes; do not re-ask brand, stack, account or minor engineering choices.

The scoped app is implemented with real persistence/AI: goal setup; photo/device-speech/text meal capture, editable review, save/history; Today progress and grounded guidance/contextual conversation; private report image/text-PDF upload, review, confirmation, history and original source. Convex Auth issues private anonymous sessions. Normal paths contain no seeded personal data or disguised sample responses.

Delivery files: `output/android/Tenday.apk` (signed, minified universal, 58.47 MiB), `output/web/Tenday-web.zip`, `output/video/Tenday-walkthrough.mp4`, `output/delivery/BUILD_INFO.md` and checksums. Public release: https://github.com/debsouryadatta/Tenday/releases/tag/v1.0.0-preview . The recording is edited at 2× with cuts and synthetic health data.

Verification: 29 tests, lint, mobile/backend TypeScript, web export, signed native builds, signature/artifact scans, live text/photo meal recognition and PDF/image report extraction. Native checks covered onboarding, review/correction/save, offline pending/reconnect, report picker/extraction/confirmation/source, contextual chat, camera denial, unavailable speech and enlarged text. Install/update preserved the identity, records and conversation. See `docs/VERIFICATION.md` for exact limits; no physical camera or successful microphone transcript is claimed on this minimal emulator. Its source fallback opens Android’s share sheet because no PDF viewer is installed, and its headless input method limits keyboard evidence.

Important regression fixes: Android activity recreation exposed Expo Router’s shared imperative router becoming unbound. Every screen now uses scoped `useRouter()`; parameter clearing and back checks use scoped `useNavigation()`. Font-size recreation → goal navigation and report → Understand → send/clear were retested successfully. Do not reintroduce shared imperative navigation. Chat follows new messages and shows errors beside the composer. The server rejects known overconfident clinical phrases before saving assistant output; this is a narrow check, not medical validation.

Hosting: the [private HTTPS preview](https://tenday-preview.debsourya.chatgpt.site) was successfully published through Sites, preserving owner-only access. It does not depend on this laptop. Site ID: `appgprj_6af0093572cc81918d419ab30f6665a1`; deployment `appgdep_6af009c85dc88191824fd1ef39605d6d`; static export source commit `1c1a7f91fd7063b2dda26167ce53ec98e989a169`. The isolated hosting checkout is ignored at `.local/sites-preview`; canonical app source remains this GitHub repository. Use the Sites skill to update it, preserving identity/audience. Never publish the root repo’s private files. Earlier Quick Tunnels were temporary and were stopped by the T3 restart. GitHub Pages passes but the inherited custom domain fails DNS; no global domain settings were changed.

AI: `dots-studio/dots-3-note-preview:free` for text and vision, served by AtlasCloud. Zero-price provider caps, collection denied, no paid fallback/OCR. NVIDIA trial endpoints were excluded because they prohibit personal input. The current model retires 31 December 2026; change Convex variables as needed. Anonymous identity has no cross-device recovery: clearing local storage loses access to that private space.

App source: `6856df4` (includes activity recreation/completion fixes). Public documentation may have a later commit. Private brief, synthetic live-test sessions, independent Tenday JWT/signing material and the authorised key remain ignored in `.local/` / `.env.local`. Never copy another app’s keys or use its deployment. No email/WhatsApp submission was sent.

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

Use Expo/React Native/TypeScript + Convex + OpenRouter. Convex is the owner's latest explicit choice, despite the original SQL suggestion. Tenday, Carefold, capital T, calm sage, Inter, white-first screens, flat cards, pill buttons and native sheets are approved. Reuse MemoHack's patterns, not its full architecture or study content.

The earlier visual exploration is context only. Normal app features now use real records/AI; never replace them with simulated responses.

## Communication and handback

The owner does not want detailed technical interrogation. Ask only the few high-level decisions needed to run independently. At completion, give a short summary with repository/build/recording links and honest remaining limitations. Do not send email or WhatsApp messages just because the brief lists submission instructions.
