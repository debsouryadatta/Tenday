export const c = {
  screen: '#FFFFFF',
  surface: '#F5F6F2',
  sage: '#EAF1E7',
  lime: '#DCE9A5',
  forest: '#345B44',
  pressed: '#294A37',
  ink: '#202C26',
  secondary: '#526057',
  muted: '#657169',
  controlBorder: '#8B978D',
  line: '#E5E9E1',
  overlay: 'rgba(25,40,30,0.42)',
  error: '#A52C25',
  errorSurface: '#FFF0ED',
  warning: '#815B19',
  warningSurface: '#FFF4DB',
  success: '#286341',
  successSurface: '#E9F4EB',
  disabled: '#E5E9E1',
} as const;
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
export const type = {
  title: {
    fontFamily: font.semibold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  section: {
    fontFamily: font.semibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: font.semibold,
    fontSize: 18,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  strong: { fontFamily: font.semibold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: font.regular, fontSize: 14, lineHeight: 21 },
  label: {
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  metric: {
    fontFamily: font.semibold,
    fontSize: 38,
    lineHeight: 45,
    letterSpacing: -1.2,
  },
} as const;
export const motion = { press: 120, transition: 200, sheet: 300 } as const;
