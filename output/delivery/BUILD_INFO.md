# Tenday preview delivery

- App/backend source: `4a2c44cb24f6d9371276809ccf45a510fc51186a`. Built on 9 November 2026 (Asia/Kolkata). Later documentation-only commits may follow.
- Android: Expo 58 / React Native 0.88, TypeScript, Convex 1.49, JDK 21. Signed, minified/resource-shrunk universal APK, arm64-v8a + x86_64, 58.49 MiB, minimum Android 7 (API 24).
- Signing: independent Tenday certificate, SHA-256 `5ca3d45ff55a34448c9e24adcd8ae375793e8f95a828fa94cdf9eae3da89d2fd`.
- Web: standalone React 19 + Vite 8 + TypeScript in `apps/web`, alongside Expo `apps/mobile`. The zip contains the production build at its root. Serve via HTTPS, or localhost for development, with an SPA rewrite to `index.html`. `apps/web/vercel.json` supplies the Vercel rewrite. Subpath deployments require a rebuild with `TENDAY_WEB_BASE_URL`.
- Config: public Convex URLs are in each app's `src/constants/index.ts`, with environment overrides. Both use the separate Tenday development deployment; no ChatGPT login or Sites hosting is needed.
- Accounts: custom email/password sign-up and sign-in use Convex Auth Password with Scrypt hashing. The same personal account works across web and Android. Private records/files remain scoped to that account. Existing anonymous records are preserved separately.
- Demos: Maya, Arjun and Leah appear directly below the auth form. Each canonical shared identity starts with 23 fictional meals across eight days, three dated reports with original source PDFs, goal/preferences, a starter suggestion and eight labelled example messages. Visitors can add/edit/delete and chat through real backend flows; changes are visible to everyone entering that demo. Later sign-ins preserve edits/deletions.
- AI: free-only OpenRouter model IDs configurable in Convex, zero-price routing with no paid fallback. Seeded examples are explicitly labelled; new AI requests use the configured model and existing allowance.
- Verification: 40 domain/backend/React lifecycle tests; lint; web/mobile/backend TypeScript; Vite production build; signed Android build/certificate check; tracked-file and APK/web archive secret/prohibited-name scans. Live tests cover real password signup/signin, normalized email, wrong-password rejection, shared demo writes/deletes, private/inter-demo isolation, arbitrary-owner rejection and all nine authenticated source PDFs.
- Native: visually checked both auth tabs and demo entry. Passed profile switching (Maya → Arjun → Leah), sign-out, populated Today/report history, and fresh personal password sign-in on the final APK. Personal records remained separate. The new `00:01:27.46` walkthrough shows auth/demo entry, meals/progress, report comparison, example conversation and profile switching at 2× speed.

Email verification and password-recovery email are not configured in this preview; an email-delivery provider is needed before actual-user rollout. The deliberately public demos must contain sample information only.

The earlier end-to-end feature verification remains documented in `docs/VERIFICATION.md`; it is not a claim that every feature was rerun in this account update. No new browser UI pass was run for this update. Native camera hardware capture and microphone transcription require a supported device; the minimal emulator supplies neither. PDF sources use the system viewer/share sheet; this emulator has no PDF viewer.

The existing release tag is retained; this file identifies the updated artifact source. The owner handles the unwanted cloud Site's deletion. No automatic external submission was sent.
