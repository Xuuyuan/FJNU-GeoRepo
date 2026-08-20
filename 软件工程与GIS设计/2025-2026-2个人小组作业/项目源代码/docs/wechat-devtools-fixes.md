# 微信开发者工具运行修复记录

## 2026-05-13

### 修复定位隐私声明

文件: `miniprogram/app.json`

处理内容:

- 删除无效配置 `permission.scope.userLocationBackground`。
- 保留 `requiredBackgroundModes: ["location"]`。
- 增加 `requiredPrivateInfos`，声明定位相关隐私接口:
  - `getLocation`
  - `startLocationUpdate`
  - `startLocationUpdateBackground`
  - `onLocationChange`

影响:

- 解决开发者工具中 `wx.onLocationChange need to be declared...` 和 `wx.startLocationUpdate need to be declared...` 类错误。
- 后台定位能力仍需要在微信平台侧开通和审核，不能仅靠代码配置完成。

### 修复单点轨迹 polyline 报错

文件: `miniprogram/services/explore-map-service.js`

问题:

地图组件在只有 1 个轨迹点时收到 `polyline`，会报:

```text
MultiPolyline.geometries: 希望传入 PolylineGeometry 数组，实际第 4 元素的 paths 属性无效
```

处理内容:

- 当 `trackPoints` 不是数组或长度小于 2 时，返回空轨迹线。

影响:

- 首次定位、开始探索后的第一个轨迹点不会再触发无效 polyline。
- 第二个轨迹点出现后才开始绘制轨迹线。

### 云函数部署状态

目标函数: `cloudfunctions/sdkpFunctions`

当前结构具备部署条件:

- `index.js`
- `package.json`
- `config.json`

CLI 可识别云环境:

```text
cloudbase-5geu96mj1eb64ee8
```

CLI 部署曾返回:

```text
getCloudAPISignedHeader failed
ret: 41002
errmsg: system error
```

判断:

- 该错误来自微信开发者工具云 API 签名或登录态，不是当前云函数 JS 语法错误。
- 优先通过开发者工具资源树右键 `sdkpFunctions` 执行 `上传并部署：云端安装依赖`。

### 云函数超时配置

文件: `cloudfunctions/sdkpFunctions/config.json`

问题:

云函数部署后显示默认超时时间为 `3` 秒，而当前函数在调用前会检查并创建集合，首次调用或云端状态较慢时容易触发:

```text
Error: timeout
```

处理内容:

- 将云函数 `timeout` 配置为 `20` 秒。

注意:

- 该配置只有重新部署 `sdkpFunctions` 后才会在云端生效。
- 如果 CLI 部署仍返回 `getCloudAPISignedHeader failed` / `ret:41002`，需要在微信开发者工具 UI 中重新登录或通过资源树右键部署。

### 云调用失败日志

文件: `miniprogram/services/cloud.js`

处理内容:

- 为 `wx.cloud.callFunction` 增加失败日志。
- 后续同步失败时，Console 会打印 `[cloud:<type>] failed` 或 `[cloud:<type>] error after <ms>`，方便区分是函数返回失败还是调用超时。

### 修复云数据库 `_id` 写入错误

文件: `cloudfunctions/sdkpFunctions/index.js`

问题:

云函数部署成功后，前端同步返回:

```text
document.set:fail -501007 invalid parameters. 不能更新_id的值
```

原因:

- 代码使用 `collection.doc(id).set({ data })` 指定了文档 ID。
- 同时又在 `data` 中传入 `_id` 字段。
- 微信云数据库不允许在 `set` 的 `data` 中更新 `_id`。

处理内容:

- 从 `userinfo`、`gridstatus`、`poi_records`、`track_sessions` 写入数据中移除 `_id` 字段。
- 文档 ID 继续由 `doc(id)` 指定。

影响:

- 修复 `syncExploreSummary`、`syncGridStatus`、`syncPoiRecords`、`syncExploreSession` 的写入失败问题。
- 修复后需要重新部署 `sdkpFunctions`。

### 已执行本地检查

```text
npm test
npm run check:js
```

结果:

- 两项均通过。
- 空间算法和校园数据未改动。
