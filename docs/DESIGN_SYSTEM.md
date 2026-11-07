# Tenday design system

Tenday adapts MemoHack's mobile design patterns with its own calm sage identity. UI quality and low-effort flows come first. The approved Carefold board defines the identity; the concept HTML illustrates direction only.

## Visual foundations

| Role | Initial token | Usage |
| --- | --- | --- |
| Brand forest | `#345B44` | Primary CTA, active control, emblem |
| Forest pressed | `#294A37` | Pressed primary state |
| Sage | `#EAF1E7` | A purposeful assistant highlight |
| Soft lime | `#DCE9A5` | Sparse positive emphasis |
| Screen | `#FFFFFF` | Main screens and sheets |
| Neutral surface | `#F5F6F2` | Supporting blocks |
| Primary content | `#202C26` | Titles, text and icons |
| Secondary content | `#526057` | Supporting copy; verify contrast |
| Hairline | `#E5E9E1` | Quiet separation |

Create semantic colour roles for text on every filled surface and verify contrast, including disabled and pressed states. The initial values are design intent, not a reason to accept an inaccessible pairing. Do not hardcode colours in screen files. Use independent semantic success/warning/error colours; forest is not a universal status colour.

Typography is Inter, loaded once. Start with a 30px/34px semibold screen title, 22–26px section titles, 16px/24px body, 14px/20px supporting copy and 11–12px secondary navigation labels. Respect system text scaling; do not use tiny text to make a layout fit. Financial-style tabular numbers are useful for aligned nutrition values only.

Use a 16px screen gutter and an 8/12/16/24/32 spacing rhythm. Primary buttons are 48px tall pills with one primary action per state. Use a 44px minimum practical touch target. Cards are flat neutral/sage fills or quiet hairlines, usually 16–24px radius. Only sheets, dialogs and a genuinely overlapping footer get restrained elevation.

One large title per screen, left-aligned on white. No heavy card around a form. Short sentence-case copy; supporting text one or two useful lines. No default dark interface, full-page gradients, glass cards, rainbow widgets or oversized decorative metrics.

## Shared primitives

Build `Text`, `Screen`, `Button`, `IconButton`, `Input`, `Card`, `ListRow`, `SectionHeader`, `Chip`, `BottomSheet`, `Banner`, `Toast`, `Skeleton`, `EmptyState`, `ProgressRing` and `BrandMark` only as needed. Screens consume these rather than reproducing them. Centralise colour, typography, space, radius and motion tokens. Keep the reference token snapshot separate from real Tenday tokens.

Use consistent 24px outlined Lucide icons, mostly monochrome. Carefold is the brand mark; do not substitute a stock leaf or medical glyph. Build clean app-icon and splash assets from the approved symbol with generous clear space. The brand icon may be useful as an assistant avatar without turning it into a cartoon character.

## Navigation and minimal taps

- Today is the default destination. Today → Log a meal is one tap.
- The meal sheet offers photo, voice and text immediately. Capture → one editable review → Save. Do not force chat or food-database search first.
- The same review can open from an assistant suggestion. A confirmed record always has an explicit Save action.
- Report upload lives in Reports, not buried in profile/settings. Review values before saving and expose the source report on detail.
- Goal editing lives with goal progress. Profile data/preferences can be a compact sheet instead of a full tab.
- Use native bottom sheets on mobile; use an appropriate bounded dialog on desktop. Keyboard and safe-area handling must remain correct.

## Screen composition

Today: small identity row → title → one helpful next step → compact daily balance → recent meals → prominent capture action. Choose content order based on actual relevance; no placeholders that impersonate personalised advice. Include straightforward history navigation when needed.

Assistant: short contextual opening and useful prompt suggestions, a normal conversation list and a clear composer. Keep typing/loading/retry states honest. Prefer a meal review card or report link over paragraphs of instructions.

Reports: useful empty state with a clear upload action; otherwise a dated report list and marker detail. Clearly separate extracted, confirmed and unavailable values. Compare only matching readings and units.

Onboarding: two or three short steps with one decision at a time; explain the goal and why it helps. Make optional data visibly optional and return the user to a useful Today screen quickly.

## Interaction quality

Ask for camera/microphone/file access only at the related action. Preserve entered data on cancel, rejection, network errors and app resume. Provide upload/processing progress, cancel where feasible, retry without duplication and a manual fallback. Success should update progress immediately with a brief accessible confirmation.

Use roughly 120ms press feedback, 200ms local state transitions and 250–320ms sheets. Respect Reduce Motion. Motion supports state changes; no looping shimmer or animated decoration. Use subtle haptics only where supported and useful.

Verify keyboard navigation on web, screen-reader names, focus restoration after sheets, contrast, text scaling, reduced motion, small Android screens and safe-area insets. Copy must motivate without shame or prescribing health outcomes.
