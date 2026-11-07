# Tenday decisions

## Confirmed by the owner

| Decision | Outcome |
| --- | --- |
| App name | Tenday, capital T |
| Logo | Carefold, approved uppercase-T wordmark board |
| Colour direction | Calm sage, forest-green primary, light default |
| Design patterns | MemoHack mobile system adapted to this brand |
| Product reference | Muse's personal assistance + Cal AI's effortless meal capture |
| Frontend | Expo, React Native, TypeScript |
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
