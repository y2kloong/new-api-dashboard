# Icon credits

## Extension icon

- Source: [iconfont.cn](https://www.iconfont.cn/) search for `newapi`, second
  result
- Icon id: `45379853`
- Original title: `newapi`
- Source page: <https://www.iconfont.cn/search/index?searchType=icon&q=newapi>
- Vector paths reused in `media/icon.svg` with their uploaded fills: `#5BA8F4`
  left crescent, `#F964C1` right crescent, `#4BB8F3` sparkle. `media/icon.svg`
  places the glyph on a white rounded tile; `media/icon.png` is its 128×128
  raster. `media/activity.svg` reuses the same paths as a monochrome mask for
  the activity bar, which the editor tints with the theme foreground color;
  `media/activity-light.svg` is kept as the light-theme reference artwork.
- Licensing: icons on iconfont.cn are uploaded by individual authors. Before a
  public Marketplace release, confirm the icon's collection licence (and any
  attribution requirement) on its detail page while signed in.

## Pixel skin webfont

- `webview/src/assets/press-start-2p.woff2` — **Press Start 2P** by CodeMan38,
  licensed under the SIL Open Font License 1.1
  (<https://fonts.google.com/specimen/Press+Start+2P>).
- Fetched as the Latin subset from Google Fonts and committed to the repo so the
  webview never makes a network request and the CSP can stay `connect-src
  'none'` / `font-src ${webview.cspSource}`.
- Bundled at build time by `esbuild.mjs` (`loader: { '.woff2': 'file' }`), so it
  ships as a hashed file next to `dist/webview/main.css`.
- Only used for headings and numeric values in the `pixel` theme style; UI copy
  keeps the editor font.

## Original artwork

The earlier hand-drawn activity-bar glyph was replaced by the icon above. The
dashboard itself does not copy any New API (AGPL) artwork; see
`docs/adr/0003-clean-room-mit.md`.
