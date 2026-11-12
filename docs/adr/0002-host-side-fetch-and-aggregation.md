# 0002 — Fetch and aggregate in the extension host

Status: accepted

## Context

The dashboard needs several authenticated requests (`/api/status`,
`/api/user/self`, usage rows, subscriptions, plans, and optionally performance
metrics). Making them from the webview would require CORS cooperation from each
user's New API deployment and would put the access token inside the webview
process. Aggregation (bucketing, totals, top-N series) is also the part most
worth testing.

## Decision

The extension host owns all network calls, token access and aggregation. The
webview receives a ready-to-render view model and only draws charts and cards.
The host and webview share pure types and formatting helpers, but never the
token. Aggregation lives in `src/core` and is covered by unit tests that do not
need `vscode`.

## Consequences

No CORS configuration is required from server operators, and tokens never enter
the webview. Chart options stay presentational. The view model must be
serialisable across the message boundary, so raw quota rows are converted and
localised in the host.
