# StarRunning Review Status - 2026-05-14

## Scope

This review checks the current `main` branch after merging the verified development lines. GitHub remains the formal source of code, and this local directory is only the working copy.

## Completed Functions

- Native WeChat Mini Program project structure is present and importable: `miniprogramRoot` is `miniprogram/`, `cloudfunctionRoot` is `cloudfunctions/`, and AppID/cloud environment are configured for the project owner.
- Main exploration map is implemented with Tencent map rendering, 2D/3D switching, GPS status display, track collection, grid lighting, POI discovery, route/achievement feedback, and local persistence.
- The bottom exploration panel has been extracted to `components/explore-panel`, with recent layout fixes for the top action buttons and GPS chip.
- Session result page exists at `pages/session-result`, and the exploration flow can navigate to the result summary after a session ends.
- History page exists at `pages/history` and reads `track_sessions` through `getUserProgress`.
- POI gallery page exists at `pages/poi-gallery` and combines local POI data with cloud progress/runtime POI text overrides.
- Cloud function `sdkpFunctions` has a single external entry and internal handlers for profile, grid, POI, session, and runtime config.
- Cloud sync covers user summary, grid status, POI records, and track sessions. The prior `_id` write failure path is fixed through centralized document writes.
- Runtime config read path exists through `getRuntimeConfig`, with local fallback and client-side cache.
- Collaboration and troubleshooting documents exist for Git/GitHub/WeChat DevTools/cloud deployment workflows.

## Verified Checks

- `git fetch origin --prune` completed successfully after using a fixed GitHub resolve parameter.
- `git merge --ff-only origin/main` reported `Already up to date`.
- `npm test` passed: spatial tests reported `1254 grids, 3 POIs`.
- `npm run check:js` passed for configured miniprogram, service, page, component, and cloud function files.
- Extra syntax check passed for `miniprogram/app.js`.
- Route integrity check passed: all 4 pages declared in `miniprogram/app.json` have `js/json/wxml/wxss` files.
- `git diff --check` passed.

## Remaining Functions

- Real-device GPS calibration is not complete. Simulator behavior is not enough to validate weak-signal thresholds, continuous location updates, background location, or POI trigger radius.
- The current POI gallery and history pages are read-only. They depend on cloud progress and do not yet provide richer filtering, detail pages, or offline history recovery.
- POI quiz is still not a standalone page. The planned `pages/poi-quiz` flow and backend `submitPoiQuiz` event remain future work.
- Achievement center is not implemented as a standalone page.
- Leaderboard, social comparison, weekly reports, and richer statistics APIs are not implemented.
- Runtime config is still a minimal read path. Full migration of route, achievement, unreachable-area, and rule configuration to cloud-managed collections is not complete.
- Automated tests only cover spatial logic and syntax. There are no automated tests for page data mapping, cloud handler edge cases, or sync failure recovery.

## Improvement Opportunities

- Add `miniprogram/app.js` to `npm run check:js` so the app entry is covered by the default static check.
- Add lightweight Node tests for cloud handlers using mocked database calls, especially duplicate writes, missing fields, and malformed session payloads.
- Add page-model tests for history and POI gallery normalization, because these pages currently rely on cloud payload shape.
- Reduce `pages/index/index.js` further by extracting sync orchestration and achievement/route evaluation into dedicated services.
- Create a manual test checklist for WeChat DevTools and real-device validation before every upload.

## Branch Review

The following branches have been verified as ancestors of `main` and are safe to remove as temporary integration branches:

- `codex/dev-042802-integrated`
- `codex/history-records`
- `codex/poi-gallery`

`origin/dev-042802` is also an ancestor of `main`, but it represents the earlier named development baseline. It can be deleted only if the project owner no longer wants to keep that historical branch.

## Manual Validation Still Required

- In WeChat DevTools, re-import or refresh the project from `main`.
- Recompile and confirm there is no stale component cache error. If a stale component path appears, clear file cache or all cache and rebuild.
- Redeploy `cloudfunctions/sdkpFunctions` after any cloud-function code change.
- In the cloud console, confirm the active environment is `cloudbase-5geu96mj1eb64ee8`.
- On a real phone, run one complete flow: authorize location, start exploration, move enough to light grids, discover at least one POI if possible, end exploration, verify result page, sync, reopen app, and verify progress restoration.
