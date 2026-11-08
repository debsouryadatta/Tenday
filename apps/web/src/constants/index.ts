// Public deployment addresses, matching the mobile app's Tenday backend.
// Optional .env.local overrides are for developers; no AI secrets belong here.
export const CONVEX_URL =
  import.meta.env.VITE_CONVEX_URL || 'https://fleet-hedgehog-420.convex.cloud';
export const CONVEX_SITE_URL =
  import.meta.env.VITE_CONVEX_SITE_URL ||
  'https://fleet-hedgehog-420.convex.site';
