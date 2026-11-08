// Public addresses only. AI and authentication signing keys stay on Convex.
export const CONVEX_URL =
  process.env.EXPO_PUBLIC_CONVEX_URL ||
  'https://fleet-hedgehog-420.convex.cloud';
export const CONVEX_SITE_URL =
  process.env.EXPO_PUBLIC_CONVEX_SITE_URL ||
  'https://fleet-hedgehog-420.convex.site';
/** Navigation layout: a bottom tab bar, or full-screen pages with a floating log action. */
export const NAV_MODE: 'tabs' | 'fullscreen' =
  process.env.EXPO_PUBLIC_TENDAY_NAV === 'fullscreen' ? 'fullscreen' : 'tabs';
