# 微信开发者工具调试说明

## 当前项目配置

- 小程序 AppID: `wx66c1fdb13b55ab75`
- 云环境 ID: `cloudbase-5geu96mj1eb64ee8`
- 小程序根目录: `miniprogram/`
- 云函数根目录: `cloudfunctions/`
- 云函数名称: `sdkpFunctions`

## 云函数部署位置

推荐在微信开发者工具左侧资源管理器中部署:

1. 展开 `cloudfunctions`。
2. 右键 `sdkpFunctions`。
3. 选择 `上传并部署：云端安装依赖`。
4. 部署完成后，到云开发控制台的 `云函数` 页面确认 `sdkpFunctions` 已存在。

也可以使用 CLI 部署:

```powershell
& 'C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat' cloud functions deploy --env cloudbase-5geu96mj1eb64ee8 --names sdkpFunctions --remote-npm-install --project 'D:\wendang\New project 8'
```

如果 CLI 返回 `getCloudAPISignedHeader failed` 或 `ret:41002`，通常不是函数代码语法问题，而是开发者工具云开发登录态、授权或云 API 临时异常。优先在开发者工具里重新登录、重新打开云开发控制台，再通过资源树右键部署。

## 当前错误解释

### `Error: timeout`

截图中的调用栈只显示:

```text
Error: timeout
at Function.<anonymous> (WAServiceMainContext...)
```

这是微信开发者工具内部 `WAServiceMainContext` 抛出的通用超时错误。它不是一个具体业务文件的语法错误，通常需要结合前后日志判断来源。

在本项目当前阶段，最可能的来源有两个:

- 定位接口启动或持续定位回调超时。
- 云函数调用或云开发初始化请求超时。

如果页面顶部显示 `云端待同步重试` 或点击 `立即同步` 后出现该错误，应优先检查 `sdkpFunctions` 是否已经部署成功，以及当前云环境是否为 `cloudbase-5geu96mj1eb64ee8`。

### `MultiPolyline.geometries`

该错误表示地图组件收到的 `polyline` 数据不合法。当前已修复: 当轨迹点少于 2 个时，不再生成轨迹线。

### `requiredPrivateInfos`

微信基础库要求在 `app.json` 中声明定位相关隐私接口。当前已声明:

```json
[
  "getLocation",
  "startLocationUpdate",
  "startLocationUpdateBackground",
  "onLocationChange"
]
```

同时已移除无效的 `permission.scope.userLocationBackground`。

## GPS 调试建议

微信开发者工具模拟器不适合验证真实 GPS 精度、持续定位和后台定位。模拟器只能验证基础授权流程和页面状态。

建议优先使用真机调试验证:

- 首次进入是否弹出定位授权。
- 点击 `回到我的位置` 是否能更新当前位置。
- 点击 `开始探索` 是否能持续收到定位。
- 走动后轨迹点是否增加。
- 点亮网格、POI、结算页是否正常。

## 云端同步检查清单

部署 `sdkpFunctions` 后，执行以下检查:

1. 点击首页 `立即同步`。
2. 查看首页同步状态是否从 `云端待同步重试` 变为同步成功。
3. 在云开发控制台确认集合是否存在:
   - `userinfo`
   - `gridstatus`
   - `poi_records`
   - `track_sessions`
4. 完成一次 `开始探索 -> 结束探索`，确认 `track_sessions` 中写入会话记录。

