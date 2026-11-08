# Tenday decisions

## Confirmed by the owner

| Decision | Outcome |
| --- | --- |
| App name | Tenday, capital T |
| Logo | Carefold, approved uppercase-T wordmark board |
| Colour direction | Calm sage, forest-green primary, light default |
| Design patterns | MemoHack mobile system adapted to this brand |
| Product reference | Muse's personal assistance + Cal AI's effortless meal capture |
| Frontend | Expo/React Native mobile; separate React + Vite + TypeScript web app in `apps/web` |
| Backend | Convex; latest instruction deliberately supersedes source brief's SQL suggestion |
| AI | OpenRouter; reuse only the explicitly authorised local key |
| Repository | GitHub repo named Tenday; public as required by the source brief |
| Workspace | New Tenday project under the existing Practice directory |
| Process | Detailed durable handoff; new top-level thread asks essential questions before app implementation |
| Autonomy | After the initial answers, build independently and raise only material blockers |

## Recommended scope from the discussion

Four complete flows: goal onboarding, meal capture/review/save, daily progress/contextual assistant, report upload/review/understanding. Today is home, with Assistant and Reports nearby. Keep workouts, wearable integrations, social features and complex signup out of v1. These were presented before the owner's approval to proceed; do not ask a new library-by-library scope questionnaire.

## Essential questions for the new build thread

Inspect available setup first; omit questions already resolved by evidence or the owner's latest reply.

1. **Delivery:** What is the hard deadline, and should the first handoff prioritise Android APK + web preview, or is an iOS shareable build required? Recommend Android + web on the current Linux machine; use a linked Mac only if iOS delivery is chosen and available.
2. **AI budget:** Free-only models, or a small paid budget? Ask for a concrete total cap if paid use is allowed. Recommend a modest capped budget for reliable vision/transcription only if the owner agrees. Do not infer an amount from key availability.
3. **Only if necessary:** An essential cloud login/account or a decision about real private users versus a synthetic demo. Prefer a persistent, isolated anonymous session with no signup screen. Resolve routine auth-library selection yourself. Firebase is optional; don't block a viable Convex solution merely because Firebase was mentioned.

No need to ask which logo, palette, stack, repo name, default navigation, font, border radius, component names or directory structure to use. Do not ask the owner to paste API keys in chat; use the active secret tool when a genuinely missing secret is required.

## Setup status

The handoff is prepared before feature implementation. Consult `docs/SETUP.md` for the final repository/cloud state and `.local/LOCAL_CONTEXT.md` for private original-machine details. Record subsequent owner answers here before implementing dependent work.

## Build preflight answers — 8 November 2026

- Delivery: Android APK plus web preview. No iOS deliverable is required.
- Schedule: no fixed cutoff; continue until the scoped app is complete.
- AI spend: free-only. No paid inference, paid fallback, credit purchase or automatic top-up is authorised.
- AI configuration: choose current suitable free OpenRouter models; model IDs must be configurable through server-side Convex environment variables.
- Initial gate is complete. Proceed autonomously within the four approved flows and raise only material blockers.

## Web delivery correction — 8 November 2026

- The owner explicitly wants the web app as React + Vite + TypeScript under `apps/web`, alongside `apps/mobile`, following MemoHack’s public-URL constants/config pattern. Both clients use the existing Tenday Convex deployment.
- No ChatGPT Sites building or hosting. The owner is deleting the unwanted Site themselves; the agent supplied deletion instructions and must not ask for ChatGPT sign-in or attempt further Site management. Local hosting wrapper/archive and active Site links are removed.
- The GitHub web workflow builds a portable Vite artifact, without automatic hosting. No unrelated account domains or DNS settings are changed.
- Authentication in Tenday remains securely issued anonymous sessions, with no ChatGPT login or signup funnel. Android installations and web origins have separate private identities; clearing storage loses access.
- The owner explicitly asked to fix the T3 browser. The official `t3 browser setup` installed its narrowly scoped Chrome AppArmor profile; the global user-namespace restriction remains enabled. T3 preview now opens successfully.

## Accounts and shared demos — owner update, 8 November 2026

The owner now explicitly requests real email/password sign-up and sign-in in both apps, with three one-tap shared demo profiles directly below the auth form. This supersedes the no-signup/anonymous-only choice. Build custom Tenday UI on the existing Convex Auth password provider, retaining secure password hashing and signed sessions. Demo identity is issued by a dedicated server provider restricted to three canonical fictional accounts, never by accepting arbitrary owner IDs.

Each shared demo is editable by anyone who enters it, across mobile/web, and contains rich fictional meals, reports/sources, preferences, guidance and labelled example conversations. Clearly identify shared demo mode and keep personal accounts isolated. Personal accounts start empty and can sign in on either platform. Preserve existing anonymous data; do not migrate it into demos. No paid AI or new third-party account is required. Email verification/password recovery are not configured in this preview and need an email-delivery service before public production use.

## Visual redesign — owner update, 9 November 2026

The owner judged the previous UI as generic and requested a complete visual redesign of every screen in both apps, with no functional change. References: Cal AI (effortless logging, big numeric dashboard, macro tiles) and Apple News (editorial headings, strong type hierarchy, cards with clear structure).

- Palette: **Night & Lime**, chosen by the owner from five options. Near-black ink actions on white, electric lime (`#D7F35A`) as the accent and on-ink highlight, soft lime tint for assistant moments, and distinct protein (coral), carbs (amber) and fat (blue) colours. This supersedes the calm sage/forest palette.
- Logo: keep the Carefold shape unchanged. Recolour only: black emblem on light surfaces, lime emblem on the black app icon.
- Web on phone widths must match the mobile app exactly. Wider screens get a dashboard layout with side navigation and multiple columns.
- Mobile navigation: try both full-screen (no tab bar) and bottom navigation, then choose based on how they look on the device.
- Assistant mark (owner request, 9 Nov): animated chat-bubble character with eyes and a spark, adapted from MemoHack's mark (blink/glance/hop/twinkle idle, thinking, happy), in Night & Lime. Tab stays "Assistant"; replies are authored by "Tenday".
- Navigation outcome: both layouts were tested on the emulator; bottom tabs plus a 50px ink + action were chosen (see DESIGN_SYSTEM.md). Android gesture navigation and 3-button navigation were both checked.
- Android system back previously left the app from pushed screens (no back callback with predictive back on). Fixed by setting `predictiveBackGestureEnabled: false`.
