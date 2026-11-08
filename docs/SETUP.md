# Tenday setup

The pnpm workspace contains `apps/mobile` (Expo SDK 58 / React Native 0.88), `apps/web` (React 19 / Vite 8 / TypeScript), `packages/convex` (Convex 1.49) and a small shared `packages/domain`. The backend implements email/password authentication and three shared demo identities, owner-scoped records, private source routes, AI jobs, rate limiting and the Convex Agent component. Firebase is unnecessary.

The original machine is already connected to the separate Tenday development deployment `fleet-hedgehog-420`. Its public repository is https://github.com/debsouryadatta/Tenday. The authorised OpenRouter key is configured server-side. Independent Tenday auth and Android signing material live in ignored `.local/`; preserve them. Never use another app’s deployment or signing credentials.

### Fresh development environment

1. Install Node 26, pnpm 12.18.0, and `pnpm install --frozen-lockfile`.
2. Connect **your own separate project** using `pnpm --filter @tenday/convex exec convex dev`. Do not reuse another app's deployment. The original machine already has Tenday connected.
3. Run `node scripts/prepare-local-config.mjs`. It preserves existing private keys, creates missing Tenday auth/signing material under ignored `.local/` with mode 0600, and writes only the public backend addresses to ignored `apps/mobile/.env.local`. JDK 21's `keytool` is needed for release signing. Back up these private signing files securely; do not commit or overwrite them.
4. Apply auth configuration with `pnpm --filter @tenday/convex exec convex env set --from-file ../../.local/tenday-auth.env`. The command refuses conflicting existing values instead of silently rotating keys.
5. Set your authorised OpenRouter credential on the backend using the CLI's private file/stdin input. If root `.env.local` contains only `OPENROUTER_API_KEY`, use `pnpm --filter @tenday/convex exec convex env set --from-file ../../.env.local`. Never display the value or place it in the mobile env. This step is already complete on the original machine.
6. Deploy/typecheck with `pnpm --filter @tenday/convex exec convex dev --once --typecheck enable`, then start the backend watcher and `pnpm --filter @tenday/mobile start` in separate terminals.

`OPENROUTER_TEXT_MODEL` and `OPENROUTER_VISION_MODEL` are configurable backend environment variables. Both currently use `dots-studio/dots-3-note-preview:free`; free-only policy is enforced in server code. See `docs/AI.md` before changing model/provider choices.

### Builds and verification

- `pnpm verify`: tracked-file/privacy checks, lint, all three TypeScript checks and domain/backend tests. Tests run without live inference or cloud secrets.
- `pnpm dev:web`: React Vite dev server on port 5173. `pnpm build:web` typechecks and builds `apps/web/dist`; `pnpm --filter @tenday/web preview` serves the production build on port 4173.
- `pnpm build:android`: regenerates native Android configuration, then builds a minified/resource-shrunk release with two Gradle workers and an independent Tenday signing key. Output is `output/android/Tenday.apk`. Requires JDK 21, the SDK packages selected by Expo 58, and accepted Android SDK licenses. The first native build downloads/compiles toolchains; subsequent builds use caches. No Expo cloud account is required for this local delivery.
- The release script reads private signing properties from `TENDAY_SIGNING_PROPERTIES`, defaulting to `.local/android-signing.properties`. It never prints passwords. `apps/mobile/android` remains generated and ignored; source configuration lives in `app.json` and the local-signing config plugin.
- For deployment under a subpath, set `TENDAY_WEB_BASE_URL=/your-path/` before building. React Router uses the matching basename. Your host must serve `index.html` for client routes; Vercel rewrites are included at `apps/web/vercel.json`.

### Web configuration and delivery

The standalone web app lives under `apps/web`, alongside the Expo Android app. Both `src/constants/index.ts` files contain only the public Tenday Convex cloud/site URLs. Optional overrides are `VITE_CONVEX_URL` / `VITE_CONVEX_SITE_URL` for web and `EXPO_PUBLIC_CONVEX_URL` / `EXPO_PUBLIC_CONVEX_SITE_URL` for mobile. AI and signing secrets stay server-side. `.env.example` documents these public addresses. For a different deployment, override both addresses together.

Both apps show email/password sign-in and sign-up, followed by Maya, Arjun and Leah demo choices. A personal email/password account opens the same records on Android/web. Each demo intentionally shares its synthetic records and edits with all visitors. The server issues demo sessions only for the three canonical identities. Draft text/confirmed pending writes stay in owner-scoped localStorage on web or AsyncStorage on native; selected web files stay in IndexedDB. Signing in restores personal cloud records after clearing browser storage; local unsent drafts are lost when storage is cleared.

Use HTTPS for a deployed app, or localhost for development. Browser camera and speech availability varies; permission is requested only at capture, with file/text/manual fallbacks. AI and private cloud reads require a connection.

GitHub Actions verifies the workspace and builds a portable Vite artifact. It does not publish to Sites or change DNS. The earlier Sites hosting wrapper and archive were removed; the owner is handling deletion of the cloud Site directly. No external submission has been sent.

### Demo seeding and account maintenance

No new credential is needed for basic email/password auth. The existing Tenday JWT/JWKS configuration and Convex Auth remain in use; passwords are Scrypt-hashed by the supported provider. Sign-up validates names, normalizes/validates email and requires 12–128 password characters. No signup or password is logged by app code. Email verification and reset mail are deliberately not configured in this preview; add a dedicated Tenday email service before production, without copying another app's email keys.

The three demos are created on first entry and hold real database records. Re-entry preserves edits/deletions. Each visitor’s valid local day gets a starter meal set once, without overwriting historical changes. Source PDFs are generated asynchronously with prominent fictional-data labels and stored behind the same authenticated source routes. The example conversation is explicitly labelled, never presented as fresh AI output.

For trusted maintenance only, reset a single shared demo to its baseline:

```sh
pnpm --filter @tenday/convex exec convex run demo:reset '{"slug":"maya"}'
```

This is an internal action available to a deployment administrator, not a public client endpoint. It removes that demo's edits/files/conversation and reseeds its canonical identity; all visitors share the reset. Do not use it on personal accounts. The other demo slugs are `arjun` and `leah`.
