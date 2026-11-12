# Handoff — NewAPI Dashboard 0.3.0

Status: 0.3.0 packaged and installed, ready for GitHub / Open VSX / Marketplace
publishing. The 0.1.0 acceptance pass and the 0.2.0 UI round are complete.

## TL;DR for the next session

The dashboard and the feedback round are complete and packaged. The remaining
work is: re-check the new UI after reload, GitHub repository creation/push,
optional CI, and Open VSX / Marketplace publishing. Do not re-implement the
dashboard.

## Acceptance-feedback round (2025-11-11)

1. **Explorer entry**: a second webview view `lyNewApi.explorer` now lives in
   the Explorer side bar, using the same compact overview as the activity-bar
   view. `SidebarProvider` takes a view type and the controller tracks visible
   views as a set.
2. **Theme switch**: new `themeMode` preference (`auto` / `dark` / `light`).
   The header and the compact sidebar cycle the mode; the configuration page
   has an explicit three-way appearance control. High-contrast editor themes
   still force the accessible high-contrast palette (ADR-0001).
3. **Icon**: `media/icon.svg` + `media/icon.png` (128×128, package.json
   `icon`) from an iconfont.cn glyph; the activity-bar SVGs reuse the same
   path. Details in `docs/icon-credits.md`.
4. **Editable profiles**: each saved profile has an edit button. The form
   switches to edit mode; leaving the token blank keeps the stored token.
   Host message `updateProfile` re-tests the connection, updates the profile
   and clears the cached snapshot when the server URL changes.
5. **De-duplicated configuration**: the header's separate gear and plus
   buttons are merged into one "Profiles & settings" entry. The setup page is
   now the single configuration page (add / edit / delete + appearance) and
   uses a management title when profiles already exist. The active profile is
   marked with a green "当前使用 / Currently in use" chip and its "Use" button
   is hidden; the view model now keeps the active profile in setup mode so the
   marker can render.
6. **Filter scoping**: the header Filter button moved into a new "用量分析 /
   Usage analytics" glass card that wraps the seven stat cards and both charts.
   The card header shows the active range / granularity / username summary;
   the subscription card and performance strip stay outside, so it is clear
   the filter only affects the analytics block.

## Naming

The display name and every user-facing title are **NewAPI Dashboard** (previous
"Ly New API 看板"). The package name is `new-api-dashboard` and the extension id
is `y2kloong.new-api-dashboard`. Changing the id means `SecretStorage` and
extension state do not carry over from 0.2.0: re-add the server profile/token
once and uninstall the old extension. Command ids (`lyNewApi.*`), settings keys
and webview behaviour are unchanged.

## Test runner note

`vitest 5.1.0` with the default `forks` pool fails in this workspace path with
`TypeError: Cannot read properties of undefined (reading 'config')` before any
test is collected. The same files pass from a copied directory, so it is a
Vitest pool/path bug rather than a test bug. `vitest.config.mts` now sets
`pool: 'vmForks'`; 39 tests pass. Do not remove that line without re-testing.

## Artifacts

- VSIX: `new-api-dashboard-0.3.0.vsix` (repo root, ~323 KB)
- Installed in Cursor as `y2kloong.new-api-dashboard@0.3.0`
- Built bundle: `dist/extension.js`, `dist/webview/main.{js,css}`
- Icons: `media/icon.png` (Marketplace, 128×128), `media/icon.svg`,
  `media/activity{,-light}.svg`

## What is implemented

- 7 usage cards, quota distribution (bar/area), model analytics (trend /
  proportion / ranking), filters (1/7/14/29-day presets, custom range,
  hour/day/week, admin username). The filter entry sits inside the analytics
  card that wraps the stats and charts; the card header shows the active
  range, granularity and optional username.
- Subscription card from `/api/subscription/self`: plan title, status,
  remaining days, end time, next reset, used/total/remaining quota, progress,
  expired collapse. Read-only (no purchase, no billing-preference writes).
- Multiple profiles; tokens in `SecretStorage`; profile switcher; add / edit /
  test / switch / delete (native VS Code confirm dialog).
- Admin role >= 10: `/api/data`, username filter, performance health strip.
- Entry points: activity bar view, Explorer side bar view, editor webview
  panel, status bar.
- zh/en UI following editor language; glassmorphism with light / high-contrast
  fallbacks; explicit dark / light / follow-editor theme mode.
- Local re-bucketing to local hour / day / Monday-anchored week.
- Snapshot fallback with stale marker.

## File map

- `src/shared/` — types, i18n, format, time. No `vscode`/Node imports.
- `src/core/` — `aggregate.ts`, `subscription.ts`, `performance.ts`,
  `viewModel.ts` + tests and fixtures.
- `src/host/` — `api.ts` (+ `api.test.ts`), `profiles.ts`, `controller.ts`,
  `panel.ts`, `sidebar.ts`, `statusBar.ts`, `messages.ts`, `html.ts`.
- `webview/src/` — `App.tsx`, `main.tsx`, `vscodeApi.ts`, `styles.css`,
  `components/*`, `lib/echarts.ts`, `lib/chartOptions.ts`, `lib/theme.ts`.
- `src/extension.ts` — activation, commands, auto-refresh timer.
- `media/icon.png` (128×128 Marketplace icon), `media/icon.svg`,
  `media/activity{,-light}.svg`.
- `docs/adr/0001..0004`, `docs/icon-credits.md`, `GLOSSARY.md`,
  `.scratch/new-api-dashboard/spec.md`,
  `design-system/new-api-dashboard/MASTER.md`.

## Verified

- `npm test`: 39 tests pass (5 files) with `pool: 'vmForks'`.
- `npm run typecheck`: both projects clean.
- `npm run build`: extension and webview build.
- `npm run package`: VSIX builds (13 files, ~322 KB); vsce warns only about the
  835 KB webview JS.
- `cursor --install-extension ... --force`: installed as
  `y2kloong.new-api-dashboard@0.3.0`.
- Live probe against `https://newapi-devops.szlanyou.com` with a regular token
  (role 1): 25 hourly buckets, 7 cards, subscription #233 「基础套餐」
  ¥108.96/¥500, 2989 days remaining, quota data export enabled.
- Browser preview of the real view model: dark, light, setup, sidebar, filter
  modal, pie, ranking; fixed two bugs found this way:
  - `.app` now sets `color: var(--text)` so light theme is readable.
  - esbuild must use `jsx: 'automatic'` / `jsxImportSource: 'react'`.
- Activation smoke test against the built bundle with a `vscode` stub:
  activate + deactivate clean.

## Environment notes

- Cursor CLI install works; the VS Code CLI on this machine is broken
  (`MODULE_NOT_FOUND`), so VS Code must be installed from the UI:
  Extensions → `...` → Install from VSIX.
- Cursor version at handoff: 3.27.14.
- `npm install` blocks two postinstall scripts (esbuild, vsce-sign) by policy,
  but esbuild works and vsce packages successfully.
- `vitest.config.mts` (renamed from `.ts` to avoid the config-loader warning)
  must keep `pool: 'vmForks'`; the default forks pool fails to collect tests
  in this workspace path.

## Release prep (0.3.0)

- Package/repository renamed to `new-api-dashboard`; extension id is now
  `y2kloong.new-api-dashboard`.
- Version bumped to `0.3.0`; packaging always bumps the version (see the rule in
  `AGENTS.md`).
- `CHANGELOG.md` has a 0.3.0 section.
- `.github/workflows/release.yml` runs tests, typechecks, packages the VSIX and
  attaches it to a GitHub Release on a `v*` tag.
- `package-lock.json` was regenerated against `https://registry.npmjs.org` and
  `.npmrc` pins the public registry, so GitHub Actions can install it.
- Local git repository initialized (`main`), first commit `b2735d7`; no remote
  yet because GitHub credentials are not available on this machine.
- Remaining blockers: GitHub repo creation/push, Open VSX token, Marketplace
  publisher account/PAT.

## Open items

1. **Re-verify the feedback round**: `Developer: Reload Window`, then check the
   Explorer side-bar view, the theme cycle, the appearance control, profile
   editing and the single configuration entry. The previous acceptance pass
   covered the dashboard itself.
2. **Not yet tested against a real admin token**: admin data source,
   performance strip and username filter are implemented but the available token
   is role 1. Test with an admin token before claiming it works.
3. **Expired/cancelled subscriptions** are covered by fixtures only; no real
   expired subscription was observed.
4. **GitHub**: local repository initialized on `main`, first commit `b2735d7`.
   No remote yet. Next steps once credentials exist:
   - create `y2kloong/new-api-dashboard`;
   - `git remote add origin ...`, push `main`;
   - `git tag v0.3.0 && git push origin v0.3.0` to let the release workflow
     build and attach the VSIX.
5. **Publishing**:
   - Open VSX: namespace `y2kloong`, then `OVSX_PAT=... npx ovsx publish`.
   - VS Code Marketplace: publisher account and an Azure DevOps PAT are still
     needed; the 128×128 PNG icon now exists (`media/icon.png`, package.json
     `icon`). Confirm the iconfont icon licence while signed in before
     publishing.
   - Provide tokens via environment variables (not committed, not pasted into
     logs).
6. **Optional polish**: reduce the ECharts bundle with code splitting; add a
   link to the site's own dashboard; more languages; admin fixture tests.

## Security / secrets

- The New API access token and GitHub password were shared in the chat. They are
  **not** in the repository (verified by search). The token was passed only via
  an environment variable to a local probe.
- Recommend rotating both. For GitHub push/publish, prefer a fine-grained PAT
  limited to the new repository instead of the account password.
- Never put the token in `settings.json`, source, logs or webview messages.

## Commands

```bash
npm install
npm run typecheck
npm test
npm run watch        # extension + webview rebuild
npm run build
npm run package      # produces the VSIX
cursor --install-extension new-api-dashboard-0.3.0.vsix --force
```

## Design constraints to preserve

- ADR-0001 glassmorphism with a self-drawn backdrop; no claims of blurring the
  editor; high-contrast and no-backdrop-filter fallbacks.
- ADR-0002 host owns fetch + aggregation + tokens; webview renders only.
- ADR-0003 clean-room, MIT; do not copy New API AGPL source.
- ADR-0004 local bucketing; Monday-anchored weeks.
- The extension is read-only by design. Do not add purchase or billing writes
  without an explicit product decision.
