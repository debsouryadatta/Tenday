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


## Product verification — 8 November 2026

- `pnpm exec vitest run`: 29 passing domain/backend cases. Coverage includes fractional portion totals, impossible dates, qualitative/bounded readings, mismatched units, HTTP MIME/signature/page-count rejection before storage, authenticated HTTP source isolation, per-owner queries/mutations, duplicate confirmation, stale edits, moving an entry between days, source deletion, invalidated guidance, and stale AI-job completion.
- `pnpm exec eslint apps/mobile/src packages/convex/src packages/domain/src`: passed with no warnings.
- Mobile and backend `tsc --noEmit`: passed. Mobile excludes generated native folders and web `dist`; generated minified JavaScript must not be typechecked as source.
- `expo export --platform web`: passed. Android WebView executed onboarding → Today → real text AI draft → portion correction (two toast slices changed to three) → Save; Today showed the corrected 310 kcal total and one meal.
- Live Convex Auth anonymous session, authenticated profile write/read: passed. An analysed draft did not appear as a saved meal.
- Live free-model synthetic JSON, text meal, real meal photo, assistant, PDF report and image report calls: passed. Text and image model IDs are configurable in Convex. Initial synthetic connectivity response reported cost 0. Requests enforce a zero-price provider cap and no paid fallback.
- Synthetic report extraction preserved `92 mg/dL`, `13.8 g/dL`, `<5 mg/L`, `Negative` with a missing unit, exact reference text and source date. The fixture is explicitly labelled as invented, non-clinical data.
- Live report source HTTP: owner 200, unauthenticated 404. Automated tests additionally reject another authenticated identity's reads, edits, deletes and source attachment.
- Signed, minified Android universal release built successfully, 58.47 MiB, including arm64-v8a and x86_64. Independent Tenday signing verified. APK installed and launched on Android 15; native onboarding → Today and capture sheets were visually checked. Final privacy/tab-spacing build also passed; installed as an update with the same signing identity.
- Native gallery → actual food image → private upload → live AI → editable review: passed. Changing quantity from `2` to `0.5` changed the displayed item from 700 to 175 kcal. This also demonstrates that visual estimates need correction; no accuracy claim is made.
- Native offline confirmation: airplane mode on, Wi‑Fi off, Save returned to Today with “An entry is waiting to save” and “It’s kept on this device and will save when connected.” The server total did not pretend the pending entry was saved. After device recovery, reconnect saved exactly one meal and removed the pending banner; Today showed 460 kcal and one meal. Forced-relaunch helper timing failed under load, so a clean kill/reopen check is still pending.
- Speech service unavailable: actual Speak action reported the missing device speech service and offered text/photo fallback. No successful microphone transcript is claimed. This minimal emulator has no camera hardware.
- Native report detail retained source page/lab intervals and cautious interpretation; private source retrieval opened Android’s share sheet with the original PDF. No PDF viewer is installed in the minimal emulator, so inline PDF rendering is not claimed.
- Native PDF picker → private upload → live extraction → review of all four exact values → explicit confirmation → Reports history: passed. The PDF was clearly marked synthetic, and no report appeared as confirmed before Save.
- Camera denial: the real permission dialog was denied; capture stayed open with “Camera access is off. Choose a photo or describe your meal instead.”
- Revised report explanation: live reply preserved all four results, compared only against supplied lab intervals, and said comparison was unavailable for the bounded result without an interval. A narrow server output check rejects the overconfident clinical phrases discovered during testing before saving replies; it is not a claim of medical validation.
- `pnpm verify` passed: setup/privacy checks, lint, mobile/backend TypeScript and 29 tests. GitHub Verify and Publish web preview workflows also passed for commit `6856df4`.
- The earlier temporary HTTPS preview returned HTTP 200. The final unchanged export was published through Sites; its native deployment result confirmed success at the private HTTPS URL. The export is also packaged as `Tenday-web.zip`. GitHub Pages deployed, but redirects to the owner’s existing custom domain, which failed DNS resolution. No DNS/global site settings were changed; the web app refuses public insecure HTTP before authentication.

### Remaining device evidence

Actual microphone transcription and camera hardware capture cannot be tested on this minimal emulator. The headless input method limits real-keyboard evidence. Today was visually checked at accessibility-medium font scaling on the small emulator: text wrapped, the page scrolled, the primary action remained reachable and all three tab labels stayed visible. The setting was restored afterward. A short native walkthrough is exported with cuts and 2× playback, using synthetic data. It shows goal review, live text meal analysis, portion correction, confirmation, updated progress, report history/values and the stored contextual explanation. The report/assistant backend and web daily loop have live evidence above; that does not substitute for these native checks.

The Android media provider first displayed an ANR under compilation load, recovered after dismissing the system alert, and then returned the selected photo. Later, `agent-device open app.tenday.companion --relaunch` reported “process remained running after close”; the instructed `--debug` retry reported “remained foreground after close” (`android-app-close-timeout`, 2 seconds). Device automation stopped at that point as required by tool policy. After the owner asked for direct recovery, the Device tool restored airplane/Wi-Fi settings and foreground open succeeded; an unrelated WebView Shell ANR was dismissed. Checks resumed through the same bound helper, with no adb UI bypass. An install/update restart preserved the session, one confirmed meal and the confirmed report.

The first T3 browser open and its retry failed with the Ubuntu AppArmor restriction; no host security changes were made. CUA browser access was unavailable. Android's WebView shell, controlled through the T3 Device panel, provided the web UI fallback.

Food-photo test credit: [Eggerøre.jpg](https://commons.wikimedia.org/wiki/File:Egger%C3%B8re.jpg), NorwegianMarcus (colour-balance revision by Hohum), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The downloaded image was used for recognition testing, without edits, and is not seeded into normal app data or bundled into the app.


### Activity recreation regression

The crash log identified two real navigation crashes after camera-permission/font configuration changes: Expo Router’s shared imperative router was unbound during Android activity recreation. Calls were migrated to screen-scoped `useRouter()` instances throughout the app. Lint/mobile TypeScript and the signed rebuild passed. Reproducing font-size activity recreation then opening the goal sheet passed without a new crash. A second issue was fixed by using the screen navigator for parameter clearing/back checks: after another recreation, report → Understand → Send completed with the persisted reply, cleared composer and Send button, without a false retry state. Chat now follows newly saved messages and errors stay beside the composer. Earlier “escaped app” helper errors in this sequence were symptoms of this crash, not sufficient evidence of a tool-only issue.
