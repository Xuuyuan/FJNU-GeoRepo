# 《计算机网络技术》 大作业

## MySQL 数据表列表

### 1. 表名: `announcements`

**说明**: 用于存储公告信息的表格。

| 字段名 | 数据类型 | 属性/备注 |
| --- | --- | --- |
| `id` | `int unsigned` | **主键**, 自增, NOT NULL |
| `title` | `text` | 公告标题 |
| `origin` | `varchar(10)` | 标记公告来源，如：`教务处` |
| `time` | `datetime` | 公告发布时间 |
| `url` | `text` | 公告链接地址 |
| `content` | `varchar(410)` | 公告内容详情，由上传脚本自动读取内容的前 200 字录入 |

### 2. 表名: `tapp`

**说明**: 用于存储额外的应用程序的表格。

| 字段名 | 数据类型 | 属性/备注 |
| --- | --- | --- |
| `id` | `int unsigned` | **主键**, 自增, NOT NULL |
| `app_category` | `varchar(100)` | 应用分类，如：`综合服务` |
| `name` | `varchar(100)` | 名称 |
| `app_url` | `text` | 应用链接 |
| `icon` | `text` | 图标地址 |

### 3. 表名: `user`

**说明**: 用户信息表，包含本地登录信息及关联的【福Star】信息。

| 字段名 | 数据类型 | 属性/备注 |
| --- | --- | --- |
| `id` | `int unsigned` | **主键**, 自增, NOT NULL |
| `username` | `varchar(50)` | **唯一索引** (Unique), NOT NULL 用户名，不重复 |
| `password` | `varchar(100)` | NOT NULL，经过SHA256哈希 |
| `is_bound` | `tinyint` | 默认为 '0'，0 表示未绑定账号，1 表示已绑定账号 |
| `fustar_username` | `varchar(100)` | 福Star 用户名（实际为手机号） |
| `fustar_password` | `varchar(100)` | 福Star 密码，经过AES加密，若通过二维码形式绑定账号则留空 |
| `fustar_token` | `text` | 福Star 身份令牌 |
| `create_time` | `datetime` | 创建时间 |
| `update_time` | `datetime` | 更新时间 |
| `fustar_userid` | `varchar(6)` | 福Star 用户ID |
| `fustar_sno` | `varchar(20)` | 福Star 学号 (Sno) |
