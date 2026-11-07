# Components

Every primitive lives in `apps/mobile/components/ui/` and is re-exported from
`components/ui/index.ts`. Screens import from `@/components/ui` — never rebuild a
button, card, or row inline.

Reference sheets: `wise-reference/components/14_Buttons_3-1601.png`,
`13_Input Fields_3-2032.png`, `06_Cards_3-3318.png`, `07_Avatar_3-3310.png`,
`08_Toggle_3-3304.png`, `10_Dropdowns_3-2732.png`, `11_Checkbox_3-2564.png`,
`02_Alert_4-3129.png`, `04_Progress_3-3348.png`.

---

## Text

`<Text variant color align numberOfLines>` — the only way text enters the app.

- `variant`: any key of `typography` (default `bodyDefault`).
- `color`: `primary | secondary | tertiary | link | onInverse | onInverseSecondary | onInverseAccent | onAccent | onPrimary | positive | warning | negative` (default `primary`).
  `onInverseAccent` is `brand.bright` — the title colour on a dark hero.

Wraps RN `Text`, applies `fontFamily` + `letterSpacing` + `lineHeight` from the token.

---

## Button

```
height 48 (small 40) · radius pill · full width by default
label bodyLargeBold, centred · icon 20px, 8px gap, leading
```

| Variant | Fill | Label | Border |
|---|---|---|---|
| `primary` | `interactive.primary` | `content.onPrimary` | none |
| `accent` | `interactive.accent` | `content.onAccent` | none |
| `secondary` | transparent | `content.primary` | 1px `border.strong` |
| `tertiary` | `background.neutral` | `content.primary` | none |
| `destructive` | `sentiment.negative` | `#FFFFFF` | none |
| `link` | transparent | `content.link`, underlined | none |

States: pressed → `*Pressed` fill (or 6% ink overlay for outline/ghost).
Disabled → `interactive.disabled` fill, `interactive.disabledContent` label, no border.
Loading → `ActivityIndicator` replaces the label, width unchanged.

`fullWidth` defaults to `true`. Icon-only buttons are 40×40, `radius.pill`,
`background.neutral` fill.

---

## Card

```
radius lg (xl for the one feature card) · padding 16
```

| Variant | Look |
|---|---|
| `neutral` (default) | `background.neutral` fill, no border |
| `outlined` | white fill, 1px `border.neutral` |
| `accent` | `background.accentSubtle` fill: the lavender highlight card (dark text, see `01-color.md`). `spark` adds `SparkCorner` |
| `inverse` | `background.inverse` fill, white content. Camera and video surfaces only |

Pressable cards get `onPress` and dim to `background.neutralPressed`.
No shadow. Ever.

---

## ListRow

The workhorse. Wise uses it for every list
(`wise-reference/screens/` — "Send money abroad", "Australian Dollar", transactions).

```
[ 40px icon tile ]  16  [ title (titleBody)      ]  [ trailing ]
                         [ subtitle (bodyDefault, ]
                         [  content.tertiary)     ]
minHeight 64 · vertical padding 12 · gutter 16
```

- `leading`: `IconTile` (40px, `background.neutral`, `radius.md` or `pill`), `Avatar`,
  or an emoji/flag in a 40px circle.
- `trailing`: `ChevronRight` 20px `content.tertiary`, a value in `bodyLargeBold`, a
  `Toggle`, or a `Checkbox`.
- Separator: 1px `border.neutral`, inset to the start of the title (56px from the
  gutter) — matching Wise's inset dividers.
- Pressed → `background.neutral`.

---

## Input

```
height 48 · radius sm · white fill · 1px border.neutral · padding 12
label   bodyDefault, content.secondary, 8 below
hint    bodyDefault, content.tertiary, 8 above
```

States: focused → 2px `border.strong`. Error → 2px `sentiment.negative` + error text in
`sentiment.negative` with a 16px `AlertCircle`. Disabled → `background.neutral` fill,
`content.tertiary` text.

Wise puts the **label above** the field and a **hint below** — do the same. Never use
placeholder text as the label.

Variants: `text`, `password` (trailing eye toggle), `search` (leading `Search` icon,
`background.neutral` fill, `radius.pill`, no border), `otp` (see below).

**OtpInput** — N separate 48×56 boxes, `radius.sm`, 1px `border.neutral`, filled box
gets 2px `border.strong`, digit in `titleSubsection`.

---

## Chip

```
height 32 · radius pill · padding 12 horizontal · label bodyDefaultBold
```

| State | Fill | Label | Border |
|---|---|---|---|
| default | white | `content.primary` | 1px `border.neutral` |
| selected | `interactive.control` | `#FFFFFF` | none |
| accent | `interactive.accent` | `content.onAccent` | none |

Used for filters ("All / Interest"), subject pickers, difficulty tags.

## Badge

Non-interactive. `height 24 · radius pill · padding 8 · bodyDefaultBold`.
Sentiment variants use the `*Subtle` fill with the solid colour as text.

---

## Avatar

`radius pill`, sizes 32 / 40 / 64. Fallback chain, in order:

1. `uri` → the image.
2. `name` → initials on `background.accentSubtle`, `content.link` text in
   `bodyDefaultBold` (32/40) or `titleSubsection` (64).
3. neither (a guest) → a 16/20/28px `User` glyph in `content.tertiary` on
   `background.neutral`. Never an empty disc — this is Wise's own signed-out
   header avatar (`wise-reference/screens/00_0_27-2925.png`, top left).

---

## Toggle / Checkbox / Radio

- **Toggle**: 44×24 track, `radius.pill`. Off → `background.neutralPressed`.
  On → `interactive.control`. Knob 20px white, 2px inset, 160ms slide.
- **Checkbox**: 24×24, `radius.sm`. Unchecked → white + 1px `border.strong`.
  Checked → `interactive.control` fill + white `Check` 16px.
- **Radio**: 24×24 circle, 2px border; checked adds a 10px `interactive.control` dot.

---

## AppHeader

```
height 56 · gutter 16
[ 40px back/close icon button ]        [ optional trailing action ]
```

- Icon buttons are 40×40, `radius.pill`, `background.neutral`, icon 20px
  `content.primary`.
- **No title in the header.** The title is the `titleScreen` in the body below it —
  that is the Wise pattern.
- On a dark hero, the icon button is `rgba(255,255,255,0.16)` with a white icon.

## Screen

Layout shell: `SafeAreaView` + `background.screen` + `screenPadding`, optional
`scroll`, optional sticky `footer` (the bottom action bar).

```tsx
<Screen scroll footer={<Button>Continue</Button>}>
  <Text variant="titleScreen">…</Text>
</Screen>
```

Footer: 16 padding, white, `elevation.raised` only when content scrolls under it.

---

## SectionHeader

`titleSection` + optional right-hand link (`linkDefault`, `content.link`).
32 above, 16 below.

## EmptyState

Centred: illustration (160px) → 24 → `titleSubsection` → 8 → `bodyLarge`
`content.secondary`, centred, max 2 lines → 24 → optional `Button`.

## Sheet

Bottom sheet: `radius['2xl']` top corners, white, `elevation.overlay`,
scrim `background.overlay`. 40×4 `border.neutral` grabber, 12 from top.
Title `titleSubsection`, 16 gutter, content, then the action bar.

## Alert / Banner

Inline, `radius.lg`, `padding 12`, sentiment `*Subtle` fill, 20px leading icon in the
solid sentiment colour, text `bodyDefault` in the solid sentiment colour.

## ProgressBar

4px track `background.neutralPressed`, `radius.pill`, fill `interactive.control`
(or `interactive.accent` on dark). Onboarding uses a segmented version — one segment
per step, 4px gap.

## TrackTabs

Horizontal scroll of 40px pills, 8 apart, 1px `border.neutral`. A single
`interactive.control` fill slides behind the labels; each label turns white as the fill
covers it. Optional trailing "+ Add" pill (`onAdd`). To bleed to the screen edge, pass a
negative `marginHorizontal` as `style` and matching padding as `contentContainerStyle`.

## Skeleton

Flat `background.neutralPressed` rect that pulses in opacity. No gradient, no shimmer.

## Banner

An inline notice: `Alert` limited to `info` (default), `warning` and `positive`, with an
optional `action` link under the message. `info` is `background.accentSubtle` with
`content.link` text. For errors use `Alert`.

## Toast

`showToast(message)` from `lib/toast.ts`, rendered by one `ToastHost` at the root. A short
confirmation on a `base.dark` pill above the tab bar. No action, no shadow. Anything the
student must act on is a `Banner` or a dialog instead.

## Memo (`components/memo/`)

`MemoMark` is the Memo AI logo, tab icon, answer avatar and loading indicator. Sizes:
20 avatar (`live={false}`), 24 tab (`kind="line"`), 28 chat header, 56+ for empty and
result states. States:

| State | Use | Motion |
|---|---|---|
| `idle` | Default | Still, one small move every 2.5–6.5 s. `line` only blinks, every 9–15 s |
| `thinking` | Send until first words | Spark spins, body bobs, eyes look up |
| `happy` | Correct answer, good score | Curved eyes and one hop |
| `sleep` | Daily limit reached | Closed eyes, dim spark, a `z` floats up |
| `encourage` | Low score. Never mock it | Two slow nods and a soft blink, then a rest |

`SparkBurst` plays once on mount (new `key` to replay), `CountUp` animates a number,
`ProgressRing` animates to a fraction around centred children. All of them respect Reduce
Motion: marks go static, the burst is skipped and calls `onDone`, numbers and rings jump.

## TabBar

4–5 items. White, 1px top `border.neutral`, `size.tabBarHeight` + safe-area inset.
Icon 24px outlined; active → `interactive.control`, inactive → `content.tertiary`. Memo AI
uses `MemoMark kind="line"` tinted with the tab colour.
Icon → label gap is 16 — that gap is why `size.tabBarHeight` is 66, not 60.
Label `bodyDefaultBold` 11px. Active label `interactive.control`.

Wise puts an accent FAB in the centre slot of its 5-item bar. MemoHack has 4 tabs, so
there is no true centre — we deliberately do **not** have a FAB. Screen-level primary
actions live in the sticky footer, or as the accent pill in the identity row.

**No gradient tab bar.**
