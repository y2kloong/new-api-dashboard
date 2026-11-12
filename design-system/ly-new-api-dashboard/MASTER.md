# NewAPI Dashboard — design system

Source: `ui-ux-pro-max` explicit domain queries (style: glassmorphism, product:
developer tool / IDE, color, typography, UX). The `--design-system` auto-match
was not used because it routed to "Dark Mode OLED + FAQ landing".

## Direction

Developer-tool density, glass surfaces over a self-painted aurora gradient.
Glassmorphism is the visual layer; the information architecture stays a dense
read-only monitoring dashboard.

## Tokens

Dark (default):

- canvas `#0F172A`, deep `#0B1220`
- text `#F8FAFC`, muted `#94A3B8`, faint `rgba(148,163,184,.5)`
- accent `#22C55E`, info `#38BDF8`, violet `#A78BFA`, teal `#2DD4BF`,
  rose `#FB7185`, warning `#F59E0B`, danger `#EF4444`
- glass `rgba(255,255,255,.07)`, strong `.11`, border `rgba(255,255,255,.16)`
- solid fallback `rgba(21,30,49,.96)`
- radius card 14, control 9

Light:

- canvas `#EEF2F7`, deep `#E3E9F2`
- text `#0F172A`, muted `#475569`
- glass `rgba(255,255,255,.55)`, strong `.78`, border `rgba(15,23,42,.10)`
- solid fallback `rgba(255,255,255,.97)`

High contrast: use `--vscode-editor-background`,
`--vscode-editor-foreground`, `--vscode-contrastBorder`; no blur, no shadow.

Typography: UI uses `--vscode-font-family`; every number uses
`--vscode-editor-font-family` with tabular numerals. No bundled webfonts.

Spacing: 4 / 8 / 12 / 16 / 24 / 32. Dashboard density, not marketing spacing.

## Layout

1. Sticky glass top bar: brand, profile switcher, admin chip, updated time,
   refresh, filter, settings.
2. Subscription card, full width, collapsible.
3. Optional performance strip (admin).
4. Seven stat cards: 7 columns → 4 → 2.
5. Charts: 5/7 split above 1100px, stacked below.

## Rules

- `backdrop-filter` only on large containers, never on rows.
- `@supports not (backdrop-filter)` → solid surface.
- Focus ring: 2px `#93C5FD`, 2px offset.
- Reduced motion: disable shine, sweep, spin and pop animations.
- Charts: transparent background, series alpha .78, grid
  `rgba(255,255,255,.08)`, tooltip uses the same glass language.
- Do not rely on colour alone for status: pair with text.
- Body text contrast target 4.5:1 against the effective glass surface.

## Charts

- Stacked bar: 3px top radius, max width 26.
- Stacked area: opacity .26, no symbols.
- Donut: 44–68% radius, 2px surface-coloured border, 6px radius.
- Ranking: horizontal bars, 16px max width, value labels on the right.
