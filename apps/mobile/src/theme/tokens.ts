/**
 * Tenday design tokens — Night & Lime.
 * The single source of colour, type, spacing, radius and motion for both
 * the Expo app and the Vite web app (exported to CSS variables in web).
 */
export const c = {
  // Surfaces
  screen: '#FFFFFF',
  surface: '#F4F4F1',
  surfaceStrong: '#EAEAE5',
  line: '#ECECE8',
  lineStrong: '#DADAD4',
  overlay: 'rgba(12,13,12,0.48)',

  // Content
  ink: '#0C0D0C',
  inkSoft: '#2B2D2B',
  secondary: '#5F625E',
  muted: '#8B8E8A',
  onInk: '#FFFFFF',
  onInkMuted: '#A9ABA8',

  // Accent
  lime: '#D7F35A',
  limePressed: '#C6E443',
  limeSoft: '#F0F9CF',
  limeInk: '#3B4A07',

  // Nutrition — one stable colour per macro
  energy: '#0C0D0C',
  protein: '#FF6B57',
  proteinSoft: '#FFECE8',
  carbs: '#F5A524',
  carbsSoft: '#FFF3DC',
  fat: '#4C8DFF',
  fatSoft: '#E7F0FF',

  // Status (never reuse the brand accent for meaning)
  success: '#2F7A1F',
  successSurface: '#EAF6E1',
  warning: '#8F5A00',
  warningSurface: '#FFF2D6',
  error: '#C2311E',
  errorSurface: '#FFEDE9',
  info: '#2259C9',
  infoSurface: '#EAF1FF',

  disabled: '#EDEDEA',
  disabledInk: '#9A9C98',
} as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heavy: 'Inter_800ExtraBold',
} as const;

export const type = {
  display: {
    fontFamily: font.heavy,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1.1,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.8,
  },
  section: {
    fontFamily: font.bold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
  },
  heading: {
    fontFamily: font.semibold,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.25,
  },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 23 },
  strong: {
    fontFamily: font.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.15,
  },
  small: { fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
  smallStrong: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: font.medium, fontSize: 12, lineHeight: 16 },
  eyebrow: {
    fontFamily: font.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  label: { fontFamily: font.semibold, fontSize: 11, lineHeight: 14 },
  metric: {
    fontFamily: font.heavy,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -2,
  },
  metricSm: {
    fontFamily: font.bold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.5,
  },
} as const;

export const motion = { press: 120, transition: 200, sheet: 300 } as const;

/** Layout constants shared by both clients. */
export const layout = {
  gutter: 20,
  maxContent: 640,
  tabBar: 64,
  wideBreakpoint: 1024,
} as const;
