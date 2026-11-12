# 0001 — Glassmorphism with a self-drawn backdrop

Status: accepted

## Context

The requested visual direction is glassmorphism. A VS Code webview cannot blur
the editor content behind it: `backdrop-filter` only sees what the webview
itself paints. Relying on the editor background would also make the look depend
on whichever theme the user installed. The style's own risk notes require a
4.5:1 text contrast check and a fallback when blur is unavailable.

## Decision

The webview paints its own dark (or light) gradient with two low-opacity
radial glows, and glass panels sit on top of it. `backdrop-filter` is used only
on a handful of large containers, never on list rows or table cells. The
dashboard exposes a solid-surface fallback for webviews without
`backdrop-filter` and for high-contrast editor themes, and it disables
entrance motion under `prefers-reduced-motion`.

## Consequences

The extension controls its own contrast and can guarantee the look is
consistent. It cannot claim to blur the editor behind the panel. Users who
prefer a flat, theme-native surface get one automatically in high-contrast
mode; others see the glass treatment.
