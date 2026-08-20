# 云端运行配置方案

## 当前策略

阶段三先接入“云端配置可读取、前端可缓存、本地规则兜底”的最小闭环，不直接替换核心空间算法和现有校园数据。

小程序启动后会调用云函数事件 `getRuntimeConfig`。云端存在配置时，结果会缓存到本地 `sdkp:runtime-config`；云端配置不存在或读取失败时，页面继续使用 `miniprogram/data/game-config.js` 中的本地规则。

## 云函数事件

入口函数仍然是 `sdkpFunctions`。

调用参数：

```json
{
  "type": "getRuntimeConfig",
  "data": {}
}
```

返回结构：

```json
{
  "success": true,
  "source": "cloud",
  "config_doc_id": "current",
  "data": {
    "runtime": {},
    "poi": {},
    "route": {},
    "achievement": {}
  }
}
```

如果云端没有配置文档，`source` 为 `local-fallback`，`data` 中对应字段为 `null`。

## 数据库集合约定

需要在微信云开发数据库中使用以下集合。云函数会尝试自动创建集合，但实际权限仍以云开发控制台为准。

- `runtime_config`
- `poi_config`
- `route_config`
- `achievement_config`

每个集合当前读取固定文档 ID：`current`。

## 建议字段

`runtime_config/current`：

```json
{
  "version": "2026-05-13.1",
  "enabled": true,
  "notes": "runtime config smoke test"
}
```

`poi_config/current`：

```json
{
  "version": "2026-05-13.1",
  "items": [
    {
      "poi_id": "poi-library",
      "name": "图书馆",
      "unlock_mode": "quiz",
      "quiz": {
        "question": "这里是旗山校区的重要学习空间吗？",
        "options": [
          { "option_id": "yes", "label": "是", "is_correct": true },
          { "option_id": "no", "label": "不是", "is_correct": false }
        ],
        "success_text": "答题通过，地标已发现",
        "failure_text": "答题未通过，稍后可再试"
      }
    }
  ]
}
```

`route_config/current`：

```json
{
  "version": "2026-05-13.1",
  "items": []
}
```

`achievement_config/current`：

```json
{
  "version": "2026-05-13.1",
  "items": []
}
```

## 下一步接入原则

1. 先只用云端配置覆盖文案类字段，例如 POI 名称、quiz 题目、答案文案。
2. 暂不允许云端覆盖坐标、网格、不可达区域和路线空间判定逻辑。
3. 每次接入一类配置后，必须保留本地兜底并运行 `npm test`、`npm run check:js`。
