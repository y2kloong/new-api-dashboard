# Changelog

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
