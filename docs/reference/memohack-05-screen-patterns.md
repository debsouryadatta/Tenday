# Screen patterns

Four skeletons cover almost every screen in the app. Pick one, don't invent a fifth.

---

## A. List screen

The default. Home, subject list, chapter list, sessions, history, leaderboard.

```
SafeArea (white)
 16 ─────────────────────────────────────
 [ AppHeader — back/close, optional action ]   only on pushed screens
 24
 titleScreen                                    "Physics"
 8
 bodyLarge / content.secondary                  "Class 9–12 · 38 chapters"   (optional)
 24
 [ Chip row ]                                   filters, horizontal scroll, optional
 24
 titleSection                                   "Classes"
 16
 [ ListRow ]  ← hairline-separated, inset 56
 [ ListRow ]
 [ ListRow ]
 32
 titleSection                                   next group
 …
 24  (+ tab bar inset)
```

Root tab screens have no `AppHeader`; they start with a small identity row
(avatar left, accent pill + bell right — Wise's "Earn $115" row) then the title.

## B. Form / step screen

Sign in, sign up, OTP, edit profile, create quiz.

```
[ AppHeader — back, optional "Help" accent pill on the right ]
24
titleScreen                     "Create your password"
8
bodyLarge / content.secondary   one or two lines, optional
32
[ Input ]                       label above, hint below
24
[ Input ]
… content ends …
sticky footer:  [ Button primary, full width ]
```

Wise never puts a form inside a card. Fields sit directly on white. The single primary
CTA is pinned at the bottom; when the keyboard is up it rides above it.

## C. Hero screen

Onboarding slides, success states, empty auth states, splash.

```
(optional segmented ProgressBar at the top)
flex spacer
[ Illustration, 200px, centred ]
32
titleScreen — uppercase, bold, centred, max 3 lines
16
bodyLarge / content.secondary — centred, max 3 lines
flex spacer
[ Button primary ]
12
[ Button secondary ]   optional
```

**No dark variant.** Wise's forest-green "ALL DONE!" screen
(`wise-reference/screens/02_26_27-2924.png`) does not carry over: quiz completion and big
successes stay white, with `MemoMark` or an illustration, `SparkBurst` and a lavender
`Card variant="accent"` for the result. Dark fills are for camera, cropper and video only.

## D. Detail screen with a media header

Chapter detail, video player, quiz review.

```
[ AppHeader over white ]
24
titleScreen
8
metadata row: Badge + bodyDefault / content.tertiary
24
[ media card — full width minus gutter, radius.lg, 16:9 ]
24
[ SegmentedControl ]      Videos | Notes
24
[ ListRow ]…
```

---

## The identity row (root tabs)

```
[ Avatar 40 ]                    [ accent pill ] [ icon button ]
```
Accent pill = `interactive.accent` fill, `content.onAccent` label, `radius.pill`,
32 tall — e.g. "🔥 7-day streak". Exactly the shape of Wise's "Earn $115".

## Sticky bottom bar

White, 16 padding, 16 bottom + safe-area inset. Gets `elevation.raised` only while
content is scrolled under it. One primary button; an optional `linkDefault` centred
above it ("Decide later" / "Skip for now") — see
`wise-reference/screens/04_24_27-2922.png`.

## Loading and empty

- Loading: centred `ActivityIndicator` `interactive.primary` on white. No full-screen
  gradient, no spinner inside a card.
- Skeletons: `background.neutral` blocks at the real content's radius, pulsing
  0.5 → 1 opacity over 900ms.
- Empty: the `EmptyState` primitive. Never a bare "No data" string.

## Signed-out states

Use the shared **`components/SignedOutState.tsx`** — never hand-roll one. It is
pattern C: illustration (180) → `titleSubsection` → one line of `bodyLarge` secondary,
vertically centred, with two full-width actions pinned to the bottom:
**"Sign in"** (primary) and **"Create an account"** (secondary).

Two rules that come out of getting this wrong once:

- **No "Continue as guest" action.** Anyone seeing this screen is already browsing as
  a guest, so it is a no-op. That button belongs on the landing screen only.
- **Title reads "Sign in to <do the thing>"**, not a generic "Sign in required" — and
  the illustration matches the tab (`HeroAiTutor`, `HeroQuiz`, `HeroLiveQuiz`,
  `HeroStreak`, `HeroWelcome`).

Do **not** render a translucent glass card over a gradient, and do not use `EmptyState`
for this — `EmptyState` takes one action and is for empty *data*, not for signed-out.

## Motion

Screen transitions stay `animation: 'none'` (existing convention). Within a screen:
press states 120ms, layout/expand 200ms, sheet 320ms. Nothing else animates.
