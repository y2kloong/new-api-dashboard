# Changelog

## 0.2.0

- Renamed the extension to **NewAPI Dashboard** (display name and all UI
  titles). The package id remains `y2kloong.ly-new-api-dashboard`.
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
