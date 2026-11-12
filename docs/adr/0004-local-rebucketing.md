# 0004 — Re-bucket usage locally

Status: accepted

## Context

The analytics page offers hour, day and week granularity. The upstream frontend
sends `default_time` with the usage request and formats chart labels with the
selected granularity. Probing the deployed `v1.0.0-rc.47` server showed that the
same hourly rows come back regardless of `default_time`, so the grouping is a
client-side concern in practice.

## Decision

The extension always treats the rows as raw usage samples and groups them
itself. Buckets are anchored to local time: the start of the hour, local
midnight, or the Monday of the week. Week labels show the Monday-to-Sunday
span. Every bucket in the selected range is generated, including empty ones.

## Consequences

Charts are correct for any server that returns raw or pre-aggregated rows, and
tests can pin the bucketing rules. Week charts no longer risk producing one
label per day. The extension must request a range wide enough to cover the
buckets it draws, which it does by padding the end with one hour and generating
buckets from the floored start.
