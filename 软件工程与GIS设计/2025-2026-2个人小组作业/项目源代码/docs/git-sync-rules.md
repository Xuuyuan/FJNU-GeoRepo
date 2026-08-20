# GitHub、本地文件、微信开发者工具协作规则

## 基本原则

GitHub 是项目唯一正式代码源。所有可追溯、可协作、可回滚的代码和文档都必须以 GitHub 仓库为准。

本地目录只是工作副本。开发、调试、测试可以在本地完成，但本地状态不代表正式版本，必须通过 Git 分支、提交和推送进入 GitHub 后才算进入协作链路。

微信开发者工具只负责导入、编译、预览、真机测试、云函数部署验证和小程序上传。不要把微信开发者工具当成代码源，也不要直接依赖工具里的临时状态判断项目版本。

## 数据拉取流程

每次开发前先确认当前分支和工作区状态：

```powershell
git status --short --branch
```

如果工作区有未提交改动，先判断是否属于当前任务。无关改动不要混入本次提交；有冲突风险时先暂停并确认。

开发前必须拉取远端最新代码：

```powershell
git pull --ff-only
```

如果当前网络无法正常解析 GitHub，可使用项目脚本推送；拉取仍应优先修复网络或使用已确认可用的固定解析方式，不要在过时分支上继续开发。

## 分支规则

每个任务新建一个 feature 分支，不直接在 `main` 上开发。

推荐分支命名：

```powershell
git switch -c codex/feature-name
```

已有集成任务可继续使用当前集成分支，但新功能、修复和实验性改动应拆分到独立分支，避免多个目标混在一个提交里。

合并方向应保持清晰：

- `main`：稳定主线。
- `dev-042802`：既有开发线。
- `codex/dev-042802-integrated`：当前集成验证线。
- `codex/*`：具体任务分支。

## 文件推送原则

提交前必须运行：

```powershell
npm test
npm run check:js
git diff
git status --short
```

提交内容应只包含当前任务相关文件。不要把微信开发者工具自动改动、临时调试文件、构建产物、依赖目录或密钥混入提交。

推送优先使用：

```powershell
git push
```

如果本机 DNS 或 GitHub HTTPS 连接不稳定，使用项目脚本：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\push-current-branch.ps1
```

## 微信开发者工具配置原则

微信开发者工具只导入项目根目录，不负责保存正式代码版本。

导入时以仓库中的公共配置为准：

- `project.config.json` 仅在公共项目配置确需变化时提交。
- `project.private.config.json` 属于个人本地配置，禁止提交。
- AppID 必须使用项目归属方统一配置。
- 云环境 ID 必须使用项目归属方统一配置。

当前项目统一配置：

- AppID：`wx66c1fdb13b55ab75`
- 云环境 ID：`cloudbase-5geu96mj1eb64ee8`

如果微信开发者工具自动修改了配置文件，提交前必须检查差异；不能确认是公共配置变更时，不提交。

## 云开发协作原则

云函数代码以 GitHub 为准。代码提交和推送到 GitHub 后，仍需要在微信开发者工具中手动部署并验证云端版本。

云函数部署流程：

1. 确认本地分支已同步最新代码。
2. 运行 `npm test` 和 `npm run check:js`。
3. 在微信开发者工具中右键云函数目录部署。
4. 在云开发控制台确认函数已部署。
5. 在小程序控制台确认关键调用成功，例如 `getRuntimeConfig`、`getUserProgress`、`initUserProfile`、`syncExploreSummary`。

云数据库集合和权限调整属于平台配置，必须在云开发控制台手动确认。代码可以声明预期集合结构，但不能替代平台权限配置。

## 禁止提交清单

以下内容禁止提交：

- `node_modules/`
- `cloudfunctions/*/node_modules/`
- `project.private.config.json`
- AppSecret
- 密钥、token、证书、私钥
- `.env`、`.env.*`
- 微信开发者工具个人配置
- 本地日志、临时文件、调试导出文件
- 与当前任务无关的文件
- 未确认来源的压缩包、截图、数据库导出

## 推荐命令

开发前：

```powershell
git status --short --branch
git pull --ff-only
git switch -c codex/feature-name
```

提交前：

```powershell
npm test
npm run check:js
git diff
git status --short
```

提交和推送：

```powershell
git add <files>
git commit -m "type: concise summary"
git push
```

网络不稳定时推送：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\push-current-branch.ps1
```

## 常见错误处理

`Could not resolve host: github.com`：

本机 DNS 解析失败。不要反复盲目 `git push`；先检查网络，必要时使用项目推送脚本。

`Recv failure: Connection was reset`：

GitHub HTTPS 连接在传输阶段被重置。若提交很小，通常不是代码体积问题；使用项目推送脚本切换可用 GitHub IP。

微信开发者工具显示云函数已部署但小程序调用失败：

先检查 AppID、云环境 ID、云函数名称和部署环境是否一致；再看控制台中的 `function_version` 和云函数日志。

`project.config.json` 或 `project.private.config.json` 出现改动：

先用 `git diff` 查看。`project.private.config.json` 不提交；`project.config.json` 只有在公共配置确需变化时才提交。

云端同步成功但重新打开没有恢复：

检查云数据库中 `userinfo`、`gridstatus`、`poi_records`、`track_sessions` 是否有当前用户数据，并确认云函数 `getUserProgress` 已部署到当前环境。
