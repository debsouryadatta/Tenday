# Tenday verification record

## Workspace bootstrap on 8 November 2026

| Check | Result |
| --- | --- |
| pnpm dependency installation | Passed; lockfile created, only required esbuild build script enabled |
| Backend TypeScript | Passed: `pnpm --filter @tenday/convex exec tsc --noEmit --project src/tsconfig.json` |
| Bounded Convex dev deployment | Passed on Tenday `fleet-hedgehog-420`, Convex 1.49.0, typechecking enabled |
| OpenRouter server configuration | Secret-setting command succeeded on Tenday's dev deployment; value was not displayed |
| Setup file and secret checks | Passed: `pnpm verify:setup` |
| Staged whitespace check | Passed: `git diff --cached --check` |
| GitHub visibility and name | Public repository named Tenday under the owner's authenticated account |
| T3 registration and logo | Project metadata confirms Tenday root and Carefold favicon |

The table above records bootstrap only. Subsequent product evidence is recorded below.


## Build verification — 8 November 2026 (in progress)

- `pnpm exec vitest run`: 27 passing domain/backend cases. Coverage includes fractional portion totals, impossible dates, qualitative/bounded readings, mismatched units, HTTP MIME/signature/page-count rejection before storage, authenticated HTTP source isolation, per-owner queries/mutations, duplicate confirmation, stale edits, moving an entry between days, source deletion, invalidated guidance, and stale AI-job completion.
- `pnpm exec eslint apps/mobile/src packages/convex/src packages/domain/src`: passed with no warnings.
- Mobile and backend `tsc --noEmit`: passed. Mobile excludes generated native folders and web `dist`; generated minified JavaScript must not be typechecked as source.
- `expo export --platform web`: passed. Android WebView executed onboarding → Today → real text AI draft → portion correction (two toast slices changed to three) → Save; Today showed the corrected 310 kcal total and one meal.
- Live Convex Auth anonymous session, authenticated profile write/read: passed. An analysed draft did not appear as a saved meal.
- Live free-model synthetic JSON, text meal, real meal photo, assistant, PDF report and image report calls: passed. Text and image model IDs are configurable in Convex. Initial synthetic connectivity response reported cost 0. Requests enforce a zero-price provider cap and no paid fallback.
- Synthetic report extraction preserved `92 mg/dL`, `13.8 g/dL`, `<5 mg/L`, `Negative` with a missing unit, exact reference text and source date. The fixture is explicitly labelled as invented, non-clinical data.
- Live report source HTTP: owner 200, unauthenticated 404. Automated tests additionally reject another authenticated identity's reads, edits, deletes and source attachment.
- Android release: in progress; no APK/size/installation claim yet. Native camera/voice, offline/relaunch, complete native report UI and recording still need checks.

The first T3 browser open and its retry failed with the Ubuntu AppArmor restriction; no host security changes were made. CUA browser access was unavailable. Android's WebView shell, controlled through the T3 Device panel, provided the web UI fallback.

Food-photo test credit: [Eggerøre.jpg](https://commons.wikimedia.org/wiki/File:Egger%C3%B8re.jpg), NorwegianMarcus (colour-balance revision by Hohum), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The downloaded image was used for recognition testing, without edits, and is not seeded into normal app data or bundled into the app.
