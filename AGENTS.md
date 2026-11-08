# Tenday agent instructions

Build a polished personal health companion, with product and UX quality first. The user wants short, high-level conversation and autonomous execution after the initial decision round.

## Read before doing work

1. `docs/HANDOFF.md` — current state, user instructions and first-turn gate.
2. `docs/CONTEXT.md` — approved brand, product decisions and reference apps.
3. `docs/BRIEF.md` — assignment requirements and evaluation coverage.
4. `plans/IMPLEMENTATION.md` — flows, architecture, sequencing and acceptance criteria.
5. `docs/DESIGN_SYSTEM.md` and `docs/DECISIONS.md`.
6. On the original machine, `.local/LOCAL_CONTEXT.md` and `.local/source-brief.txt` supply private source details. They must remain untracked.

The Google Doc is the source brief: https://docs.google.com/document/d/1aZeIitZOeb8W9lqR6rL36Mkspq65T2hpa0hr848rbNc/edit?tab=t.0 . If it cannot be read, use the complete local export. Never claim to have reviewed a source that you could not access.

## Initial implementation gate

The owner explicitly requests one short round of important questions in the new build thread BEFORE app implementation. Review what is available first. Ask only unresolved decisions that materially change scope, cloud account choice, AI spend or delivery. Do not ask the owner to choose libraries, component radii, database field names or routine engineering details. Do not treat silence as an answer to a required question. After answers arrive, record them and proceed autonomously within the agreed scope.

## Settled decisions

- Name and wordmark: **Tenday**, capital T. Never revert to `tenday` in the displayed wordmark.
- Selected emblem: **Carefold**, the rounded folded symbol in `assets/brand/approved-carefold-board.png`. It was numbered 03 in the exploration. The user's conflicting phrase “first logo” was resolved by the named Carefold selection and their subsequent approval. Do not substitute Tender T.
- Calm sage palette; white-first UI; Inter; flat surfaces; pill CTAs; subtle motion.
- Expo + React Native + TypeScript; Convex backend; OpenRouter for AI. The user's latest explicit Convex choice takes precedence over the original brief's Node + SQL suggestion. Firebase was suggested, but must serve a clear purpose rather than duplicate Convex.
- Today is the landing screen; assistant is contextual and one tap away. No chat-only home.
- Four core flows, fully functional: goal setup; meal logging; daily guidance/progress and conversation; report upload/review/understanding.
- Do not implement workouts, wearables, social feeds, subscriptions or large admin apps for v1.

## Engineering and verification

- Use a small workspace: `apps/mobile` (Expo), `apps/web` (React + Vite + TypeScript), `packages/convex` and shared `packages/domain`. The owner explicitly requested a separate web app alongside mobile; do not use ChatGPT Sites for building or hosting it. Do not copy the full MemoHack monorepo or stale dependency versions.
- One theme-token source and reusable native components. Read the design references before UI work. All screens must use shared primitives.
- Backend owns confirmed records, aggregation and AI secrets. Validate input and model output. Draft AI output is not a saved meal or report.
- Every private record and storage operation must be scoped to authenticated or securely issued anonymous identity. A client-chosen profile ID alone is not access control.
- Keep OpenRouter keys server-side. No `EXPO_PUBLIC_` secret, secret arguments echoed to tools, committed env files or shared MemoHack cloud resources.
- Reuse only the explicitly authorised OpenRouter key, in `.env.local`. Never print it. Ask for genuinely missing credentials using the active secret-input tool, not chat.
- Keep changes small and reviewable. Verify typecheck/lint/build plus meaningful domain and integration cases. No tests that merely repeat implementation.
- Use T3 Device tools for simulator/emulator UI. Follow current browser tool rules for requested browser work; do not change OS sandbox policy to make a preview work.
- No automatic email/WhatsApp submission. Prepare deliverables and ask only if the user subsequently authorises sending.

## Working style

Communicate outcomes and meaningful blockers in plain language. Keep user-facing messages short. Do not ask again about approved brand, stack, repo creation or the user's permission to work. Keep the plan and decisions up to date so a fresh thread can continue without chat history.
