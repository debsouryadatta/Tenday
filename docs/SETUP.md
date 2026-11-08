# Tenday setup

The pnpm workspace contains `apps/mobile` (Expo SDK 58 / React Native 0.88), `packages/convex` (Convex 1.49) and a small shared `packages/domain`. The backend implements anonymous authentication, owner-scoped records, private source routes, AI jobs, rate limiting and the Convex Agent component. Firebase is unnecessary.

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

- `pnpm verify`: tracked-file/privacy checks, lint, both typechecks and domain/backend tests. Tests run without live inference or cloud secrets.
- `pnpm build:web`: static export under `apps/mobile/dist`, with bounded Metro workers. Use `pnpm --filter @tenday/mobile exec expo serve --port 8083` to serve it locally. Local HTTP cannot provide every camera/microphone browser feature.
- `pnpm build:android`: regenerates native Android configuration, then builds a minified/resource-shrunk release with two Gradle workers and an independent Tenday signing key. Output is `output/android/Tenday.apk`. Requires JDK 21, the SDK packages selected by Expo 58, and accepted Android SDK licenses. The first native build downloads/compiles toolchains; subsequent builds use caches. No Expo cloud account is required for this local delivery.
- The release script reads private signing properties from `TENDAY_SIGNING_PROPERTIES`, defaulting to `.local/android-signing.properties`. It never prints passwords. `apps/mobile/android` remains generated and ignored; source configuration lives in `app.json` and the local-signing config plugin.
- For project-path web hosting set `TENDAY_WEB_BASE_URL=/Tenday` before export. GitHub Actions builds this path and publishes the Pages artifact. A `404.html` SPA fallback supports reloading client routes; unknown static paths may retain GitHub Pages' HTTP 404 while the client routes render normally.

GitHub Actions contains separate verify and web-preview workflows. They use public backend addresses only, never the OpenRouter or signing secrets. The preview uses the existing GitHub Pages account/domain; it does not alter DNS or the owner's other sites.


### Preview hosting

The [private HTTPS preview](https://tenday-preview.debsourya.chatgpt.site) is hosted through Sites with owner-only access and does not depend on this machine staying online. It serves the unchanged root-path Expo export and uses the same private Convex backend. This is a separate frontend origin, so it opens its own anonymous space.

Site ID: `appgprj_6af0093572cc81918d419ab30f6665a1`. The isolated hosting checkout is ignored under `.local/sites-preview`; its repository includes only the audited public static export, a README linking canonical app source, and `.openai/hosting.json`. Update it with the Sites publishing skill, preserving project identity and audience. Source credentials are short-lived and passed through helper stdin only; no token is stored in project files. Do not copy the private root `.local` directory into any archive.

GitHub Pages inherits the account’s existing custom domain and redirects to an unresolved HTTP address. Its workflow/deployment passed, but that address is not usable until domain/DNS settings are separately repaired. Tenday blocks public HTTP before opening authentication. The portable web ZIP can be deployed to any HTTPS static host; project-path hosting requires rebuilding with the base-path variable.
