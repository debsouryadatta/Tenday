# Tenday preview delivery

- Android APK source: `6856df438139b7c1e9fb2537b101e5bca14a30f2`. Built on 8 November 2026 with Expo 58 / React Native 0.88, TypeScript, Convex 1.49 and JDK 21.
- Standalone React + Vite web source: `c74f7f1d4645eb459433cef19d26d88b03d773f7` (`apps/web`). Built on 8 November 2026 with React 19, Vite 8 and TypeScript. The archive replaces the earlier Expo web export.
- Android release: minified/resource-shrunk universal APK, arm64-v8a + x86_64, 58.47 MiB, minimum Android 7 (API 24).
- Signing: independent Tenday certificate, SHA-256 `5ca3d45ff55a34448c9e24adcd8ae375793e8f95a828fa94cdf9eae3da89d2fd`.
- Web archive: root-path Vite build. Serve via HTTPS, or localhost for development. Configure an SPA rewrite to `index.html`; `apps/web/vercel.json` includes it for Vercel. Subpath deployments need a rebuild with `TENDAY_WEB_BASE_URL`. Public Convex URLs are in each app’s `src/constants/index.ts`, with environment overrides.
- Backend: existing separate Tenday development deployment. Both apps use owner-scoped Convex Auth anonymous sessions. Each installation/browser origin has a separate private space; clearing storage loses access. No ChatGPT login or Sites hosting is required.
- AI: free-only model IDs configurable in Convex, zero-price routing with no paid fallback.
- Verification: 31 automated tests, lint, web/mobile/backend TypeScript, Vite production build and public artifact scans. Live Vite checks covered goal setup, real text AI meal review/save, fractional edit/reload, synthetic PDF extraction/review/confirmation/source and grounded contextual chat.

The Android APK and native walkthrough remain unchanged from the earlier delivery. Native camera hardware capture and microphone transcription need a supported device; the minimal emulator supplies neither. PDF sources use the system viewer/share sheet; that emulator has no PDF viewer. Browser checks do not establish successful hardware capture or a full offline crash/relaunch case. See repository verification for exact evidence.

The owner handles deletion of the unwanted cloud Site. Its local wrapper/archive and current delivery links were removed. The web workflow now builds a portable artifact without automatic hosting or account/domain changes. No automatic external submission was sent.
