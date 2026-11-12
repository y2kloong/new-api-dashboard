# Contributing

Thanks for helping. This project is MIT licensed and intentionally small.

## Ground rules

- Do not copy code from New API's web frontend. It is AGPL-3.0 and would change
  this project's licence (see `docs/adr/0003-clean-room-mit.md`).
- Keep the extension read-only. No purchases, no billing-preference writes.
- Never log, postMessage or persist a token anywhere except `SecretStorage`.

## Development

```bash
npm install
npm run watch     # rebuild extension + webview on change
npm test          # pure aggregation tests, no editor required
npm run typecheck
npm run build
npm run package
```

Press `F5` in VS Code to launch an extension development host.

## Releasing

The account and marketplace relationships are explained in
[`docs/ecosystem.md`](docs/ecosystem.md); the step-by-step runbook is
[`docs/publishing.md`](docs/publishing.md). In short: bump the version, update
`CHANGELOG.md`, push a `vX.Y.Z` tag, and let the Release workflow publish the
Marketplace build via OIDC trusted publishing.

## Where things live

- `src/shared/` — pure types, i18n, formatting and time helpers used by host and
  webview. Must not import `vscode` or Node.
- `src/core/` — aggregation, subscription mapping, view-model assembly, tests.
- `src/host/` — API client, profiles, controller, webview plumbing, status bar.
- `webview/src/` — React UI and ECharts options.

## Adding an API endpoint

1. Add the typed method to `src/host/api.ts`.
2. Normalise the response into a view model in `src/core/`.
3. Cover the normalisation with a unit test.
4. Render only the view model in the webview.

## Reporting bugs

Include the New API version, the role of the token (regular/admin), whether data
export is enabled, and the extension log (command: **NewAPI Dashboard: Show Logs**).
Do not include the token itself.
