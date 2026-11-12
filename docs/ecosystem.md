# Eclipse、Open VSX、Marketplace 与 GitHub 的关系

本文解释发布一个 VS Code / Cursor 扩展时，**Eclipse Foundation、Open VSX、
VS Code Marketplace publisher、GitHub** 分别扮演什么角色、为什么需要互相关联，
以及一次发布在它们之间如何流转。

操作步骤见 [`publishing.md`](./publishing.md)；本文只讲概念和关系。

---

## 一句话总结

**VSIX 是制品，GitHub 是源码和构建，Marketplace / Open VSX 是两个独立的分发市场，
Eclipse / Microsoft 分别是这两个市场的发布者身份提供方。**

发布一个扩展需要这些关联，是因为：

1. 市场要知道“谁有权用这个 publisher 名字发布”；
2. 构建要有一个可信的代码来源和 CI；
3. 两个市场的账号体系不同，但同一个 VSIX 要使用同一个 `publisher` 标识；
4. 现代发布方式希望避免长期保存的密码/PAT，所以用 GitHub OIDC 做短期身份交换。

---

## 1. 四个角色

| 角色 | 是什么 | 在发布中的职责 | 本项目对应 |
| --- | --- | --- | --- |
| **VS Code Marketplace** | Microsoft 运营的官方扩展市场，VS Code 默认从这里搜索/安装扩展 | 托管扩展页面、版本、安装包、评分；校验 publisher 身份 | `y2kloong.new-api-dashboard` |
| **Open VSX** | Eclipse Foundation 管理的厂商中立、开源扩展注册表，供 VS Code 兼容编辑器使用 | 托管同样的 VSIX，维护 namespace 和版本；要求发布者签署 Publisher Agreement | `y2kloong.new-api-dashboard` |
| **Eclipse Foundation** | Open VSX 的法律/治理主体 | 提供 Eclipse 账号、Publisher Agreement、Open VSX namespace 的所有权 | 你的 Eclipse 账号 |
| **GitHub** | 源码托管 + CI（Actions）+ Release 制品 | 保存源码、运行测试/打包、通过 OIDC 向 Marketplace 证明“这次构建来自这个仓库和工作流” | `y2kloong/new-api-dashboard` |

注意：

- **GitHub 不是扩展市场**。它不决定谁能发布，只提供源码、CI 和身份声明。
- **Eclipse 不参与 Marketplace 发布**。它只为 Open VSX 提供治理和发布者协议。
- **Microsoft 不参与 Open VSX 发布**。Marketplace publisher 是 Microsoft 账号体系。
- **Azure DevOps 不是必须的**。它只是 Marketplace 历史上的 PAT 来源；现在可以用
  GitHub OIDC 替代，不需要 Azure 订阅。

---

## 2. 为什么一个插件需要这些关联

### 2.1 制品、渠道、身份、构建是四件不同的事

```text
源码/构建 (GitHub)
      │
      ▼
   VSIX 制品
   │        │
   ▼        ▼
Marketplace  Open VSX
   ▲            ▲
   │            │
Microsoft 账号  Eclipse 账号
(publisher)    (namespace + agreement)
```

- **VSIX** 只是一个 zip：`package.json`、代码、图标、README。
- **市场** 决定用户从哪里搜索、下载、自动更新。
- **发布者身份** 决定谁有权上传新版本、删除版本、修改页面。
- **构建来源** 决定这个 VSIX 是不是从可信代码构建出来的。

这四件事可以分开，但发布时会被绑定在一起。

### 2.2 `package.json` 里的 `publisher` 是绑定键

```json
{
  "name": "new-api-dashboard",
  "publisher": "y2kloong",
  "version": "0.3.0"
}
```

扩展 ID 是：

```text
<publisher>.<name>  →  y2kloong.new-api-dashboard
```

这个 ID 同时出现在两个市场。两边都要求：

- Marketplace：`y2kloong` 必须是当前 Microsoft 账号拥有的 publisher；
- Open VSX：`y2kloong` 必须是当前 Eclipse 账号拥有的 namespace。

所以同一个字符串 `y2kloong` 必须在两个完全独立的账号体系里都被你控制。

### 2.3 同一份 VSIX 可以发两个市场，但版本历史是独立的

- 两个市场各自保存 VSIX、版本号、下载统计和页面。
- 发到 Marketplace 不会自动出现在 Open VSX，反之亦然。
- 版本可以短暂不一致，但最好在同一次发布中一起更新。
- 如果只改 `displayName`，扩展 ID 不变；如果改 `publisher` 或 `name`，
  扩展 ID 变化，用户不会自动升级，配置也不会继承。

---

## 3. 身份关系图

```text
                    package.json
              publisher = "y2kloong"
              name      = "new-api-dashboard"
                        │
        ┌───────────────┴────────────────┐
        ▼                                ▼
VS Code Marketplace                 Open VSX
publisher: y2kloong                 namespace: y2kloong
owner: Microsoft 账号               owner: Eclipse 账号
        ▲                                ▲
        │ Trusted Publishing             │ Publisher Agreement
        │ (GitHub OIDC)                  │ + linked GitHub login
        │                                │
GitHub repo: y2kloong/new-api-dashboard  │
workflow: .github/workflows/release.yml  │
        │                                │
        └──────── GitHub 账号 ───────────┘
             （源码、CI、OIDC 身份）
```

关键点：

- **Marketplace** 认的是 Microsoft 账号 + publisher。
- **Open VSX** 认的是 Eclipse 账号 + namespace + Publisher Agreement。
- **GitHub** 是两边都可能用到的“开发者身份/构建来源”：
  - Marketplace 用它做 OIDC trusted publishing；
  - Open VSX 用它做登录和 Eclipse 账号绑定（但法律发布者仍是 Eclipse 账号）。

---

## 4. 发布流转

### 4.1 首次注册（一次性）

```text
Microsoft 账号
   └─ 创建 Marketplace publisher: y2kloong
   └─ 创建 Trusted Publishing policy:
        repo owner = y2kloong
        repo       = new-api-dashboard
        workflow   = release.yml
        provider   = GitHub Actions

Eclipse 账号
   └─ 注册 / 验证邮箱
   └─ 绑定 GitHub 账号
   └─ 在 open-vsx.org 用 Eclipse 登录
   └─ 签署 Open VSX Publisher Agreement
   └─ 创建 namespace: y2kloong
   └─ 生成 Open VSX access token

GitHub 账号
   └─ 创建仓库 y2kloong/new-api-dashboard
   └─ 创建 fine-grained PAT:
        Contents: Read and write
        Workflows: Read and write
```

四者不是“互相注册”，而是**各自在自己的体系里为同一个 publisher 名字建立所有权**。

### 4.2 每次发布

```text
本地
 ├─ 升 version + 更新 CHANGELOG
 ├─ npm test / typecheck / package
 └─ 得到 new-api-dashboard-X.Y.Z.vsix
        │
        ├─ npx ovsx publish ... -p $OVSX_PAT
        │        └──────────────► Open VSX（Eclipse namespace）
        │
        └─ git push main && git push tag vX.Y.Z
                 │
                 ▼
        GitHub Actions (release.yml)
                 │
                 ├─ npm ci / test / typecheck / package
                 ├─ 申请 GitHub OIDC token（id-token: write）
                 ├─ npx @vscode/vsce publish --oidc
                 │        └──────────► Marketplace（Microsoft publisher）
                 ├─ 可选：ovsx publish（OVSX_PAT secret）
                 │        └──────────► Open VSX
                 └─ 上传 VSIX ────────► GitHub Release
```

### 4.3 Marketplace 的 OIDC 交换到底发生了什么

```text
GitHub Actions job
  permissions: id-token: write
        │
        ▼
GitHub 签发短期 OIDC token
（包含 repo、workflow、ref 等声明）
        │
        ▼
Marketplace 校验 Trusted Publishing policy：
  repo owner / repo / workflow 是否匹配
        │
        ▼
签发短期发布凭据（约 15 分钟）
        │
        ▼
vsce publish --oidc 上传 VSIX
```

这替代了过去的长期 PAT，也避免了为了 PAT 去创建 Azure DevOps 组织。

---

## 5. 两个市场的差异

| 维度 | VS Code Marketplace | Open VSX |
| --- | --- | --- |
| 运营方 | Microsoft | Eclipse Foundation |
| 发布者身份 | Microsoft 账号 + publisher | Eclipse 账号 + namespace + Publisher Agreement |
| 认证方式 | OIDC trusted publishing（推荐）或 Azure DevOps PAT | Open VSX access token |
| 是否需要 GitHub 仓库 | 不是必须；OIDC 方式需要 | 不是必须；token 方式即可 |
| 是否需要 Eclipse 账号 | 否 | 是 |
| 是否需要 Azure 订阅 | 否（OIDC）；不要为此创建 Azure DevOps 组织 | 否 |
| 典型用户 | VS Code 及使用 Microsoft 市场的兼容编辑器 | VSCodium、Gitpod、Theia 等选择 Open VSX 的编辑器 |
| 版本历史 | 独立 | 独立 |

---

## 6. 关键概念

### publisher / namespace

同一个字符串，在两个市场里是两个独立的所有权记录：

- Marketplace 叫 **publisher**；
- Open VSX 叫 **namespace**。

它们不自动同步。你在两边都要拥有 `y2kloong`。

### extension ID

`publisher.name`，例如 `y2kloong.new-api-dashboard`。
用户安装、升级、配置隔离都围绕这个 ID。改 ID 等于换了一个扩展。

### VSIX

扩展安装包。Marketplace 和 Open VSX 都接受同一种 VSIX，但各自保存一份。
VSIX 本身不携带“谁有权发布”的信息，所有权由市场的账号体系决定。

### PAT（Personal Access Token）

一种长期凭据。这里有两个不同用途：

- **GitHub PAT**：推送代码和 tag。需要 Contents + Workflows 权限。
- **Azure DevOps PAT**：历史上用于 Marketplace 发布；使用 Trusted Publishing 后不需要。

### OIDC / Trusted Publishing

GitHub Actions 向 Marketplace 证明“这次构建来自这个仓库的这个 workflow”，
换取短期发布凭据。没有长期 secret 需要保存。

### Publisher Agreement

与 Eclipse Foundation 签署的发布者协议。它是 Open VSX 发布的法律前提，
和 GitHub 登录是两件事。

### ECA（Eclipse Contributor Agreement）

向 Eclipse 开源项目**贡献代码**时使用的协议，和发布扩展到 Open VSX 不是同一个
协议，不要混淆。

---

## 7. 常见误解

### “发布扩展需要 GitHub 账号，所以 GitHub 是市场”

不是。GitHub 是源码和 CI；市场是 Marketplace / Open VSX。GitHub 只是提供
OIDC 身份和构建环境。

### “Open VSX 用 GitHub 登录，所以属于 GitHub”

不是。Open VSX 由 Eclipse Foundation 管理。GitHub 只是登录方式之一；
发布者协议和 namespace 所有权都在 Eclipse 体系里。

### “Marketplace 一定要 Azure DevOps PAT”

以前是。现在推荐 Trusted Publishing（GitHub OIDC），不需要 PAT，也不需要
Azure DevOps 组织或 Azure 订阅。

### “一个 token 可以同时发两个市场”

不行。Marketplace 用 OIDC 或 Azure DevOps 凭据；Open VSX 用 Open VSX 自己的
access token。两套凭据独立。

### “改 displayName 会换扩展”

不会。`displayName` 只是展示名；扩展 ID 由 `publisher` + `name` 决定。

### “发布到 Open VSX 就等于发布到 Marketplace”

不会。两个市场独立收录、独立版本历史、独立页面。

### “Eclipse 账号就是 GitHub 账号”

不是。Eclipse 账号是法律/治理身份；GitHub 账号是代码托管身份。Open VSX 要求
把两者关联，是为了把 GitHub 登录映射到 Eclipse 发布者。

---

## 8. 本项目的实际绑定

| 绑定 | 值 |
| --- | --- |
| 扩展 ID | `y2kloong.new-api-dashboard` |
| Marketplace publisher | `y2kloong`（Microsoft 账号 Owner） |
| Open VSX namespace | `y2kloong`（Eclipse 账号，已签 Publisher Agreement） |
| GitHub 仓库 | `y2kloong/new-api-dashboard` |
| Marketplace Trusted Publishing | repo `y2kloong/new-api-dashboard`，workflow `release.yml` |
| Open VSX token | 本地 `.env.local` 的 `OVSX_PAT`，或 GitHub Actions secret |
| GitHub PAT | 本地 `.env.local` 的 `GITHUB_TOKEN`，仅用于 push/tag |
| 已发布版本 | `0.3.0` |

---

## 9. 参考

- VS Code 发布文档：<https://code.visualstudio.com/api/working-with-extensions/publishing-extension>
- Marketplace publisher 管理：<https://marketplace.visualstudio.com/manage>
- Open VSX 发布文档：<https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions>
- Open VSX 站点：<https://open-vsx.org/>
- Eclipse 账号：<https://accounts.eclipse.org/>
- GitHub fine-grained PAT：<https://github.com/settings/tokens?type=beta>
- 本项目的操作手册：[`publishing.md`](./publishing.md)
