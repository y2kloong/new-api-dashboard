# AGENTS.md

## Interface copy

- Prefer no copy over copy that explains the layout. Remove secondary labels,
  helper text, descriptions and microcopy that repeat what the label, value,
  spacing, grouping or control state already communicates.
- Keep copy only when it carries information or an action the UI cannot express
  by itself: errors, destructive confirmations, empty states, security or
  permission consequences, and instructions needed to complete a task.
- The one-line descriptions under the seven dashboard stat cards are part of
  the metric definition. Keep them.
- Put examples inside the control (placeholder) instead of in a separate hint
  line. Do not describe a value under a label that already names it.
- Before adding a label or hint, first try spacing, alignment, grouping or a
  clearer control state instead.

## Development workflow

- Do not package a VSIX for routine UI verification. Press `F5` with the
  **Run Extension** launch configuration when the change needs the real
  extension host (SecretStorage, commands, status bar, webview messaging). Its
  `watch` pre-launch task rebuilds the extension host and the webview on save;
  reload the dev host window after host changes and reopen the dashboard after
  webview-only changes.
- Package a VSIX only for a release or when acceptance explicitly needs a clean
  install. `npm run package` is not a development loop.

## Release and packaging

- Bump the `version` in `package.json` before every `npm run package`. Never
  rebuild or redistribute an already delivered version with different contents.
- Use semver: patch for fixes, minor for features, major for breaking changes.
  Update `CHANGELOG.md` in the same change.
- Tag the release `vX.Y.Z`; the tag triggers `.github/workflows/release.yml`,
  which tests, packages and attaches the VSIX to the GitHub Release.
- The complete account setup, token scopes and release runbook are in
  `docs/publishing.md`.
- The extension id is `y2kloong.new-api-dashboard`; keep command ids
  (`lyNewApi.*`), settings keys and the VSIX filename stable unless a migration
  is planned.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
