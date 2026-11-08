# Tenday 1.0.0 preview

App source: `6856df438139b7c1e9fb2537b101e5bca14a30f2`.
Built locally on 8 November 2026 using Expo 58 / React Native 0.88, TypeScript, Convex 1.49 and JDK 21.

- Android release: minified/resource-shrunk universal APK, arm64-v8a + x86_64, 58.47 MiB, minimum Android 7 (API 24).
- Signing: independent Tenday certificate, SHA-256 `5ca3d45ff55a34448c9e24adcd8ae375793e8f95a828fa94cdf9eae3da89d2fd`.
- Web archive: static root-path export. Serve through HTTPS; deployment under a path requires rebuilding with TENDAY_WEB_BASE_URL.
- Backend: separate Tenday development deployment. Anonymous sessions persist locally; clearing storage loses access and there is no cross-device recovery.
- AI: free-only model IDs configurable on Convex, zero-price routing with no paid fallback.
- Verification: 29 tests, lint, mobile/backend types, release signature, 1,086 uncompressed artifact files checked for the actual authorised secret and assignment-prohibited names.

Live checks covered goals, text and photo analysis, editable review, confirmation, offline pending/reconnect, reports and private source access, and contextual conversation. Only invented health values were used. Native microphone transcription and camera hardware capture need a supported physical device; the minimal emulator supplies neither. The source uses the system viewer/share sheet; this emulator has no PDF viewer. A real keyboard check remains limited by the emulator’s headless input method. See repository verification for exact evidence.

The private HTTPS preview is hosted through Sites, requires owner account access, and does not depend on the original machine staying online. GitHub Pages deployment succeeds but its inherited custom domain fails DNS; no global domain settings were changed. No automatic external submission was sent.
