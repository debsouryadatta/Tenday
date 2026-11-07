# Tenday context and approved direction

The owner wants an app that combines the useful personal memory and proactive help of Meta's Muse with the quick meal capture of Cal AI. It must feel like a well-designed personal health companion that reduces mental effort, rather than a passive log or a chat screen full of advice.

## Conversation decisions

The owner first asked for full brief review, name options and interactive visual concepts before any setup. Three names and light visual directions were explored: Tenday with calm sage, Nourday with warm apricot, and Kindfuel with clear blue. The owner accepted the direction, then requested researched logo concepts rather than arbitrary symbols.

Five logo concepts were generated: Tender T, Daybreak, Carefold, Small Steps and Companion. The owner selected the named **Carefold** symbol and requested a capital T. An updated **Tenday** board was shown and approved. This is the final selection; other names and logos are historical exploration only.

The owner has now authorised creating the Tenday folder, T3 project/workspace and a GitHub repository named exactly Tenday. The implementation is to move to a fresh top-level T3 thread with the complete context and plan. That thread must ask the essential questions before implementation, then work independently after answers.

The user wants UI and UX as first priority: few taps, coherent flows, good product judgment, useful feedback, polished state handling and no needless decisions. They prefer short high-level questions and updates; keep technical details in repository documents.

## Approved structure and direction

- Three destinations: Today, Assistant and Reports. Prominent Log a meal action on Today, opening a native sheet. Exact navigation arrangement may improve during implementation without another owner decision.
- Today shows meaningful goal progress, recent meals and one next step grounded in actual data. It is the home screen.
- The assistant remembers user-confirmed goals/preferences and uses saved meals/reports with provenance. It can propose a meal log or goal change but must not silently confirm either.
- Small positive wins and gentle continuity are preferred over guilt, punitive streaks or a dense score dashboard.
- No dark default, neobrutalism, full-screen gradients or unnecessary visual noise.

## MemoHack reference

MemoHack is another owner project, not the new app's codebase. Its mobile design system is a Wise-inspired, white-first system with strong headings, Inter, a 16px gutter, pill buttons, flat cards, outlined icons, shared UI primitives, bottom sheets and a central semantic token file. Reuse those patterns while replacing its indigo identity with Tenday's forest/sage identity.

Snapshots of its principles, component guidance, screen patterns and token structure are in `docs/reference/`. They are reference material, not app files. Local access details are in `.local/LOCAL_CONTEXT.md`. Read the source checkout's agent instructions before inspecting it; do not change it, copy its auth keys or use its deployment.

`docs/reference/design-exploration.html` is the earlier interactive concept. It uses illustrative sample data and simulated interactions, predates the final Carefold identity, and is not a runnable implementation or an approved source of clinical values.

## Research sources

Use these as product/design references, not as templates to copy or promises of features Tenday already has.

- [Meta Muse introduction](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/) — goal continuity, personal context and proactive assistance.
- [Cal AI](https://www.calai.app/) — photo/description-based meal capture.
- [MyFitnessPal meal scanning](https://support.myfitnesspal.com/hc/en-us/articles/360045761612-How-to-use-the-Meal-Scanner) — reviewing recognised foods and portions.
- [Headspace identity work](https://davidthsia.com/headspace-brand-1) — simple forms and human warmth.
- [Abridge identity](https://www.pentagram.com/work/abridge), [MacroFactor identity](https://www.pentagram.com/work/macrofactor), [Lenus identity](https://www.pentagram.com/work/lenus) — clarity, coherent systems and a balance of care with precision.

## Technical intent

Expo, React Native, TypeScript, Convex and OpenRouter are the preferred stack. Firebase was mentioned as an available option, not a requirement to add a second database. The latest user instruction explicitly requests Convex; record this as an intentional deviation from the original brief's Node + SQL suggestion rather than reopening the same stack decision.

The OpenRouter API key may be reused from MemoHack with explicit owner permission. The setup copied only that one variable into ignored Tenday local configuration. Model selection, spend limits, transcription and cloud accounts need a brief preflight; never assume every OpenRouter model accepts images, audio and PDFs.
