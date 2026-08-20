# 分支状态与阶段计划

## 最新分支判断

截至 2026-05-16，本地 `dev-20260516`、`main` 与远端 `StarRunning/main` 指向同一最新提交 `db2b576`。当前工作应继续基于最新主线或从主线新建短分支推进，不再按早期集成分支规划重复收敛。

当前状态：

- `main`：最新主线，包含 3D 地图、结算页、历史页、POI 图鉴页、云函数模块化、运行配置读取和测试护栏。
- `dev-20260516`：当前本地工作分支，与 `main` 同起点。
- `dev-042802` 和 `codex/dev-042802-integrated`：历史开发/集成线，功能已经进入主线，不作为下一步开发基线。

当前后续开发建议：

- 小修和文档更新可在 `dev-20260516` 上继续。
- 较大功能从 `main` 新建 `codex/<topic>` 短分支。
- 每次上传前固定运行 `npm test` 与 `npm run check:js`。

## 阶段一：分支收敛

目标：把 `main` 和 `dev-042802` 的最新功能收敛到集成分支。

本轮执行：

- 合入 `origin/dev-042802`。
- 保留底图 POI 隐藏和建筑显示配置。
- 保留云端探索进度恢复 `getUserProgress`。
- 保留当前分支的云函数模块化和文档体系。

## 阶段二：云同步稳定化

目标：把云端读写能力放到可维护的模块结构里。

本轮执行：

- `sdkpFunctions` 继续保持单入口。
- `getUserProgress` 纳入 `handlers/profile.js`。
- 写入逻辑使用 `setDocument` 过滤 `_id` 等保留字段。
- 所有云函数响应带 `function_version`，便于微信开发者工具控制台定位部署版本。

## 阶段三：云端配置最小接入

目标：先允许云端覆盖文案，不允许云端改空间判定。

本轮执行：

- 保留 `getRuntimeConfig` 读取 `runtime_config`、`poi_config`、`route_config`、`achievement_config`。
- 小程序启动时缓存云端配置到 `sdkp:runtime-config`。
- `poi_config/current.items` 可覆盖 POI 名称和 quiz 文案。
- 不允许覆盖 POI 坐标、触发半径、网格归属、不可达区域、路线空间判定。

## 阶段四：MVP 验收稳定化

下一步需要在微信开发者工具和真机中验证：

- 重新上传部署 `sdkpFunctions`。
- 打开首页，确认控制台出现 `getRuntimeConfig`、`getUserProgress`、`initUserProfile` 成功日志。
- 创建或留空 `poi_config/current`，确认留空时本地规则兜底。
- 真机走一次 `授权定位 -> 开始探索 -> 点亮网格 -> 发现 POI/quiz -> 结束探索 -> 结算页 -> 云端同步 -> 重新打开恢复进度`。
- 记录 GPS 精度、定位点间隔、弱信号提示、POI 触发半径和结算页数据是否合理。
- 验收记录写入 `docs/mvp-acceptance-checklist.md`。

## 阶段五：功能扩展

阶段四稳定后再进入：

- 独立 POI quiz 页面。
- 成就页。
- 更丰富的历史探索详情和 POI 图鉴筛选。
- 排行榜和社交玩法。
