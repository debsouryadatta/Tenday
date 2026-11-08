# Tenday design system — Night & Lime

Redesigned on 9 November 2026 at the owner's request. References: Cal AI (effortless logging, one big daily number, macro tiles, an ink + action) and Apple News (eyebrow date lines, heavy editorial titles, a lead card followed by a grouped list). UI quality and minimal taps come first.

The single token source is `apps/mobile/src/theme/tokens.ts`. The web app imports the same file and writes every colour, space and radius value to CSS variables in `apps/web/src/main.tsx`. Don't hardcode colours in screen files.

## Colour

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Ink | `ink` | `#0C0D0C` | Primary buttons, + action, lead cards, user chat bubbles, active states |
| Lime | `lime` | `#D7F35A` | Accent on ink (icons, eyes/spark of the assistant mark, reached ring). Never as text on white |
| Lime soft | `limeSoft` / `limeInk` | `#F0F9CF` / `#3B4A07` | Assistant moments ("For today", banners) |
| Screen / surface | `screen` / `surface` / `surfaceStrong` | `#FFFFFF` / `#F4F4F1` / `#EAEAE5` | White page, flat grey cards, tracks |
| Text | `ink` / `secondary` / `muted` | — / `#5F625E` / `#8B8E8A` | `muted` only for placeholders and non-essential captions |
| Macros | `protein` / `carbs` / `fat` | coral / amber / blue | Always the same colour for the same macro, plus `*Soft` tints |
| Status | `success`, `warning`, `error`, `info` (+ `Surface`) | — | Report ranges and errors. Lime is never a status colour |

## Type (Inter 400–800)

`display` 32/36 heavy (one per screen, left-aligned) · `title` 26 · `section` 20 bold · `heading` 17 semibold · `body` 16/23 · `small` 14 · `caption` 12 medium · `eyebrow` 12 bold uppercase, +0.9 tracking (date lines, card kickers) · `metric` 46 heavy tabular (the daily number) · `metricSm` 20 bold tabular (tiles, kcal).

## Shape, space, motion

20px gutter; 640px max content on mobile layouts. Radii are 12, 16, 22 (cards) and 28 (hero, sheets, lead cards), with pill buttons. Surfaces are flat grey fills with no borders. Only the + button, toasts and sheets get a soft shadow. Buttons: 56px primary, 46px medium, 38px small. Press feedback is a 0.985 scale. Motion is 120/200/300ms, and Reduce Motion is respected.

## Shared primitives (`apps/mobile/src/components/ui.tsx`, mirrored in `apps/web/src/components/ui.tsx`)

`Text`, `Button` (primary/lime/secondary/outline/ghost/danger), `IconButton`, `LinkButton`, `Emblem`/`Brand`, `Avatar`, `Screen` (eyebrow/title/subtitle/footer/floating/tabbed), `Card` (surface/lime/ink/outline), `Group` (rows with hairlines), `Input`/`NumberInput` (filled), `Choice`, `Segmented`, `Chip`, `Banner` (info/lime/warning/error), `Section`, `Row`, `Empty`, `Loading`, `ProgressRing`, `Bar`, `MacroTile`. Screens use these, not ad-hoc styling.

Feature components: `features/meal-row.tsx` (meal card with time-of-day tile and P/C/F dots), `features/meal-review.tsx` (`MealTotal` ink summary and item editor), `features/reading.tsx` (status chips and lab range bar), `features/report-review.tsx`.

## Assistant mark

`components/assistant-mark.tsx` (web: `apps/web/src/components/assistant-mark.tsx`). It's a chat bubble with eyes and a four-point spark, adapted from MemoHack's animated mark and drawn in Night & Lime: ink body, lime eyes, lime spark with an ink halo. States:
- `idle`: random blink, double blink, glance left/right, hop and twinkle every 2.5–6.5s
- `thinking`: eyes up-right, spark spinning, body bobbing; shown while a reply is generating
- `happy`: curved eyes and a hop for about 1.6s after a reply
- `sleep`

The `line` kind is the inactive Assistant tab icon; the active tab shows the full mark. The mobile version uses React Native `Animated` with the native driver; no Reanimated dependency. It stops under Reduce Motion and while the app is in the background. The tab label stays "Assistant", and replies are authored by "Tenday".

## Navigation

- **Mobile:** a bottom tab bar (Today · Assistant · Reports) plus a 50px ink + button on the right that opens the meal sheet from any tab. A full-screen variant (no tab bar, header icons, floating "Log a meal") was built and compared on the device. It crowded the header, covered the meal list and hid Assistant/Reports, so tabs are the default. The variant remains available with `EXPO_PUBLIC_TENDAY_NAV=fullscreen`.
- **Web:** below 1024px the web app is the mobile app: the same header, screens, bottom bar and bottom sheets. At 1024px and up it's a dashboard: a left sidebar (brand, Log a meal, nav, account card), multi-column Today, a centred chat with a context panel, and dialogs instead of sheets.
- **Android:** verified with both gesture navigation and 3-button navigation; tab bar, sticky footers and composer clear the system insets. `predictiveBackGestureEnabled` is `false`, so the system back gesture/button pops the in-app stack instead of leaving the app.

## Screen composition

- **Sign in:** Brand → heavy two-line title → segmented Sign in/Create account → filled fields (password eye inside the field) → primary → "Or try a demo" divider → grouped demo rows with coloured avatars.
- **Today:** header → eyebrow date + greeting → 7-day strip (dots = days with meals; tap → history) → goal hero (big number, "of N", ring that turns lime when reached, "Adjust goal") → three macro tiles → lime "For today" card with the animated mark → "Today's meals" cards.
- **Meal sheet:** ink "Take a photo" card → Library/Speak tiles → "Or type it" → Estimate. Review: name, date/time pill, ink `MealTotal`, item cards with a quantity stepper, notes, Save.
- **Assistant:** mark + title header → remembered preference → ink user bubbles / plain assistant text → thinking row → quick-action chips → pill composer with a round send button.
- **Reports:** eyebrow + title + Add → ink lead card (latest, with counts) → "Earlier" group. Detail: summary tiles → source row → per-value cards with status chip, range bar and earlier values → lime "Keep in mind".

Copy stays short, sentence case, and never shames or diagnoses.
