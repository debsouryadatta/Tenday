# Principles

These eight rules are what make a screen read as "Wise". Break one and the screen
stops looking like the rest of the app.

## 1. White first. Indigo is an accent, not a background.

Screens are `#FFFFFF`. Depth comes from `background.neutral` (`#F2F1F6`) blocks and
`border.neutral` hairlines. Highlights are the lavender `accent` card (`#EEF2FF`) with
dark text. Dark surfaces are for camera, cropper and video only. Never a gradient wash
behind a whole scrolling page, and never a gradient behind a form.

> Anti-pattern (what the app used to do): every screen wrapped in a 3-stop indigo
> `LinearGradient` with translucent white cards on top.

## 2. One screen, one big title.

Every screen opens with a single `titleScreen` (30px semibold) heading, left-aligned,
sitting directly on the white background — no card, no pill, no eyebrow above it.
Sections below use `titleSection` (26px). Nothing else is that large.

## 3. Content sits on a 16px gutter and breathes.

`screenPadding = 16`. Vertical rhythm is 8 / 12 / 16 / 24 / 32. Titles get 24 above
and 16 below. List rows are 16 apart or separated by a hairline — never both.

## 4. Buttons are pills, full width, pinned to the bottom.

Primary actions live in a fixed bottom bar, full-bleed minus the gutter, `radius.pill`,
48px tall. Only one primary per screen. Secondary is the same pill with a 1px
`border.strong` outline and a transparent fill.

## 5. Flat. Almost no shadows.

Cards are `background.neutral` fills with `radius.lg`, or white with a
`border.neutral` hairline. Shadows appear only on modals/sheets and the sticky bottom
bar. If you're reaching for `shadowOpacity`, use a fill instead.

## 6. Icons are outlined, 24px, monochrome, `content.primary`.

Lucide, `strokeWidth={2}`, no filled shapes, no coloured icons except sentiment states.
Icons in list rows sit in a 40px `background.neutral` circle or square-with-`radius.md`.

## 7. Illustrations are the only colourful thing.

One illustration per screen, max. Centred, ~180–220px, plenty of white around it.
They carry all the colour the screen needs — which is why the rest stays neutral.

## 8. Copy is short, sentence case, and direct.

"Choose your subjects", not "Please Select Your Preferred Subjects". Titles are a
statement or a question. Supporting text is one or two lines of `bodyLarge` in
`content.secondary` directly under the title.

---

## Quick self-check before you call a screen done

- [ ] Background is white (dark only for camera, cropper or video).
- [ ] Exactly one 30px title.
- [ ] 16px gutter everywhere, nothing touching the edge.
- [ ] Primary CTA is a full-width pill at the bottom.
- [ ] No `LinearGradient` unless this is a hero/splash screen.
- [ ] No `shadowOpacity` outside modals and the bottom bar.
- [ ] All colours/sizes come from `theme/tokens.ts`.
- [ ] Compared side by side with the closest screen in `wise-reference/screens/`.
