# Typography

**Inter.** Same family Wise uses (`wise-reference/styles/08_Typography_4-2911.png`).
Loaded in `app/_layout.tsx` from `@expo-google-fonts/inter`. Four weights only:
Regular 400, Medium 500, SemiBold 600, Bold 700.

Never set `fontWeight` directly — pick the `fontFamily` via a `<Text>` variant.
`fontWeight: '800'` / `'900'` do not exist in this system.

## The scale

Values are Wise's exactly. Letter spacing converted from % to px at the token size.

| Token | Weight | Size | Line height | Tracking | Use |
|---|---|---|---|---|---|
| `titleScreen` | SemiBold | 30 | 34 | −0.75 | The one big screen heading. Once per screen. |
| `titleSection` | SemiBold | 26 | 32 | −0.39 | Divides a screen into sections. |
| `titleSubsection` | SemiBold | 22 | 28 | −0.33 | Sections within sections. |
| `titleBody` | SemiBold | 18 | 24 | −0.18 | Card titles, list-row titles. |
| `titleGroup` | Medium | 14 | 20 | +0.21 | Small label above a group of rows. |
| `bodyLarge` | Regular | 16 | 24 | −0.08 | Paragraphs. Pairs with `titleScreen`/`titleSection`. |
| `bodyLargeBold` | SemiBold | 16 | 24 | +0.08 | Button labels, emphasis inside `bodyLarge`. |
| `bodyDefault` | Regular | 14 | 22 | +0.14 | Secondary/supporting text, row subtitles. |
| `bodyDefaultBold` | SemiBold | 14 | 22 | +0.175 | Small emphasis, chip labels. |
| `linkLarge` | SemiBold underlined | 16 | 24 | +0.16 | Inline link at body-large size. |
| `linkDefault` | SemiBold underlined | 14 | 22 | +0.175 | Inline link at body-default size. |

## Pairing rules

- `titleScreen` + `bodyLarge`. Never `titleScreen` + `bodyDefault`.
- `titleSection` + `bodyLarge`.
- `titleBody` + `bodyDefault` — this is the list-row pair.
- Paragraph spacing is 8px between stacked text blocks.

## Colour pairing

- Titles → `content.primary`.
- Supporting paragraph under a title → `content.secondary`.
- Metadata, timestamps, counts → `content.tertiary`.
- On `background.inverse` → `content.onInverse` / `content.onInverseSecondary`.
- On `interactive.accent` → `content.onAccent`.
- On the lavender `accent` card → eyebrow `content.eyebrow`, title `content.onAccent`,
  body `content.secondary`.

## The display voice

Wise sets marketing/onboarding headlines in ALL CAPS, tight, very bold, centred
(see `wise-reference/screens/` sheet 3 — "IT'S YOUR MONEY. BOOST IT WITH ASSETS").
MemoHack uses the same voice for **onboarding and empty-state hero screens only**:

```
titleScreen, Bold, textTransform: 'uppercase', textAlign: 'center', letterSpacing: -0.5
```

Never in the signed-in app UI.

## Usage

```tsx
import { Text } from '@/components/ui';

<Text variant="titleScreen">Choose your subjects</Text>
<Text variant="bodyLarge" color="secondary">
  Pick what you're preparing for. You can change this later.
</Text>
```
