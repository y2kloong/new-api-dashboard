# NewAPI Dashboard — feature spec

Status: ready-for-human
Feature slug: `new-api-dashboard`
Target: VS Code `^1.85.0`, Cursor-compatible

## Problem

Checking New API model usage and subscription status requires opening a browser,
logging in, and navigating to `/dashboard/models`. Developers who already live
in VS Code / Cursor want the same information without context switching.

## Users

- A regular New API user who wants their own usage, quota and subscription.
- A site administrator who wants site-wide usage plus performance health.

## In scope for 0.2.0

1. Onboarding: add, edit, test, switch and delete server profiles. Editing a
   profile keeps the stored token when the token field is left blank. Tokens
   live in `SecretStorage`.
2. Model call analytics for the active profile:
   - seven stat cards (count, quota, tokens, cache read, cache write, average
     RPM, average TPM);
   - quota distribution as a stacked bar or area chart;
   - model call analytics as trend, share or ranking;
   - filters: 1/7/14/29-day presets, custom range, hour/day/week granularity,
     and a username filter for admins. The filter entry lives in the analytics
     card that wraps the stat cards and charts, so its scope is explicit.
3. Subscription card from `/api/subscription/self`, with plan titles from
   `/api/subscription/plans`. Read-only.
4. Admin behaviour: role >= 10 uses `/api/data`, shows the performance health
   strip and the username filter.
5. Entry points: activity bar view, Explorer side bar view, editor tab, status
   bar summary.
6. Chinese and English, following the editor language.
7. Theme mode: follow the editor, dark or light. High-contrast editor themes
   always keep the accessible high-contrast palette.
8. One configuration page: add / edit / delete profiles plus appearance. No
   duplicate Settings and Add-profile entry points.
9. Snapshot fallback and stale marker when a refresh fails.
10. Glassmorphism presentation with solid / high-contrast fallbacks.
11. Extension and Marketplace icon sourced from iconfont.cn (see
    `docs/icon-credits.md`).

## Out of scope

- Buying plans, changing billing preference, or any write operation.
- Overview, Flow and User analytics sections of the upstream dashboard.
- one-api compatibility guarantees.
- Telemetry of any kind.

## API contract used

| Purpose | Endpoint |
| --- | --- |
| Site capabilities and currency | `GET /api/status` |
| Identity and role | `GET /api/user/self` |
| Usage rows (self) | `GET /api/data/self?start_timestamp&end_timestamp` |
| Usage rows (admin) | `GET /api/data?start_timestamp&end_timestamp&username` |
| Subscriptions | `GET /api/subscription/self` |
| Plan titles | `GET /api/subscription/plans` |
| Performance (admin) | `GET /api/perf-metrics/summary?hours=24` |

Authentication is `Authorization: Bearer <access token>`; admin requests also
send `New-Api-User: <id>` when the id is known.

## Decisions

- ADR-0001 glassmorphism with a self-drawn backdrop.
- ADR-0002 fetch and aggregate in the extension host.
- ADR-0003 clean-room behaviour clone under MIT.
- ADR-0004 re-bucket usage locally to local hour / day / Monday-anchored week.

## Acceptance criteria

- A user can paste a server URL and token, save it, and see their own usage
  without restarting the editor.
- A saved profile can be edited in place; leaving the token blank keeps the
  stored token, and changing the server URL clears that profile's cached rows.
- The seven cards, both chart panels and the subscription card render from a
  single refresh and stay consistent with each other.
- Changing a quick range updates granularity the way the upstream page does
  (1 day → hour, 7/14 → day, 29 → week).
- An admin token shows site-wide data and the performance strip; a regular
  token hides both.
- The filter entry sits inside the analytics card; the subscription card and
  performance strip are visually outside it and are not affected by filters.
- A site without the subscription module renders no subscription area and no
  empty frame.
- A failed refresh preserves the previous snapshot and marks it stale.
- The theme switch changes the dashboard between follow-editor, dark and light
  immediately; a high-contrast editor theme still forces the accessible
  high-contrast palette.
- Settings and Add-profile no longer lead to two duplicate entry points; one
  configuration page handles profiles and appearance.
- The Explorer side bar shows a clickable NewAPI Dashboard overview that can
  open the full dashboard.
- Tokens never appear in the webview HTML, webview messages or logs.
- `npm test`, `npm run typecheck` and `npm run package` succeed.

## Known risks

- Data export disabled on the site yields empty charts; the UI must explain why.
- The site's `default_time` is ignored by the deployed server; bucketing is
  local (ADR-0004).
- Admin endpoints vary across forks; failures are contained per panel.
