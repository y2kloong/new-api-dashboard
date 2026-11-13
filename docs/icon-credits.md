# Icon credits

## Extension icon

- Source: [iconfont.cn](https://www.iconfont.cn/) search for `看板`
- Icon id: `3868281`
- Original title: `数据看板`
- Source page: <https://www.iconfont.cn/search/index?searchType=icon&q=%E7%9C%8B%E6%9D%BF>
- Vector path reused in `media/activity.svg`, `media/activity-light.svg` and
  `media/icon.svg`; `media/icon.png` is a 128×128 raster of `media/icon.svg`
  drawn on a green→teal→blue gradient.
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
