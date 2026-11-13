# Changelog

## 0.6.3

- Kept the body gutter instead of removing it. The body now owns the 20px
  horizontal padding (as a `--body-gutter` token), and the Radix scroll-lock
  rule is overridden to keep that padding while a dropdown is open, so opening
  a menu no longer widens the page and the host padding stays in place.

## 0.6.2

- Fixed the page widening when a dropdown opens: Radix's scroll lock
  (`body[data-scroll-locked]`) rewrote the body padding and dropped the
  webview host's 20px gutter. The webview body padding is now pinned to 0 at
  higher specificity and that spacing moved into the app container, so the
  layout stays put on any host.

## 0.6.1

- The header controls stay on one row again: the theme-style and language
  selects size to their own label instead of filling the action row, and the
  action group no longer wraps or squeezes the icon buttons.
- The side bar header actions (theme, settings, refresh) are grouped together
  at the right edge instead of being spread across the whole header.
- The date-time picker has a **现在 / Now** action that sets the field to the
  current moment, for start and end times alike.
- The scrolling app container keeps its scrollbar gutter, so opening a
  dropdown or the calendar no longer shifts or widens the page behind it.

## 0.6.0

- Replaced the native text inputs, dropdowns and `datetime-local` fields with
  shadcn/ui controls: vendored Input and Select primitives (Radix) plus a
  calendar date-time picker (react-day-picker). The controls follow the glass,
  pixel and shadcn skins, and overlays are portalled into the app root so they
  keep the active theme and skin.
- Quick ranges and the default filter window now cover whole local days: the
  start is 00:00 on the first day and the end is 23:59 on the last day, today
  included (1 day = today only, 7 days = six days ago through today).

## 0.5.1

- The side bar subscription summary now shows used quota over total quota
  (`used / total`) instead of remaining over total, matching the progress bar.

## 0.5.0

- The UI language can now be switched from the configuration page
  (**Appearance → Language** / **外观 → 界面语言**) and the side bar settings:
  follow editor, 中文 or English. The picker writes the existing
  `lyNewApi.language` setting, so the setting and the UI stay in sync.
- **shadcn/ui** is now the default theme style. Glass and Pixel Art remain
  available from the style dropdown; installations that already saved a style
  keep their choice.
- Removed secondary copy outside the dashboard metrics: setup subtitles, field
  hints and the configuration note box. The seven stat cards keep their one-line
  descriptions; labels, values, spacing and controls carry the rest of the
  hierarchy.
- Added a **Run Extension** launch configuration so UI work can be verified in
  an extension development host without packaging a VSIX.
- Refreshed the README screenshots with the current layout and the shadcn/ui
  default.

## 0.4.1

- Pointed the access-token hint, the README setup step and the glossary entry at
  New API's current menu path: 安全与访问 → 访问令牌 (Security & Access →
  Access tokens).

## 0.4.0

- Added two more theme **styles** alongside the default *Glass* look:
  *Pixel Art* (8-bit palette, square borders, hard 4px shadows, checkerboard
  mat, CRT scanlines, dashed chart axes, stepped area lines) and *shadcn/ui*
  (flat zinc surfaces, hairline borders, 12px cards, 8px controls, neutral
  primary button, Tailwind-based chart palette). A style only changes the
  visual language — layout, cards, data and controls stay the same — and all
  three work in dark, light and high-contrast editors.
- The dashboard header and the side bar settings now switch the style with a
  **dropdown** instead of an icon toggle, so the skins are listed by name and
  stay reachable by keyboard and screen readers.
- Theme styles are stored with the other dashboard preferences and validated on
  the host, so an unknown value from the webview cannot be persisted.
- Fixed light-theme error and warning banners using dark-only text colours.

## 0.3.0

- Renamed the package and repository to `new-api-dashboard` (the previous
  prefix was dropped). The extension id is now `y2kloong.new-api-dashboard`.
- Because VS Code stores `SecretStorage` and extension state per extension id,
  the 0.2.0 profile and token do not carry over; re-add the server profile once
  and uninstall the old 0.2.0 extension if it is still installed.

## 0.2.0

- Renamed the extension to **NewAPI Dashboard** (display name and all UI
  titles). The package id was left unchanged in this release.
- Added an Explorer side bar view alongside the activity bar view.
- Added a theme switch (follow editor / dark / light) with an appearance
  control in the configuration page; high-contrast themes keep their accessible
  palette.
- Saved profiles can be edited in place; leaving the token blank keeps the
  stored token.
- Moved the filter entry into a "Usage analytics" card that wraps the stat
  cards and both charts, with the active range and granularity shown in the
  card header.
- Added the iconfont-based extension icon and activity bar icons.
- Unified the configuration page (profiles + appearance) and removed the
  duplicate Settings / Add-profile entry points.

## 0.1.0

- Initial release.
- Model call analytics: seven usage cards, quota distribution (bar / area) and
  call trend, share and ranking views.
- Subscription card for `/api/subscription/self`, including expired history.
- Multiple server profiles with `SecretStorage` tokens.
- Admin-aware data source (`/api/data`) and performance health strip.
- Activity bar, full editor tab and status bar entry points.
- Chinese / English UI following the editor language.
- Cached snapshot for stale-data fallback.
