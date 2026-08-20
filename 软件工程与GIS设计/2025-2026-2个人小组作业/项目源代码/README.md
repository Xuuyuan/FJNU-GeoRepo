# 师大快跑：点亮校园计划

基于微信小程序、校园 GIS 数据和游戏化反馈的旗山校区空间探索 MVP。

## 玩法与技术路线

本项目的核心玩法不是“记录跑了多少公里”，而是“记录探索了多少校园空间”。校区被切分为大量 5m 逻辑网格，玩家通过真实行走或跑步点亮网格、发现地标、完成路线集合目标，并逐步解锁校园探索成就。

实际 GPS 定位存在 5-20m 甚至更大的误差，因此项目采用“5m 精细记录 + 20m GPS 点亮缓冲”的技术路线：5m 网格作为底层统计单元，但真实定位不会只点亮一个格子，而是把轨迹段视为 20m 宽的探索走廊，点亮走廊覆盖到的 5m 网格。

### 核心抽象

- `逻辑网格`：校园空间的最小探索单元。每个网格有唯一 `grid_id`，用于记录是否被用户点亮。
- `GPS 点亮缓冲`：真实定位按 20m 轨迹缓冲走廊点亮 5m 网格，用于抵消手机 GPS 漂移。
- `POI 区域`：POI 不只是一个坐标点，而是绑定若干逻辑网格。玩家进入这些网格后触发“发现地标”。
- `路线区域`：一条路线也是若干逻辑网格的集合。当玩家点亮其中大部分网格时，触发路线类成就。
- `成就规则`：由已点亮网格、已点亮 POI、已完成路线等条件组合而成。
- `不可到达网格`：湖面、建筑内部、隔离绿化等现实中无法到达的区域，应标记为不可点亮或不计入普通探索完成率。

### 推荐规则模型

POI 可以由后台配置其覆盖的网格集合，并支持不同点亮方式：

```js
{
  poi_id: "poi-library",
  name: "图书馆",
  grid_ids: ["grid-120-220", "grid-120-221"],
  unlock_mode: "touch" // touch: 到达即点亮；quiz: 发现后答题成功再点亮
}
```

路线可以由后台配置其目标网格集合和完成阈值：

```js
{
  route_id: "route-library-eastgate",
  name: "图书馆-东门探索线",
  grid_ids: ["grid-120-220", "grid-121-220"],
  complete_ratio: 0.8
}
```

成就可以基于 POI、路线或网格集合触发：

```js
{
  achievement_id: "all-poi",
  name: "结束了？",
  type: "poi_collection",
  required_poi_ids: ["poi-library", "poi-gym", "poi-east-gate"]
}
```

### 分工边界

- 前端负责定位采集、轨迹绘制、定位点转网格、点亮反馈、POI/路线/成就触发提示和已点亮区域渲染。
- 后台配置负责维护网格基础信息、不可到达区域、POI 对应网格、路线对应网格和成就规则。
- 云端数据负责保存用户已点亮网格、已发现 POI、已完成路线、已获得成就和探索会话。

### MVP 优先级

第一版优先验证以下能力：

- 5m 逻辑网格点亮。
- 20m GPS 点亮缓冲。
- 不可到达区域排除。
- POI 绑定网格并触发发现。
- 网格集合成就，例如路线完成 80% 后弹出成就。

独立答题页、图鉴详情、成就中心、探索看板和基础排行榜已经纳入当前演示版本；社交比较和完整后台管理仍作为后续扩展。

## 当前 MVP 能力

- 展示福建师范大学旗山校区地图、探索网格、道路、建筑和 POI。
- 获取实时定位并绘制用户探索轨迹。
- 根据真实 GPS 轨迹的 20m 缓冲走廊点亮 5m 逻辑网格。
- 根据 POI 绑定的逻辑网格判断地标发现事件。
- 支持湖面等不可到达网格排除，不计入普通探索率。
- 支持路线完成度成就和 POI 集合成就的基础规则。
- 支持 `quiz` 类型 POI 的最小答题确认流程，答题通过后计入发现地标。
- 支持独立 `pages/poi-quiz` 答题页，quiz 型 POI 通过页面完成答题，touch 型 POI 仍保持到达即发现。
- 支持 POI 知识卡片与图鉴筛选，展示地标简介、类型、触发半径、知识内容和 quiz 文案。
- 支持探索看板与个人等级积分，按点亮网格、发现 POI、完成路线和解锁成就计算积分。
- 支持基础排行榜，云端按网格数、POI 数或成就数读取可演示排名。
- 支持探索结束结算页，展示本次距离、时长、新增网格、发现地标、路线和新成就。
- 本地缓存探索进度，并通过云函数同步用户汇总、网格点亮、POI 发现、路线记录、成就记录和探索会话。
- 探索会话会保存经过抽样和坐标精度控制的轨迹点，用于历史详情和后续统计分析；默认不保存高频完整轨迹。
- 提供群体统计接口的 MVP 形态，返回用户数、记录数，并为探索看板和排行榜提供聚合数据。

## 项目结构

- `miniprogram/data/campus.js`：校园多边形边界、5m 校区内逻辑探索网格、道路、建筑和地标 POI。
- `miniprogram/data/buildings.generated.js`：由 `docs/BuildMap.json` 生成的建筑面与精选地标候选点。
- `miniprogram/data/game-config.js`：不可到达区域、POI 网格绑定、路线规则和成就规则。
- `miniprogram/pages/index/`：小程序主地图与探索面板。
- `miniprogram/pages/poi-quiz/`：地标 quiz 独立答题页。
- `miniprogram/pages/dashboard/`：个人探索看板、积分等级和统计入口。
- `miniprogram/pages/leaderboard/`：基础云端排行榜。
- `miniprogram/pages/session-result/`：单次探索结算页。
- `miniprogram/utils/spatial.js`：距离、范围、点面、线面相交、点到线段距离、20m 轨迹缓冲点亮等空间计算。
- `miniprogram/services/cloud.js`：前端云函数调用封装。
- `cloudfunctions/sdkpFunctions/`：云开发接口，负责写入探索数据。
- `docs/mvp-demo.md`：答辩演示路线和验收清单。

## BuildMap 建筑数据

`docs/BuildMap.json` 是校园建筑/地标面数据源，原始对象包含 `buildName`、`id`、`areaId`、`center` 和 `coords`。`center` 与 `coords` 使用 BuildMap 原始平面坐标读取，再通过已实测的建筑控制点配准到小程序地图坐标，生成文件为：

```bash
npm run generate:buildings
```

生成结果写入 `miniprogram/data/buildings.generated.js`，供 `miniprogram/data/campus.js` 直接引用。每个建筑包含 `id`、`sourceId`、`name`、`areaId`、`center`、`points` 和 `bounds`；脚本会去掉连续重复点和闭合重复尾点，并过滤明显离群的无效多边形。当前源文件 184 条对象中有 1 条坐标明显落在外部空间簇，生成时保留 183 条有效建筑。

为避免全量建筑被挤压到校区中心小区域，生成脚本不再用集合包络线性压缩。`scripts/buildmap-converter.js` 中的 `DEFAULT_GEOREFERENCE_CONTROL_POINTS` 记录了又玄图书馆、体育馆、东/南/西大门、师生活动中心、音乐学院建筑、餐厅和宿舍等实测控制点；脚本先做全局仿射配准，再用控制点残差做局部修正。若后续拿到更多真实坐标，可继续补充控制点后重新运行 `npm run generate:buildings`。

建筑面接入后的玩法影响：

- 地图建筑 polygon 默认渲染生成数据的前 120 个面，保留兜底数据，避免生成文件缺失导致页面崩溃。
- `game-config.js` 会把建筑轮廓内的 5m 网格加入不可到达集合；湖面等手工不可到达区域继续保留。
- POI 网格绑定会跳过不可到达格，避免普通探索要求进入建筑内部。
- 生成脚本只精选图书馆、理工楼群、音乐学院、体育中心、文化街和宿舍区代表点作为扩展图鉴候选，不会把全部建筑强制变成 POI。
- 已补充理工楼群、音乐学院、体育中心和宿舍区相关路线/成就规则，沿用本地路线与成就结构。

## 云函数

当前云函数名为 `sdkpFunctions`。部署后会按需创建以下集合：

- `userinfo`
- `gridstatus`
- `poi_records`
- `track_sessions`
- `route_records`
- `achievement_records`
- `runtime_config`
- `poi_config`
- `route_config`
- `achievement_config`

当前 `poi_config` 可覆盖 POI 名称、类型、简介、知识内容、解锁方式和 quiz 文案；`route_config` 可覆盖路线名称、简介和完成阈值；`achievement_config` 可覆盖成就名称、简介、类别和排序。前端始终保留本地配置兜底。

云函数事件包括：

- `submitPoiQuiz`
- `syncGameProgress`
- `getLeaderboard`
- `getExploreStats`

## 本地检查

```bash
npm test
npm run check:js
```

测试覆盖固定模拟轨迹的网格点亮、POI 触发、页面展示模型、积分看板、排行榜模型、重复点亮去重、quiz 提交、路线/成就记录和校园数据规模。
