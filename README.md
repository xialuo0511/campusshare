# CampusShare

CampusShare 是一个面向校内学生与教师的校园二手交易、学习资料共享和组队协作平台。项目基于 Java 17、Spring Boot、MyBatis、MySQL、Redis 和静态 Web 页面实现，首期目标是完成可演示、可验收的桌面 Web 端核心闭环。

## 项目简介

CampusShare 聚焦校内可信身份场景，统一承载三类核心业务：

1. 二手交易：商品发布、审核、浏览、下单、线下交付、完成、评论评分。
2. 学习资料共享：资料上传、审核、下载、积分扣减、积分流水、收藏。
3. 组队协作：招募发布、审核、申请、审批、关闭。

平台同时提供站内通知、邮件任务、举报治理、后台审核、规则配置、审计日志和运行状态检查能力。

## 当前状态

当前代码主干已经完成首期核心功能闭环，并已接入用户端统一工作台和后台管理界面。最近一次安全扫描问题已经完成修复，包含 Redis 生产安全、会话签名、资料文件下载授权、BCrypt 密码哈希、限流策略和异常信息泄露收敛。

已覆盖的主要能力：

1. 用户注册、QQ 邮箱验证码、登录、登出、管理员审核、头像审核。
2. 个人资料、积分余额、积分流水、卖家认证申请和审核。
3. 商品发布、编辑、下架、管理员审核、商品列表、详情、收藏、评论。
4. 订单创建、卖家确认、线下交付、买家完成、取消、关闭、终态展示。
5. 学习资料文件上传、资料提交、管理员审核、公开列表、详情、下载、积分结算、通知。
6. 组队招募发布、审核、申请、申请审批、关闭。
7. 举报提交、管理员处置、冻结用户、强制下架资源、审计留痕。
8. 用户端工作台：我的发布、订单中心、组队招募、消息通知、个人设置等子界面。
9. 后台仪表盘：用户审核、卖家认证、商品/资料/招募审核、举报治理、规则配置、运行状态。
10. Docker 部署模板、文件持久化挂载、健康检查和 QQ 邮箱 SMTP 配置模板。

> `Document/` 目录用于本地需求、设计、验收和开发进度记录，不纳入仓库提交范围。

## 技术栈

| 类型 | 技术 |
|---|---|
| 运行环境 | Java 17 |
| 后端框架 | Spring Boot 3.5.12 |
| Web/API | Spring Web |
| 持久层 | MyBatis Spring Boot Starter 3.0.5 |
| 数据库 | MySQL 8.x |
| 缓存/会话/限流 | Redis |
| 安全基础 | Spring Security、自定义 Redis Token 会话过滤器 |
| 参数校验 | Spring Validation |
| 邮件 | Spring Mail，支持 QQ 邮箱 SMTP |
| 前端 | 静态 HTML + CSS + JavaScript |
| 测试 | JUnit 5、Spring Boot Test、MyBatis Test、H2 |
| 部署 | Dockerfile、Docker Compose |

## 目录结构

```text
campusshare
├─ deploy/                         # Docker Compose 与环境变量模板
├─ src/main/java/com/xialuo/campusshare
│  ├─ common/                       # 通用响应、过滤器、拦截器、异常处理、配置
│  ├─ entity/                       # 数据实体
│  ├─ enums/                        # 状态与类型枚举
│  └─ module/                       # 业务模块
│     ├─ admin/                     # 后台概览、规则、审计、运维状态
│     ├─ governance/                # 举报治理
│     ├─ material/                  # 学习资料与文件
│     ├─ notification/              # 站内信与邮件任务
│     ├─ order/                     # 订单
│     ├─ point/                     # 积分流水
│     ├─ resource/                  # 商品、收藏、评论
│     ├─ statistics/                # 首页总览、健康检查
│     ├─ team/                      # 组队招募
│     └─ user/                      # 用户、头像、卖家认证
├─ src/main/resources
│  ├─ mapper/                       # MyBatis XML
│  ├─ sql/                          # 初始化 SQL 脚本
│  ├─ static/                       # 前端页面
│  ├─ application.properties
│  ├─ application-local.properties
│  ├─ application-dev.properties
│  └─ application-prod.properties
├─ src/test/java/                   # 自动化测试
├─ Dockerfile
└─ pom.xml
```

## 快速启动

### 1. 准备环境

本地开发需要：

1. JDK 17
2. Maven 3.9+
3. MySQL 8.x
4. Redis 7.x

### 2. 创建数据库

```sql
CREATE DATABASE campusshare DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 3. 设置环境变量

PowerShell 示例：

```powershell
$env:SPRING_PROFILES_ACTIVE = "local"
$env:DATASOURCE_URL = "jdbc:mysql://localhost:3306/campusshare?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8"
$env:DATASOURCE_USERNAME = "root"
$env:DATASOURCE_PASSWORD = "你的MySQL密码"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"
$env:REDIS_PASSWORD = ""
$env:SESSION_SIGNING_SECRET = "local-session-signing-secret"
```

默认 profile 为 `local`，会执行 SQL 初始化脚本。重复启动时脚本使用 `IF NOT EXISTS` 和可重复初始化策略，适合本地联调；生产环境请使用 `prod`，默认不自动初始化 SQL。

### 4. 编译与测试

```powershell
mvn -q test
mvn -q -DskipTests compile
```

### 5. 启动项目

```powershell
mvn spring-boot:run
```

访问：

```text
http://localhost:8080/
```

主要页面：

| 页面 | 地址 |
|---|---|
| 首页 | `/pages/market_overview.html` |
| 登录/注册 | `/pages/auth_access.html` |
| 用户工作台 | `/pages/user_workspace.html` |
| 商品/资料/论坛入口 | `/pages/market_listing.html` |
| 发布页面 | `/pages/publish_create.html` |
| 订单中心 | `/pages/user_workspace.html?target=%2Fpages%2Forder_center.html` |
| 消息中心 | `/pages/user_workspace.html?target=%2Fpages%2Fnotification_center.html` |
| 后台仪表盘 | `/pages/admin_dashboard.html` |
| 后台批量审核 | `/pages/admin_batch_review.html` |

## Docker 部署

### 1. 复制环境变量模板

```powershell
cd deploy
copy .env.example .env
```

### 2. 修改 `.env`

必须修改：

```env
MYSQL_ROOT_PASSWORD=替换为强密码
REDIS_PASSWORD=替换为强密码
SESSION_SIGNING_SECRET=替换为随机长密钥
```

可按需修改：

```env
APP_PORT=8080
MYSQL_PORT=3306
MYSQL_DATABASE=campusshare
SPRING_SQL_INIT_MODE=never
MATERIAL_STORAGE_ROOT=/data/campusshare/material-files
TRUST_FORWARDED_HEADERS=false
```

说明：

1. Redis 在 Docker Compose 中强制启用密码，并且不再映射到宿主机端口。
2. `SESSION_SIGNING_SECRET` 用于 Redis 会话值 HMAC 签名，生产环境不能使用示例值。
3. `TRUST_FORWARDED_HEADERS=true` 只应在可信反向代理已经清洗 `X-Forwarded-For` 等头之后启用。
4. 首次部署如需自动建表，可临时设置 `SPRING_SQL_INIT_MODE=always`；初始化完成后建议改回 `never`。
5. 资料文件挂载到 `material_files` 卷，容器重建后文件仍应保留。

### 3. 启动

```powershell
docker compose --env-file .env -f docker-compose.yml up -d --build
```

访问：

```text
http://localhost:${APP_PORT}
```

## QQ 邮箱 SMTP

项目支持 QQ 邮箱作为验证码和业务邮件发件通道。

推荐配置：

```env
MAIL_HOST=smtp.qq.com
MAIL_PORT=465
MAIL_USERNAME=你的QQ邮箱@qq.com
MAIL_PASSWORD=QQ邮箱SMTP授权码
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS_ENABLE=false
MAIL_SMTP_SSL_ENABLE=true
MAIL_DISPATCH_FROM=你的QQ邮箱@qq.com
REGISTER_CODE_MAIL_FROM=你的QQ邮箱@qq.com
```

如果暂不启用真实邮件投递：

```env
MAIL_DISPATCH_ENABLED=false
MAIL_DISPATCH_SCHEDULER_ENABLED=false
REGISTER_CODE_LOG_ENABLED=false
```

此时关键业务通知仍以站内信作为最低闭环。

启用真实邮件投递时：

```env
MAIL_DISPATCH_ENABLED=true
MAIL_DISPATCH_SCHEDULER_ENABLED=true
REGISTER_CODE_LOG_ENABLED=false
```

注意：`MAIL_PASSWORD` 必须填写 QQ 邮箱生成的 SMTP 授权码，不是 QQ 登录密码。

## 核心 API

### 用户

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/v1/users/register/code/send` | 发送注册验证码 |
| `POST` | `/api/v1/users/register` | 注册 |
| `POST` | `/api/v1/users/login` | 登录 |
| `POST` | `/api/v1/users/logout` | 登出 |
| `GET` | `/api/v1/users/me/profile` | 当前用户资料 |
| `PUT` | `/api/v1/users/{userId}/profile` | 更新个人资料 |
| `POST` | `/api/v1/users/{userId}/avatar` | 上传头像进入审核 |
| `POST` | `/api/v1/users/seller-verifications` | 提交卖家认证 |

### 商品与订单

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/v1/products` | 商品列表 |
| `GET` | `/api/v1/products/{productId}` | 商品详情 |
| `POST` | `/api/v1/products` | 发布商品 |
| `PUT` | `/api/v1/products/{productId}` | 编辑商品 |
| `POST` | `/api/v1/products/{productId}/offline` | 用户下架商品 |
| `POST` | `/api/v1/orders` | 创建订单 |
| `GET` | `/api/v1/orders/my` | 我的订单 |
| `GET` | `/api/v1/orders/{orderId}` | 订单详情 |
| `POST` | `/api/v1/orders/{orderId}/confirm` | 卖家确认 |
| `POST` | `/api/v1/orders/{orderId}/handover` | 线下交付 |
| `POST` | `/api/v1/orders/{orderId}/complete` | 买家完成 |
| `POST` | `/api/v1/orders/{orderId}/cancel` | 取消订单 |
| `POST` | `/api/v1/orders/{orderId}/close` | 关闭订单 |

### 学习资料

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/v1/materials/files/upload` | 上传资料文件 |
| `POST` | `/api/v1/materials` | 提交资料 |
| `GET` | `/api/v1/materials/public` | 公开资料列表 |
| `GET` | `/api/v1/materials/my` | 我的资料 |
| `GET` | `/api/v1/materials/{materialId}` | 资料详情 |
| `POST` | `/api/v1/materials/{materialId}/download` | 下载授权、积分结算、返回短期文件票据 |
| `GET` | `/api/v1/materials/{materialId}/files/{fileId}` | 使用短期票据下载资料文件 |
| `GET` | `/api/v1/files/{fileId}` | 仅公开访问已发布商品图片 |

### 组队、通知、收藏、治理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/v1/team/recruitments` | 招募列表 |
| `POST` | `/api/v1/team/recruitments` | 发布招募 |
| `POST` | `/api/v1/team/recruitments/{recruitmentId}/apply` | 申请加入 |
| `GET` | `/api/v1/notifications` | 我的通知 |
| `POST` | `/api/v1/notifications/{notificationId}/read` | 标记单条已读 |
| `POST` | `/api/v1/notifications/read/all` | 全部标记已读 |
| `GET` | `/api/v1/favorites/products/my` | 我的商品收藏 |
| `GET` | `/api/v1/favorites/materials/my` | 我的资料收藏 |
| `POST` | `/api/v1/reports` | 提交举报 |

### 管理后台

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/v1/admin/dashboard/summary` | 后台统计 |
| `GET` | `/api/v1/admin/ops/summary` | 运行状态 |
| `GET` | `/api/v1/admin/users/pending` | 待审核用户 |
| `POST` | `/api/v1/admin/users/{userId}/review` | 审核用户 |
| `GET` | `/api/v1/admin/users/avatars/pending` | 待审核头像 |
| `POST` | `/api/v1/admin/users/{userId}/avatar/review` | 审核头像 |
| `GET` | `/api/v1/admin/products/pending` | 待审核商品 |
| `POST` | `/api/v1/admin/products/{productId}/review` | 审核商品 |
| `GET` | `/api/v1/admin/materials/pending` | 待审核资料 |
| `POST` | `/api/v1/admin/materials/{materialId}/review` | 审核资料 |
| `GET` | `/api/v1/admin/team/recruitments/pending` | 待审核招募 |
| `POST` | `/api/v1/admin/team/recruitments/{recruitmentId}/review` | 审核招募 |
| `GET` | `/api/v1/admin/reports/pending` | 待处理举报 |
| `POST` | `/api/v1/admin/reports/{reportId}/review` | 处置举报 |
| `GET` | `/api/v1/admin/rules` | 规则配置 |
| `POST` | `/api/v1/admin/rules/{ruleKey}` | 更新规则 |
| `GET` | `/api/v1/admin/audit/logs` | 审计日志 |

## 安全设计

1. Redis Token 会话值使用 HMAC 签名，服务端不再信任裸 `userId` 映射。
2. 密码使用 BCrypt 哈希；历史 SHA-256 加盐哈希可登录兼容并自动迁移。
3. 生产环境启动时强制校验 Redis 密码、会话签名密钥、数据库密码和验证码日志配置。
4. 资料附件必须先走下载接口完成积分结算并获取短期票据，避免公开直链绕过扣分。
5. 登录、注册、验证码接口基于 Redis 限流；Redis 限流异常时关键入口 fail-closed。
6. 默认不信任客户端传入的 `X-Forwarded-For`，需可信代理时显式开启。
7. 未知异常对客户端返回通用错误文案，详细异常只写服务端日志。
8. 前端 Token 使用 `sessionStorage`，并自动清理旧版 `localStorage` Token。

## 健康检查

公共接口：

```text
GET /api/v1/system/health
```

返回内容包含：

1. `overallStatus`
2. `databaseStatus`
3. `redisStatus`
4. `environment`
5. `checkTime`

## 测试

运行全部测试：

```powershell
mvn -q test
```

当前测试覆盖重点包括：

1. 会话鉴权与管理员路径限制。
2. BCrypt 与旧密码哈希兼容。
3. 商品发布、审核和角色限制。
4. 订单状态机与越权边界。
5. 资料积分扣减、余额不足、未发布资料拒绝下载。
6. 文件上传类型、大小和路径安全。
7. 组队招募申请和审核边界。
8. 举报治理、冻结用户、资源强制下架。

## 业务边界

首期明确不做：

1. 在线支付、退款、担保交易。
2. 即时聊天。
3. 物流配送。
4. 小程序和移动端专项适配。
5. 学校统一身份认证接入。
6. OCR、图像识别、AI 风险识别。
7. 独立完整论坛系统。当前“校园论坛”作为校园交流/招募入口，不等同于完整帖子板块系统。

## 开发规范

1. Java 代码遵循当前项目既有命名与分层风格。
2. Controller 返回统一 `ApiResponse`。
3. 业务异常使用 `BusinessException` 和 `BizCodeEnum`。
4. MyBatis 查询使用 `#{}` 参数绑定，避免字符串拼接 SQL。
5. 新增业务逻辑优先补充聚焦测试。
6. 提交信息格式使用英文前缀，例如 `fix:xxx`、`update:xxx`、`docs:xxx`、`test:xxx`。

## 上线前检查

上线前至少确认：

1. `.env` 中 `MYSQL_ROOT_PASSWORD`、`REDIS_PASSWORD`、`SESSION_SIGNING_SECRET` 已替换为真实强值。
2. `SPRING_PROFILES_ACTIVE=prod`。
3. 首次建表策略已确认，生产初始化完成后 `SPRING_SQL_INIT_MODE=never`。
4. 资料文件持久化目录或卷可备份、可恢复。
5. QQ 邮箱 SMTP 或“站内信最低闭环”上线口径已确认。
6. 注册、审核、发布、下单、完成、资料下载积分、通知、后台处置链路已完成验收。
7. `GET /api/v1/system/health` 返回正常。
