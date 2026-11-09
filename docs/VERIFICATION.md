# Tenday verification record

## v1.0.0 submission release — 9 November 2026

- **Startup white screen (owner report on Poco X3 Pro):** fixed with an ink `expo-splash-screen` showing the lime Carefold emblem (`apps/mobile/src/lib/boot.ts`). It's held until the first real screen commits. The owner confirmed the fix on their phone.
- **Sheets closing on upward scroll (owner report):** react-native-screens 4.30.1 form sheets didn't tell Material `BottomSheetBehavior` which child scrolls, so an upward drag dismissed the sheet instead of scrolling. `patches/react-native-screens@4.30.1.patch` finds the visible nested-scrolling child on layout and re-binds it. `Screen` scroll views set `nestedScrollEnabled`. Built and installed on the Poco. The phone blocks remote taps (`INJECT_EVENTS`), so the scroll-then-dismiss behaviour still needs a manual check.
- **APK size:** the release now ships `arm64-v8a` only, with compressed native libraries (`useLegacyPackaging`). It's 20,198,975 bytes, down from 61 MB with x86_64. SHA-256 `d5cb8c5016563e7f3fdecdc04450466a8ae13390fa7f6db28f714313da5a1599`. Gradle build: 6m 7s. For emulator testing, use a debug build or add `x86_64` back to `buildArchs`. Installing this exact APK on the Poco wasn't possible because the phone had been disconnected from the Mac.
- **Web:** deployed as a static build to Vercel (free Hobby plan) at https://tenday-two.vercel.app, with an SPA rewrite. `/`, `/reports` and `/assistant` all returned HTTP 200 publicly.
- **Checks:** 40 tests, lint, mobile/web typecheck and the Vite production build all pass. The tracked files and the web bundle contain no prohibited names and no keys.

## Physical Poco X3 Pro installation — 9 November 2026

- The owner requested installation on the actual USB phone connected to `mac-pro`, explicitly allowing SSH. USB discovery identified the physical Poco X3 Pro (model M2102J20SI, Android 12, arm64-v8a); no Mac emulator was targeted.
- Installed the current Night & Lime APK from `output/android/Tenday.apk`: 61,008,456 bytes, SHA-256 `d2d5e2b99874360819970d9ebd9d6ac8b1cfc8b52d4ff085220e954ee941a958`. Its source map matches all 33 current mobile/domain source files represented in the bundle, with no differences, at source commit `69df7c0`. The independent Tenday signing certificate was verified. The transferred file's size and checksum matched before installation.
- There was no previous Tenday package on the phone. Installation returned `Success`. A separate `tenday-poco-usb-20261109` agent-device session launched `app.tenday.companion`; its real sign-in/create-account and three demo choices were visible in the native snapshot and screenshot. No phone credentials were collected or personal records opened.
- The Mac T3 device connector returned “This MCP client signed in from outside a thread.” Device work therefore used the owner's explicitly authorised SSH connection and the Mac's installed agent-device CLI.
- Remote interaction failed with `java.lang.SecurityException: Injecting to another application requires INJECT_EVENTS permission`; the debug retry confirmed the same restriction. No security setting was changed. Post-login navigation, physical camera capture and microphone transcription remain unverified on this phone. The app is installed and was left open for the owner to explore manually.
- This is a local physical-device installation. It does not update the older GitHub release assets or their delivery manifest.

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
- Earlier Expo web-export and hosting checks are historical. The owner subsequently requested a separate React + Vite + TypeScript web app and no Sites hosting. The current web build and verification are recorded below.

### Remaining device evidence

Actual microphone transcription and camera hardware capture cannot be tested on this minimal emulator. The headless input method limits real-keyboard evidence. Today was visually checked at accessibility-medium font scaling on the small emulator: text wrapped, the page scrolled, the primary action remained reachable and all three tab labels stayed visible. The setting was restored afterward. A short native walkthrough is exported with cuts and 2× playback, using synthetic data. It shows goal review, live text meal analysis, portion correction, confirmation, updated progress, report history/values and the stored contextual explanation. The report/assistant backend and web daily loop have live evidence above; that does not substitute for these native checks.

The Android media provider first displayed an ANR under compilation load, recovered after dismissing the system alert, and then returned the selected photo. Later, `agent-device open app.tenday.companion --relaunch` reported “process remained running after close”; the instructed `--debug` retry reported “remained foreground after close” (`android-app-close-timeout`, 2 seconds). Device automation stopped at that point as required by tool policy. After the owner asked for direct recovery, the Device tool restored airplane/Wi-Fi settings and foreground open succeeded; an unrelated WebView Shell ANR was dismissed. Checks resumed through the same bound helper, with no adb UI bypass. An install/update restart preserved the session, one confirmed meal and the confirmed report.

The first T3 browser open and its retry failed with the Ubuntu AppArmor restriction; the initial web evidence used Android WebView through the T3 Device panel. Later, the owner explicitly requested the official T3 browser setup. It installed only T3’s scoped Chrome AppArmor profile, preserving the enabled global user-namespace restriction. T3 preview then opened the local Vite app successfully.

Food-photo test credit: [Eggerøre.jpg](https://commons.wikimedia.org/wiki/File:Egger%C3%B8re.jpg), NorwegianMarcus (colour-balance revision by Hohum), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The downloaded image was used for recognition testing, without edits, and is not seeded into normal app data or bundled into the app.


### Activity recreation regression

The crash log identified two real navigation crashes after camera-permission/font configuration changes: Expo Router’s shared imperative router was unbound during Android activity recreation. Calls were migrated to screen-scoped `useRouter()` instances throughout the app. Lint/mobile TypeScript and the signed rebuild passed. Reproducing font-size activity recreation then opening the goal sheet passed without a new crash. A second issue was fixed by using the screen navigator for parameter clearing/back checks: after another recreation, report → Understand → Send completed with the persisted reply, cleared composer and Send button, without a false retry state. Chat now follows newly saved messages and errors stay beside the composer. Earlier “escaped app” helper errors in this sequence were symptoms of this crash, not sufficient evidence of a tool-only issue.

## Standalone Vite web correction — 8 November 2026

- `apps/web` is React + Vite + TypeScript, alongside Expo mobile. Both clients connect to the existing owner-scoped Convex backend using public constants with environment overrides. No Sites SDK, hosting wrapper, cloud credentials or new storage service is required.
- `pnpm verify` passed with web/mobile/backend TypeScript, lint and 31 domain/backend tests. Two added regression cases reject AI-written progress arithmetic/completion claims while allowing qualitative, context-grounded guidance. Older cached tips containing those claims are hidden. The deterministic progress component owns counts/totals.
- T3 browser successfully opened the actual Vite app at localhost:5173 after the owner-authorised official browser setup. Goal onboarding and preference persistence passed.
- Real free-model text capture produced an editable three-item meal draft, separate from saved records. Save updated Today to one meal / 360 kcal. Editing the toast quantity to `0.5` changed the review to 280 kcal; confirmation persisted through a page reload without a duplicate meal.
- PDF upload, live extraction and review preserved all four exact synthetic values (`92 mg/dL`, `13.8 g/dL`, `<5 mg/L`, `Negative` with no unit). No report appeared in history before explicit confirmation. It then appeared with four confirmed values and its source. Bounded/qualitative readings correctly show no numeric comparison.
- Authenticated source download completed (2,126 bytes); its SHA-256 matched the original synthetic PDF exactly. Existing backend isolation tests cover unauthenticated/other-owner access.
- Desktop 1280px and phone 390px layouts were visually checked. Desktop uses a bounded dialog; phone uses a bottom sheet with a visible confirmation footer. The checked phone pages had no horizontal overflow.
- Vite dev-server privacy checks returned HTTP 403 for `.local/source-brief.txt`, root `.env.local` and `.git/config`, without printing file content.
- During development a Vite restart interrupted module loading; reloading restored the same anonymous session/report. A browser before-unload prompt also protected an in-flight confirmation; accepting/reloading recovered the durable queue and saved edit.
- The existing daily guidance allowance was reached during repeated edit checks; Today kept real calculated progress and a clearly generic next-step fallback. No paid fallback or quota increase was enabled.

This browser pass does not claim successful physical camera or microphone capture, or a full browser-offline crash/relaunch test. Native evidence and backend idempotency/isolation checks remain recorded above.

- Report → Understand opened a focused, editable question; the route state was cleared immediately while the report ID stayed in the private local draft. Send returned a real persisted explanation grounded in the supplied values/intervals, cleared the composer and removed report focus. No extra record was created by chat.

- Confirmed the reloaded Today value is exactly 280 kcal with a single meal. An unsent chat draft survived leaving/reopening Assistant, and the completed report focus did not reappear.

- Cleanup through the real UI removed the synthetic meal (Today returned to zero) and the synthetic report/source (Reports returned to its empty state), and cleared the test conversation. A clear-conversation confirmation was moved above the scrolling transcript so it remains visible.

## Email/password accounts and shared demos — 8–9 November 2026

The owner explicitly requested custom sign-in/sign-up plus three shared, editable demo profiles. This supersedes earlier anonymous-only entry. The forms use Convex Auth Password (Scrypt hashing), existing Tenday signing keys and a dedicated `demo` credentials provider. No client-selected owner ID is used for access control, and no shared password is embedded in either app.

- 40 automated domain/backend/client-lifecycle tests passed, plus web/mobile/backend TypeScript and lint. New cases validate all three rich demo datasets, repeated entry, cross-session shared edits/deletes, preserved deletions on re-entry, private/demo and inter-demo ownership isolation, and rejection of noncanonical profiles.
- Live email/password sign-up issued a session with the normalized email and an empty personal profile. A second client signed in using uppercase email and reached the same account. A wrong password was rejected. Test credentials are generated locally, ignored and not displayed.
- Live demo entry created Maya, Arjun and Leah as separate canonical users. Each has 23 meals across eight days (including two today), three dated reports, goal/preferences, a starter suggestion and eight labelled example messages. Re-entering the same demo from another client reaches the same owner. A meal added by one client was read and deleted by the other.
- Supplying a personal user ID alongside a valid demo slug did not override the canonical demo owner. Using that personal ID as the demo slug was rejected. A personal session could not read a demo meal; existing tests also deny demo sessions access to personal records.
- All nine generated fictional report PDFs were attached, opened as valid one-page PDFs through authenticated source routes, and had comparable dated history. Unauthenticated requests and another demo identity received HTTP 404. Sources prominently state that the values/intervals are invented and not clinical references.
- Seeded conversations explicitly say “Demo example”; they are stored through the Agent component. New user questions still call the configured real free model, with the existing budget/validation/provenance policy.

Email verification and password-recovery email are not enabled in this preview; these need an email-delivery service before actual-user rollout. The shared demos are deliberately public to all visitors choosing them. This is disclosed in both clients; personal accounts remain separate. Existing anonymous records were preserved separately.

- A local-day regression test covers visitors in different timezones: each day is seeded once, switching days does not resurrect deleted meals, and far-future device dates are rejected. The canonical demo owner is unchanged.
- The trusted internal demo-reset action was exercised successfully; it clears only the selected demo, preserves its canonical identity and rebuilds its baseline sources/history/examples.

- Native auth form was visually checked on the small Android emulator: sign-in/sign-up tabs, name/email/password inputs, secure password display, demo cards directly below the form, and scrolling all worked. Entering Maya opened the populated Today screen with a visible shared-demo disclosure.
- Native switching exposed a session transition race and root-provider remount caused by navigating home before changing sessions. The native account sheet now starts the transition directly, without that navigation. The shared identity layer now waits for the signed-out React/transport state, then for the newly authenticated owner before reopening records. Five React integration cases cover the delayed cleanup, accepted-token/pending-owner interval, sign-out, failed ordinary sign-in and failed switch handling. The final JS fixes were rebuilt using the unchanged generated native configuration. Native checks passed Maya → Arjun → Leah switching, populated Today screens, and sign-out back to the auth form. A personal email/password session persisted across the APK update and completed goal setup into an empty private Today. A fresh email/password sign-in on the final APK opened that same personal Today; no demo records appeared. The final APK also passed Maya → Arjun switching and sign-out. The refreshed walkthrough covers the new auth/demo entry, meals/progress, report history and profile switching.
