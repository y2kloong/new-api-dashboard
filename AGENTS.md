# AGENTS.md

## Release and packaging

- Bump the `version` in `package.json` before every `npm run package`. Never
  rebuild or redistribute an already delivered version with different contents.
- Use semver: patch for fixes, minor for features, major for breaking changes.
  Update `CHANGELOG.md` in the same change.
- Tag the release `vX.Y.Z`; the tag triggers `.github/workflows/release.yml`,
  which tests, packages and attaches the VSIX to the GitHub Release.
- The extension id stays `y2kloong.ly-new-api-dashboard` across renames; keep
  command ids (`lyNewApi.*`), settings keys and the VSIX filename stable unless
  a migration is planned.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
