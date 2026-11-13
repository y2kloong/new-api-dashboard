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

## Skin: glass (`themeStyle: 'glass'`, default)

The tokens in `styles.css` (`.style-glass`) are the frosted baseline described
above. Glass is the only skin that uses `backdrop-filter` and the aurora
gradient.

## Skin: shadcn (`themeStyle: 'shadcn'`)

`webview/src/shadcn.css` maps the app onto a shadcn/ui (zinc) surface language:
flat fills, hairline borders, one soft shadow step, no texture or blur.

Tokens (dark): canvas `#09090B`, card `#0D0D10`, muted `#18181B`, border
`#27272A`, foreground `#FAFAFA`, muted foreground `#A1A1AA`, primary `#FAFAFA`
(foreground `#18181B`), ring `#A1A1AA`.

Tokens (light): canvas/card `#FFFFFF`, muted `#F4F4F5`, border `#E4E4E7`,
foreground `#09090B`, muted foreground `#52525B`, primary `#18181B`
(foreground `#FAFAFA`).

Radii: `--radius-card: 12px` (rounded-xl) and `--radius-control: 8px`
(rounded-md); badges stay fully rounded.

Rules:

- Cards: `1px border`, `0 1px 2px` shadow, no gradient and no inner glow.
- Primary button is the neutral shadcn primary, not the green accent; the accent
  is reserved for status and quota progress so colour keeps its meaning.
- Inputs and selects are transparent with a hairline border; focus is a 2px
  ring at 15–35% opacity of the ring colour.
- Chart type switch behaves like shadcn Tabs: muted track, active tab on the
  canvas colour with a 1px border and `shadow-sm`.
- Charts use the Tailwind palette (400 steps dark, 600 steps light), solid 1px
  axes and a flat tooltip with an 8px radius.
- Icon chips (`stat-icon`, `panel-icon`) sit on the muted surface and keep only
  the tone colour on the glyph.

## Skin: pixel (`themeStyle: 'pixel'`)

`webview/src/pixel.css` is the 8-bit skin layered on the same DOM. It replaces
design tokens only; no component knows which skin is active. Colour mode stays
orthogonal: `.style-pixel` combines with `.theme-dark`, `.theme-light` and
`.theme-high-contrast`.

Tokens (dark):

- ink `#2B2B3C`, shadow `#14141F`, canvas `#232338`, deep `#1C1C2E`
- text `#F7F7E8`, muted `#B9B3D4`
- accent `#7DFF4D`, info `#5CC8FF`, violet `#C77DFF`, teal `#4DE8C2`,
  rose `#FF7D9C`, warning `#FFCF3D`, danger `#FF5454`
- surface `#2F2F4A`, strong `#3A3A5C`, border = ink, shadow `4px 4px 0 ink`
- no radius (`--radius-card: 0`, `--radius-control: 0`), no blur

Tokens (light, handheld-console paper): canvas `#DED8C4`, surface `#F2EEE0`,
strong `#FFFAF0`, ink `#2A2A3D`, accent `#167D3A`.

Rules:

- Every surface is a flat fill with a 2px hard border and a 4px hard offset
  shadow; pressed controls translate by the shadow offset instead of easing.
- Background is a 16px checkerboard grid, plus a passive CRT scanline overlay
  (1px line every 3px, `pointer-events: none`, z-index below modals).
- Headings and every number use Press Start 2P (bundled OFL woff2, loaded once
  by `esbuild` `--loader:.woff2=file`). Body copy, chips, buttons and all chart
  text stay in the editor UI font: the pixel face has no CJK glyphs and is much
  wider, so using it below 11px or inside ECharts collides labels.
- Charts keep the same scales but switch to square bars/swatches, dashed 2px
  axes, stepped area lines and no animation.
- High contrast: inherit `--vscode-*`, drop the shadow and the scanlines.
- `prefers-reduced-motion` from `styles.css` still wins; the skin adds no
  motion beyond one 2-step pop and one stepped shimmer.
