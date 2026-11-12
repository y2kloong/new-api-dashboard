# Glossary

The vocabulary this project uses about New API and the dashboard. Definitions
only; no implementation details.

## Profile

A saved connection to one New API deployment: a display name, the server URL
and the token used to authenticate. One editor can hold several profiles, but
only one is active at a time.

## Access Token

A personal credential created in New API under *Personal settings → Access
tokens*. It identifies the user to the management API. It is not the same thing
as an API key used to call models.

## Quota

The accounting unit New API stores for usage. Quota is converted for display
using the site's own settings (quota per unit, display currency and exchange
rate), so two sites may render the same raw quota differently.

## Plan

A purchasable product definition on a New API site: title, price, duration,
included quota and reset period. A plan is not a subscription.

## Subscription

A user's instance of a plan, with a start, an end, an amount of quota available
for the current cycle and an amount already used. A subscription is *active*
while its status is active and its end time is in the future; otherwise it is
*expired* or *cancelled*.

## Billing Preference

The user's saved order of payment sources for requests (subscription first,
wallet first, subscription only, wallet only). The dashboard displays it but
never changes it.

## Time Granularity

How usage is grouped for charts: by hour, by day or by week. It is a display
choice, not a request to the server.

## Bucket

One time slot on a chart, produced by flooring a timestamp to the start of its
hour, day or week. Every bucket in the selected range is shown, including
buckets with no usage.

## Time Bucket Range

The selected reporting window. Quick presets are rolling windows ending now;
custom ranges use the timestamps the user picked.

## Data Export

The server-side aggregation that New API runs periodically to produce the rows
the dashboard reads. When it is disabled on a site, the analytics section has
no data even though the account is valid.

## Model Call Analytics

The page this project recreates: usage cards, quota distribution, call trend,
call share and call ranking for the selected window.

## Admin

A user whose role is at least 10 on the site. Admins may read site-wide usage
and performance metrics; regular users can only read their own usage.

## Snapshot

The last successful data result kept by the extension so that a failed refresh
can still show something, marked as potentially stale.

## Performance Health

The admin-only strip summarising success rate, latency and throughput over the
last 24 hours.
