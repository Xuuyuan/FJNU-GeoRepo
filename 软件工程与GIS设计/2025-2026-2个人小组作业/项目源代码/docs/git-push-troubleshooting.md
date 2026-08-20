# GitHub 推送故障处理

## 当前现象

本机环境中 `github.com` DNS 解析不稳定，普通 `git push` 可能直接失败：

```text
Could not resolve host: github.com
```

固定解析到 GitHub IP 后，443 端口可连，但网络仍可能在 pack 传输阶段重置连接：

```text
Recv failure: Connection was reset
```

这不是本次提交体积导致的。本仓库当前提交包体很小，`git count-objects -vH` 显示 pack 约 1 MiB，本轮提交也只有少量文本文件。

## 推荐推送方式

优先使用项目脚本：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/push-current-branch.ps1
```

脚本行为：

- 自动读取当前分支。
- 只推送当前分支到同名远端分支。
- 不修改 `origin` 地址。
- 使用 HTTPS，不使用 SSH 22 端口。
- 依次尝试多个 GitHub IP。
- 使用 `http.lowSpeedTime=15`，避免单次网络失败长时间挂起。

## 不推荐方式

不要在 DNS 失败时反复直接执行：

```powershell
git push
```

也不建议在当前网络下切 SSH 推送，因为 `github.com` DNS 失败且 22 端口可能超时，容易留下长时间挂起的 `git/ssh` 进程。

## 推送前检查

```powershell
git status --short --branch
git diff --stat origin/$(git branch --show-current)..HEAD
```

如果只领先 1 个小提交但仍推送很慢，优先判断为网络/DNS 问题，不应通过压缩、重写提交或改代码来处理。
