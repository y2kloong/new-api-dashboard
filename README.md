# NewAPI Dashboard

在 VS Code / Cursor 里直接查看 New API 的模型调用用量与订阅状态，不必再开浏览器。

> **非官方社区扩展。** 与 New API / QuantumNous 无从属关系，未获其背书。

## 功能

- **7 张用量指标卡**：总调用数、总额度、总 Token、缓存读、缓存写、平均 RPM、平均 TPM
- **额度分布**：按时间桶 × 模型堆叠，柱状图 / 面积图切换
- **模型调用分析**：调用趋势、调用占比、调用数排名三种视图
- **我的订阅**：套餐名、状态、剩余天数、到期时间、下一次重置、额度已用 / 总额 / 剩余与进度条；已过期订阅折叠
- **多站点配置**：公司与自建站点各自保存配置，令牌存 `SecretStorage`；已保存的配置可直接编辑（令牌留空表示沿用原值）
- **管理员自动识别**：令牌角色 ≥ 管理员时改用全站数据，并显示性能健康条与用户名筛选
- **四个入口**：活动栏图标、资源管理器侧边栏概览、编辑器标签页全宽看板、状态栏摘要（点击打开看板）
- **主题切换**：跟随编辑器 / 深色 / 浅色三种模式，高对比主题始终保留无障碍配色
- **统一的配置页**：新增、编辑、删除站点与外观设置集中在同一处，不再有重复入口
- **中英双语**：跟随编辑器语言，可手动覆盖
- **离线兜底**：保留最近一次成功快照，接口抖动时不清空画面

## 安装

扩展以 `.vsix` 分发，VS Code 与 Cursor 均支持：

```bash
code --install-extension ly-new-api-dashboard-0.2.0.vsix
```

Cursor 可以用命令面板的 **Extensions: Install from VSIX…**，或：

```bash
cursor --install-extension ly-new-api-dashboard-0.2.0.vsix
```

也可以直接在扩展视图右上角 `...` → **Install from VSIX…** 选择文件。

## 首次使用

1. 在 New API 站点生成访问令牌：**个人设置 → 访问令牌**。
2. 打开命令面板，执行 **NewAPI Dashboard: Open Dashboard**（或点击活动栏图标）。
3. 填写服务器地址（例如 `https://newapi.example.com`）与令牌，点击 **保存并连接**。

> 看板读取的是服务端「数据导出」。若图表为空，请管理员在 **系统设置 → 数据看板** 中开启数据导出。

## 兼容性

- 面向 **New API**（`v0.9+` / `v1.x`）；one-api 及其它二开站点路由可能不同，不做承诺。
- 普通用户只能看到自己令牌对应的数据，这是服务端强制的。
- 管理员（`role >= 10`）默认查看全站数据，并可显示性能健康条。
- 订阅区依赖 `/api/subscription/*`；站点无该模块时整块自动隐藏。

## 命令

| 命令 | 说明 |
| --- | --- |
| `NewAPI Dashboard: Open Dashboard` | 打开 / 聚焦看板 |
| `NewAPI Dashboard: Refresh Data` | 立即刷新 |
| `NewAPI Dashboard: Manage Server Profiles` | 管理服务器配置 |
| `NewAPI Dashboard: Show Logs` | 查看扩展日志 |

## 设置

| 设置项 | 默认 | 说明 |
| --- | --- | --- |
| `lyNewApi.autoRefreshMinutes` | `5` | 看板可见时的自动刷新间隔，`0` 关闭 |
| `lyNewApi.statusBar.enabled` | `true` | 是否显示状态栏摘要 |
| `lyNewApi.language` | `auto` | `auto` / `zh` / `en` |

## 隐私与安全

- **零遥测**，不收集任何使用数据。
- 请求只发往你自己填写的服务器地址；Webview 的 CSP 禁止任何外连。
- 令牌仅保存在 VS Code `SecretStorage` 中，不写入 `settings.json`，也不会发送给 Webview 或写进日志。
- 不修改任何账单、订阅或计费偏好；本项目是只读看板。

## 开发

```bash
npm install
npm run watch      # 同时构建扩展宿主与 Webview
npm test           # 聚合 / 货币 / 时间 / 订阅单元测试
npm run typecheck
npm run build
npm run package    # 产出 .vsix
```

在 VS Code 中按 `F5` 启动扩展开发宿主。

## 许可证

MIT。见 [LICENSE](./LICENSE)。

---

# NewAPI Dashboard (English)

An unofficial VS Code / Cursor extension that renders the New API model-call
analytics dashboard and your subscription status without opening a browser.

**Not affiliated with New API or QuantumNous.**

## Highlights

- Seven usage cards, quota distribution (stacked bar / area), and model call
  analytics (trend, share, ranking).
- Subscription card with plan, status, remaining days, expiry, next reset and
  quota progress. Expired subscriptions are collapsed.
- Multiple server profiles; tokens are stored in `SecretStorage`; saved
  profiles can be edited (leave the token blank to keep the current one).
- Admin tokens (`role >= 10`) automatically switch to site-wide data, the
  performance health strip and the username filter.
- Entry points: activity bar, Explorer side bar overview, full-width editor
  tab, and a status bar summary.
- Theme switch: follow the editor, dark or light. High-contrast editor themes
  keep their accessible palette.
- One configuration page for adding, editing and deleting profiles plus
  appearance, with no duplicate entry points.
- English / Chinese, following the editor language.
- Last successful snapshot is kept, so transient API failures do not blank the
  dashboard.

## Install

```bash
code --install-extension ly-new-api-dashboard-0.2.0.vsix
```

Or use **Extensions: Install from VSIX…** in VS Code or Cursor.

## Setup

1. Create an access token in New API: **Personal settings → Access tokens**.
2. Run **NewAPI Dashboard: Open Dashboard**.
3. Enter the server URL and the token, then **Save and connect**.

The dashboard reads the server-side data export. If charts stay empty, ask an
administrator to enable data export under **System settings → Dashboard**.

## Compatibility

Built for New API `v0.9+` / `v1.x`. one-api and other forks may expose different
routes. Non-admin tokens can only see their own data.

## Privacy

No telemetry. Requests go only to the server you configure. Tokens live in
`SecretStorage` and never reach the webview. The extension is read-only: it
never changes billing, subscriptions or payment preferences.

## Development

```bash
npm install
npm run watch
npm test
npm run typecheck
npm run build
npm run package
```

## License

MIT. See [LICENSE](./LICENSE).
