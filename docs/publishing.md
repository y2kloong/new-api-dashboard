# NewAPI Dashboard — 注册与发布手册

> 先理解角色关系：Eclipse、Open VSX、Marketplace、GitHub 各自是什么、为什么
> 需要互相关联，见 [`ecosystem.md`](./ecosystem.md)。本文只讲操作步骤。

本文记录 `y2kloong.new-api-dashboard` 从账号注册到发布到 Open VSX 和
VS Code Marketplace 的完整流程。命令默认在仓库根目录执行（Windows Git
Bash / PowerShell 均可，示例以 Git Bash 为主）。

> 安全：不要把任何 token 写进本文、README、源码、日志或聊天记录。发布用的
> token 只放在仓库外或本地 `.env.local`（已加入 `.gitignore`）。

---

## 0. 当前固定信息

| 项目 | 值 |
| --- | --- |
| 扩展 ID | `y2kloong.new-api-dashboard` |
| 包名 | `new-api-dashboard` |
| publisher | `y2kloong` |
| GitHub 仓库 | `https://github.com/y2kloong/new-api-dashboard` |
| Marketplace | `https://marketplace.visualstudio.com/items?itemName=y2kloong.new-api-dashboard` |
| Open VSX | `https://open-vsx.org/extension/y2kloong/new-api-dashboard` |
| Release workflow | `.github/workflows/release.yml` |
| Trusted Publishing policy | `Release workflow` |
| Open VSX namespace | `y2kloong` |
| 当前已发布版本 | `0.3.0` |

扩展 ID / publisher / 包名要保持一致，否则两个市场会变成另一个扩展。

---

## 1. 一次性注册

### 1.1 GitHub 账号与仓库

1. 注册/登录 GitHub：<https://github.com/>
2. 创建仓库：<https://github.com/new>
   - Owner：`y2kloong`
   - Repository name：`new-api-dashboard`
   - Public
   - 不要勾 README / .gitignore / license（本地已有）
3. 创建 **fine-grained PAT**：<https://github.com/settings/tokens?type=beta>
   - Resource owner：`y2kloong`
   - Repository access：Only select repositories → `new-api-dashboard`
   - Repository permissions：
     - **Contents: Read and write**（推送代码、tag）
     - **Workflows: Read and write**（推送 `.github/workflows/*`，缺少会被拒绝）
     - **Metadata: Read**（自动）
   - 有效期建议 7 天，发布完成后轮换

> 如果 push 报错
> `refusing to allow a Personal Access Token to create or update workflow ... without workflow scope`，
> 就是缺少 **Workflows** 权限。

### 1.2 Eclipse Foundation 账号（Open VSX 发布者协议需要）

Open VSX 现在要求 **Eclipse Foundation 账号** 并签署 Publisher Agreement，
只用 GitHub 登录不够。

1. 注册 Eclipse 账号：<https://accounts.eclipse.org/user/register>
   - 邮箱、用户名、姓名、密码、国家
   - 完成邮箱验证
2. 绑定 GitHub：
   - 打开 <https://accounts.eclipse.org/users/><你的 Eclipse 用户名>`/linked-accounts`
   - 点 **Link GitHub Account**，授权与 open-vsx 登录相同的 GitHub 账号
   - 成功后页面显示 `Status Connected as <github-username>`
3. 登录 open-vsx.org：<https://open-vsx.org/>
   - 先用 GitHub 登录
   - 打开 <https://open-vsx.org/user-settings/profile>
   - 点 **Log in with Eclipse**，用 Eclipse 账号授权
4. 签署 Publisher Agreement：
   - Profile 页面出现 **Review & sign**
   - 打开协议，滚到底，点 **Agree**
5. 创建 namespace：
   - 网页：`https://open-vsx.org/user-settings/namespaces` → **Create namespace** → `y2kloong`
   - 或 CLI：`npx ovsx create-namespace y2kloong -p <OVSX_PAT>`
   - 不要求 verified；想要认证徽章可点 **Claim Ownership**
6. 生成 Open VSX token：
   - <https://open-vsx.org/user-settings/tokens> → **Generate New Token**
   - 描述例如 `new-api-dashboard local publish`
   - 只显示一次，立即保存
   - 可勾选 **Publishing only**，限制 token 只能发布

> 如果 Eclipse 登录后跳 `https://open-vsx.org/?auth-error`，通常是 Eclipse
> 账号没有绑定 GitHub，或绑定的不是 open-vsx 登录用的那个 GitHub 账号。
> 回到 1.2 第 2 步修复后重新 `Log in with Eclipse`。

### 1.3 VS Code Marketplace publisher

1. 打开 publisher 管理页：<https://marketplace.visualstudio.com/manage>
2. 用 Microsoft 账号登录（与 PAT/发布身份一致）
3. 创建 publisher：
   - ID：`y2kloong`（必须与 `package.json` 的 `publisher` 完全一致）
   - Name：`y2kloong`
4. 确认当前账号在该 publisher 下是 **Owner**

### 1.4 Marketplace 发布方式：Trusted Publishing（推荐，不需要 Azure DevOps）

不要为了 Marketplace 去创建 Azure DevOps 组织：现在创建新组织会要求绑定
Azure 订阅（需要信用卡）。改用 GitHub OIDC Trusted Publishing 即可。

1. 打开 <https://marketplace.visualstudio.com/manage>
2. 选择 publisher `y2kloong` → **Trusted Publishing**
3. 展开 **Create**，填写：
   - Policy name：`Release workflow`
   - Provider：**GitHub Actions**
   - Repository owner：`y2kloong`
   - Repository：`new-api-dashboard`
   - Workflow：`release.yml`（只填文件名，不带 `.github/workflows/`）
   - Environment：留空（除非 workflow 使用了 GitHub Environment）
4. 点 **Create**
5. 工作流必须有 OIDC 权限：

```yaml
permissions:
  contents: write
  id-token: write
```

发布命令：

```bash
npx @vscode/vsce publish --oidc
```

> 私有仓库需要在创建 policy 后 48 小时内跑一次首次 token 交换；公开仓库不受
> 这个限制。首次成功后 policy 自动激活。

---

## 2. 本地发布凭据

建议把 token 放在仓库根目录的 `.env.local`，并确认它被 `.gitignore` 忽略：

```gitignore
.env
.env.local
.env.*.local
```

`.env.local` 示例（**不要提交**）：

```text
GITHUB_TOKEN=github_pat_xxx
OVSX_PAT=ovsxap_xxx
```

在 Git Bash 中使用：

```bash
set -a; . ./.env.local; set +a
```

不要在命令里直接写 token，也不要把 token 加进 git remote URL（会留在
`.git/config` 和 shell history 里）。推送时用临时 credential helper：

```bash
git -c credential.helper='!f() { echo "username=y2kloong"; echo "password=$GITHUB_TOKEN"; }; f' push -u origin main
```

token 泄露或出现在聊天/日志后，应立即轮换。

---

## 3. 每次发布

### 3.1 规则

- **每次 `npm run package` 前必须升版本**，禁止用不同内容重建已交付的版本。
- 使用 semver：修复 → patch，功能 → minor，破坏性变更 → major（0.x 阶段
  minor 可视为破坏性）。
- 同一次改动更新 `CHANGELOG.md`。
- 发布打 tag `vX.Y.Z`，tag 会触发 `.github/workflows/release.yml`。

### 3.2 本地检查与打包

```bash
npm ci
npm test
npm run typecheck
npm version patch --no-git-tag-version   # 或 minor / major
npm run package
```

产物：`new-api-dashboard-X.Y.Z.vsix`。

### 3.3 发布到 Open VSX（本地）

```bash
set -a; . ./.env.local; set +a
npx ovsx publish new-api-dashboard-X.Y.Z.vsix -p "$OVSX_PAT"
```

首次发布后公共页面/接口可能有几分钟索引延迟，`404` 不一定是失败。可以轮询：

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://open-vsx.org/api/y2kloong/new-api-dashboard
```

### 3.4 推送 GitHub，tag 触发 Marketplace 发布

```bash
git add .
git commit -m "release: X.Y.Z"
set -a; . ./.env.local; set +a

git -c credential.helper='!f() { echo "username=y2kloong"; echo "password=$GITHUB_TOKEN"; }; f' push origin main
git tag -a vX.Y.Z -m "NewAPI Dashboard X.Y.Z"
git -c credential.helper='!f() { echo "username=y2kloong"; echo "password=$GITHUB_TOKEN"; }; f' push origin vX.Y.Z
```

tag 推送后，`.github/workflows/release.yml` 会：

1. `npm ci`
2. `npm test`
3. `npm run typecheck`
4. `npm run package`
5. `npx @vscode/vsce publish --oidc` → Marketplace
6. 如果仓库 secret `OVSX_PAT` 存在 → `npx ovsx publish ...` → Open VSX
7. 把 VSIX 挂到 GitHub Release

### 3.5 可选：让 CI 也发 Open VSX

GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret：

- Name：`OVSX_PAT`
- Value：Open VSX token

没有这个 secret 时，workflow 会自动跳过 Open VSX 步骤。

### 3.6 发布后验证

- Marketplace（刚发布可能显示 Verifying，公开页 404 是正常的）：
  <https://marketplace.visualstudio.com/items?itemName=y2kloong.new-api-dashboard>
- Open VSX：
  <https://open-vsx.org/extension/y2kloong/new-api-dashboard>
- GitHub Release：
  <https://github.com/y2kloong/new-api-dashboard/releases>
- GitHub Actions 运行记录：
  <https://github.com/y2kloong/new-api-dashboard/actions>

---

## 4. 发布架构

```text
git tag vX.Y.Z
      │
      ▼
GitHub Actions (.github/workflows/release.yml)
      │
      ├─ npm ci / test / typecheck / package
      ├─ vsce publish --oidc ──────────────► VS Code Marketplace
      ├─ ovsx publish (可选 OVSX_PAT) ─────► Open VSX
      └─ upload VSIX ──────────────────────► GitHub Release
```

Marketplace 使用 GitHub OIDC，不需要 Azure DevOps PAT 或 Azure 订阅；
Open VSX 使用 Eclipse Publisher Agreement + access token。

---

## 5. 常见问题

### Open VSX 提示需要 Eclipse 账号 / Publisher Agreement

只登录 GitHub 不够。按 1.2 注册 Eclipse 账号、绑定 GitHub、`Log in with
Eclipse` 并签署 Publisher Agreement。

### Open VSX 登录后跳 `?auth-error`

Eclipse 账号没有绑定 GitHub，或绑定的 GitHub 不是 open-vsx 登录用的账号。
打开 `https://accounts.eclipse.org/users/<eclipse-username>/linked-accounts`
点 **Link GitHub Account**，确认显示 `Connected as <github-username>`，然后重新
`Log in with Eclipse`。

### Open VSX 发布成功但页面 404

索引延迟，通常几十秒到几分钟。用 API 轮询确认，不要重复发布同一版本。

### Marketplace 页面 404 / 后台显示 Verifying

Marketplace 首次发布有自动扫描，状态会显示 `Verifying X.Y.Z`。扫描完成后
公开页才能访问，不要重复发布。

### `vsce publish` 报 workflow scope 错误

推送包含 `.github/workflows/*` 的提交时，fine-grained PAT 需要
**Workflows: Read and write**；classic PAT 需要 `workflow` scope。

### 创建 Azure DevOps 组织要求 Azure 订阅

不要走这条路。Marketplace 发布改用 Trusted Publishing（1.4），不需要 Azure
DevOps 组织、PAT 或 Azure 订阅。

### 发布后扩展配置丢失

扩展 ID 变化会导致 `SecretStorage` 和扩展状态不继承。重新打开配置页，填一次
服务器地址和访问令牌即可。命令 ID（`lyNewApi.*`）和设置键没有变化。

### `vsce` 拒绝图标

Marketplace 不接受 SVG 图标。本项目使用 `media/icon.png`（128×128 PNG）。

---

## 6. 发布检查清单

- [ ] `package.json` 版本已升，且没有重复发布过
- [ ] `CHANGELOG.md` 已更新
- [ ] `npm ci` / `npm test` / `npm run typecheck` 通过
- [ ] `npm run package` 生成 `new-api-dashboard-X.Y.Z.vsix`
- [ ] Open VSX token 有效，`npx ovsx publish` 成功
- [ ] GitHub PAT 有 Contents + Workflows 权限
- [ ] `main` 和 `vX.Y.Z` tag 已推送
- [ ] GitHub Actions Release 运行成功
- [ ] Marketplace / Open VSX 页面可访问
- [ ] GitHub Release 已挂 VSIX
- [ ] 发布 token 已轮换或确认安全
