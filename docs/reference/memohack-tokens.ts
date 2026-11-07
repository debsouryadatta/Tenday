/**
 * MemoHack design tokens.
 *
 * Structure mirrors the Wise design system (see design/01-color.md) 1:1 —
 * Brand / Base / Interactive / Background / Content / Border / Secondary / Sentiment —
 * with the hue rotated from Wise's green to MemoHack indigo.
 *
 * Rules:
 *  - Never hardcode a colour, radius, or font size in a screen. Import from here.
 *  - Surfaces are white-first. Indigo is an accent, not a background wash.
 *  - Depth comes from fills and borders, not shadows.
 */

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

/** Raw indigo ramp. Screens should use the semantic roles below, not these. */
export const indigo = {
  50: '#EEF2FF',
  100: '#E0E7FF',
  200: '#C7D2FE',
  300: '#A5B4FC',
  400: '#818CF8',
  500: '#6366F1',
  600: '#4F46E5',
  700: '#4338CA',
  800: '#3730A3',
  900: '#312E81',
  950: '#1E1B4B',
} as const;

export const colors = {
  /** Brand — the two colours the product is recognised by. */
  brand: {
    /** Light, saturated periwinkle. Wise's Bright Green role: large accent fills. */
    bright: '#A5B4FC',
    /** Near-black indigo. Text on light fills only — it read as black when used as a fill. */
    ink: '#1E1B4B',
  },

  /** Base — absolute light/dark anchors. */
  base: {
    contrast: '#FFFFFF',
    light: '#FFFFFF',
    dark: '#121118',
  },

  /** Interactive — anything the user can press. */
  interactive: {
    /** Solid CTA fill. White label sits on this. */
    primary: '#4F46E5',
    primaryPressed: '#4338CA',
    /** Accent fill. Ink label sits on this (pills, FAB, highlight chips). */
    accent: '#A5B4FC',
    accentPressed: '#818CF8',
    /** Neutral/secondary action. */
    secondary: '#86858F',
    /** Selected state: chips, checkbox fill, radio dot, toggle-on, progress, active tab. */
    control: '#4F46E5',
    /** Disabled fill + label. */
    disabled: '#E9E8EE',
    disabledContent: '#A3A2AC',
  },

  /** Background — surfaces, in stacking order. */
  background: {
    screen: '#FFFFFF',
    elevated: '#FFFFFF',
    /** The workhorse grey used for cards, tiles and inert rows. */
    neutral: '#F2F1F6',
    neutralPressed: '#E9E8EE',
    /** Dark surfaces: camera, cropper and video only. Highlight cards use `accentSubtle`. */
    inverse: '#1E1B4B',
    /** Lavender highlight cards and brand-flavoured blocks. */
    accentSubtle: '#EEF2FF',
    overlay: 'rgba(18, 17, 24, 0.6)',
  },

  /** Content — text and icons. */
  content: {
    primary: '#111018',
    secondary: '#45444D',
    tertiary: '#6A6972',
    link: '#4338CA',
    /** On dark / on accent surfaces. */
    onInverse: '#FFFFFF',
    onInverseSecondary: 'rgba(255, 255, 255, 0.72)',
    onAccent: '#1E1B4B',
    /** Small label above the title on a lavender card. */
    eyebrow: '#4338CA',
    onPrimary: '#FFFFFF',
  },

  /** Border — hairlines and outlines. */
  border: {
    neutral: '#E4E3E9',
    strong: '#111018',
    accent: '#4F46E5',
    inverse: 'rgba(255, 255, 255, 0.18)',
  },

  /**
   * Secondary — decorative fills for illustration tiles, category chips and
   * promo cards. Bright pairs with `content.primary`; dark pairs with white.
   */
  secondary: {
    brightLavender: '#DDD6FE',
    brightSky: '#BAE6FD',
    brightMint: '#BBF7D0',
    brightPeach: '#FED7AA',
    brightRose: '#FBCFE8',
    brightAmber: '#FDE68A',
    darkIndigo: '#1E1B4B',
    darkPlum: '#2E1065',
    darkSlate: '#1E293B',
    darkTeal: '#042F2E',
  },

  /**
   * Per-subject identity. `tile` is the card/glyph background, `accent` the
   * saturated hue for the glyph itself. Keep in sync with design/01-color.md.
   */
  subject: {
    physics: { tile: '#BAE6FD', accent: '#0EA5E9' },
    chemistry: { tile: '#BBF7D0', accent: '#10B981' },
    biology: { tile: '#FED7AA', accent: '#F97316' },
    maths: { tile: '#DDD6FE', accent: '#8B5CF6' },
  },

  /** Sentiment — status only. Never decorative. */
  sentiment: {
    positive: '#166534',
    positiveSubtle: '#DCFCE7',
    warning: '#B45309',
    warningSubtle: '#FEF3C7',
    negative: '#B42318',
    negativeSubtle: '#FEE4E2',
  },
} as const;

// ---------------------------------------------------------------------------
// Typography — Inter, matching the Wise type scale exactly.
// letterSpacing is stored in px (RN unit), converted from Wise's percentages.
// ---------------------------------------------------------------------------

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  /** Once per screen. The big statement heading. */
  titleScreen: {
    fontFamily: fontFamily.semibold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.75,
  },
  /** Divides a screen into sections. */
  titleSection: {
    fontFamily: fontFamily.semibold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.39,
  },
  /** Sections within sections. */
  titleSubsection: {
    fontFamily: fontFamily.semibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.33,
  },
  /** Card and row titles. */
  titleBody: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.18,
  },
  /** Small uppercase-ish group label above a list. */
  titleGroup: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.21,
  },
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.08,
  },
  bodyLargeBold: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.08,
  },
  bodyDefault: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.14,
  },
  bodyDefaultBold: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.175,
  },
  linkLarge: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.16,
    textDecorationLine: 'underline' as const,
  },
  linkDefault: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.175,
    textDecorationLine: 'underline' as const,
  },
} as const;

export type TypographyToken = keyof typeof typography;

// ---------------------------------------------------------------------------
// Space, radius, sizing
// ---------------------------------------------------------------------------

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
} as const;

/** Horizontal gutter every screen uses. Nothing sits closer to the edge. */
export const screenPadding = 16;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  pill: 999,
} as const;

export const size = {
  /** Primary/secondary button height. */
  buttonHeight: 48,
  buttonHeightSmall: 40,
  /** Input field height. */
  inputHeight: 48,
  /** Square icon tile inside list rows and cards. */
  iconTile: 40,
  iconTileLarge: 48,
  avatar: 40,
  avatarLarge: 64,
  /** Minimum tap target. */
  hitSlop: 44,
  /** Content height of the tab bar; the safe-area inset is added on top.
   *  66 is what Wise's icon + 16 gap + label actually needs. */
  tabBarHeight: 66,
} as const;

/**
 * Elevation is deliberately almost unused — Wise separates surfaces with fills
 * and hairlines, not shadows. Reach for `background.neutral` first.
 */
export const elevation = {
  none: {},
  /** Sheets and modals only. */
  overlay: {
    shadowColor: '#111018',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  /** Sticky bottom action bars. */
  raised: {
    shadowColor: '#111018',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const duration = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

export const theme = {
  colors,
  typography,
  fontFamily,
  space,
  screenPadding,
  radius,
  size,
  elevation,
  duration,
  indigo,
} as const;

export default theme;
