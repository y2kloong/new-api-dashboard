# 0003 — Clean-room behaviour clone under MIT

Status: accepted

## Context

New API's web frontend is AGPL-3.0. Copying its chart and aggregation code into
this extension would force the extension to be AGPL as well, which conflicts
with the goal of a permissively licensed community tool that anyone can embed
or redistribute.

## Decision

This project reimplements the *observable behaviour* of the model analytics
page from the HTTP contracts and rendered output. It does not copy source code
from New API. The extension is MIT licensed. The names of the underlying New
API project are used descriptively only, and the README states that this is an
unofficial extension.

## Consequences

Some visual details may differ from the site. Every deviation that matters
(for example week buckets anchored to Monday rather than to the row's own date)
is recorded as an ADR. If a future contributor prefers to port upstream code,
the licence must be revisited first.
