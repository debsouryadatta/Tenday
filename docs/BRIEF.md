# Tenday product brief

Source: [complete original assignment](https://docs.google.com/document/d/1aZeIitZOeb8W9lqR6rL36Mkspq65T2hpa0hr848rbNc/edit?tab=t.0). This faithful restatement omits assignment-only placeholder names and private submission instructions. The complete text is also available on the original machine at `.local/source-brief.txt`.

## Objective

Build a personal health assistant where a person can record health-related information, talk to an assistant, share photos and improve daily habits against a clear personal goal. The value is helping people understand and improve their health habits, not merely storing data.

Suggested capabilities include food logging by voice/camera, goal-based calorie awareness and health-report uploads with parameter tracking. Exercise and external tracker integrations add scope and are optional.

## Required scope and experience

Select 3–4 core flows and make them close to real, with functioning interactions, states and edge cases. Do not build an entire broad health platform. Login may be omitted if data persists across reopening, or a few dummy profiles may be backed by a database. A separate profile screen is optional if progress is handled on home.

If considering a chat-first primary screen, discuss the UX early because it is difficult to execute well. Tenday's approved decision is a Today home with contextual chat instead.

The nominal assignment window is 1.5–2 days. Four complete flows are more valuable than ten mediocre screens. The owner may choose a different actual schedule; confirm a hard deadline once before starting.

## Evaluation

Final product has 70% weight, covering a usable goal-directed product, working technical flows and UI/UX. Code quality has 30% weight, covering coherent architecture, clear ownership and maintainable engineering.

Evaluate:

- Product judgment: why these flows, what was excluded, and how the assistant reduces work.
- Intuitive mobile UX and appropriate patterns, such as bottom sheets on phones and dialogs where appropriate on larger screens.
- Functional features, edge cases, sound frontend/backend structure, scalability judgment and readable code.
- A small sensible app bundle; avoid an unnecessarily large build.
- Good Git history and README, real user-style testing and clear ownership of AI-assisted code.
- Optional delight, motivation, achievements and cross-platform reach when they support the core experience.

## Self evaluation questions

1. Does this feel like a modern assistant rather than an old data-entry app?
2. Does onboarding establish an understandable goal?
3. Does the user know what to improve and why?
4. Does the assistant proactively reduce the user's work?
5. Are there motivating, positive signals of progress?
6. Is the experience intuitive, concise and uncluttered?
7. Would someone want to reopen it daily rather than abandon it after trying it?
8. Could the product support a useful habit for 90 days?

The personal-assistant analogy is a capable PA who knows preferences and goals, filters complexity and presents only the useful next action. Do not leave the user doing all the interpretation and coordination.

## Technology and quality constraints

The source suggests Expo, TypeScript, a Node backend and PostgreSQL/MySQL. The owner's latest explicit instruction selects Convex in place of SQL. Preserve the product, UX and engineering requirements while documenting that stack decision.

Model choice should consider free capacity and rate limits, not just capability. AI may help ideation and implementation, but architecture, review and user testing must be owned. Avoid unrelated trend-driven design, neobrutalism and a dark default for this health product.

Do not publish the original organisation name or placeholder app name in the assignment, repository content or hosted URLs. Tenday is the authentic app name. The private export contains the exact prohibited strings for final scanning.

## Feedback and delivery

The assignment allows one early product/design feedback round before implementation is too far along. Prepare a short scope/design review package; the owner handles external messaging unless explicitly authorised otherwise.

Before submission, self-assess against the criteria. If additional time is required, raise it early. Required deliverables are a public GitHub repository, a short Loom/screen recording and an optimised Android APK or shareable iOS build/link. Prepare a concise README with setup, scope, architectural choices, test evidence and known limits. Submission recipient, subject and notification channel remain in the local source brief. Do not send external messages automatically.

## Coverage map

| Brief requirement | Tenday response | Acceptance evidence |
| --- | --- | --- |
| Clear goal and reason | Short onboarding and editable goal summary | First-run and relaunch checks |
| Low-effort food entry | Camera, voice and text through one review flow | Real capture, edit, save, retry and duplicate prevention |
| Proactive personal help | One data-grounded daily next step and contextual conversation | Change inputs and see grounded output/provenance |
| Reports and parameters | Upload, extract, review, confirm, history | PDF/image, value/unit/date checks, invalid-file handling |
| Motivation | Gentle completion feedback and continuity | Empty, partial and completed day states |
| Persistence | Local draft queue plus separate backend records | App kill/relaunch, offline retry, two-session isolation |
| Production-like quality | Validated boundaries and narrow domain modules | Types, lint, integration tests and device flows |
| Small build and delivery | Minimal libraries, compressed assets, release build | Build-size report, APK/link, README and recording |
