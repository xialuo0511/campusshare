# CampusShare

校园资源共享/交易平台（CampusShare）后端仓库。

## 项目简介

CampusShare 面向校内学生与教师，统一承载以下三类业务：

1. 二手交易
2. 学习资料共享
3. 组队协作

首期聚焦三条主线：`注册审核`、`资源流转`、`平台治理`。

## 首期功能范围（V1.0）

1. 用户注册、登录与注册审核
2. 个人资料、积分与角色权限管理
3. 卖家认证申请与审核
4. 商品发布、编辑、下架
5. 资源浏览、搜索、筛选与详情展示
6. 订单创建、取消、确认、完成与关闭
7. 学习资料上传、下载与积分结算
8. 组队需求发布、申请与审批
9. 评论、评分与信用展示
10. 举报、内容审核与处置
11. 站内消息和邮件通知
12. 后台规则配置、管理与运营能力

## 首期明确不做

1. 在线支付、退款与担保交易
2. 小程序和移动 H5 专项适配
3. OCR / 图像识别 / AI 风险识别
4. 学校统一身份认证接入
5. 学校竞赛管理系统接入
6. 即时聊天和物流配送

## 关键业务规则

1. 仅审核通过用户可产生核心业务数据。
2. 一件商品同一时刻只能有一个有效订单。
3. 发布者不能购买自己的商品。
4. 资料下载采用积分结算，不支持付费下载。
5. 举报必须人工审核闭环并留痕。
6. 评价必须与真实交互绑定。
7. 组队需求必须设置截止时间，到期自动关闭。

## 技术栈

1. Java 17
2. Spring Boot 3.5.12
3. MyBatis Spring Boot Starter 3.0.5
4. MySQL 8.x（`mysql-connector-j`）
5. Redis（后续开发必用，缓存 / 验证码 / 限流 / 异步任务）
6. Spring Security（认证与鉴权）
7. Spring Validation（参数校验）

## 当前开发状态

当前仓库已完成首批核心闭环并可联调：

1. 用户注册登录、邮箱验证码、管理员审核
2. 商品发布/列表/详情、下单与订单状态流转
3. 学习资料上传下载、积分流水与通知
4. 招募发布申请审批、后台待办聚合
5. 商品收藏、评论、举报闭环
6. 前端核心页面已接入真实接口（登录、市场、详情、发布、招募、后台、订单）
7. 会话登出、会话失效回跳、前端统一超时/网络异常兜底

## 目录结构

```text
campusshare
├─ src/main/java/com/xialuo/campusshare
│  ├─ entity        # 领域实体
│  ├─ enums         # 状态与类型枚举
│  └─ CampusshareApplication.java
├─ src/main/resources
│  └─ application.properties
├─ src/test/java/com/xialuo/campusshare
│  └─ CampusshareApplicationTests.java
└─ pom.xml
```

## 快速开始

1. 准备环境：JDK 17、Maven 3.9+、MySQL 8.x、Redis
2. 创建数据库：`campusshare`
3. 设置环境变量（或直接用默认值启动）：

```bash
set SPRING_PROFILES_ACTIVE=dev
set DATASOURCE_URL=jdbc:mysql://localhost:3306/campusshare?useSSL=false^&serverTimezone=Asia/Shanghai^&characterEncoding=utf8
set DATASOURCE_USERNAME=root
set DATASOURCE_PASSWORD=你的密码
set REDIS_HOST=localhost
set REDIS_PORT=6379
```

4. 开发环境默认会执行建表脚本（`spring.sql.init.mode=always`）
5. 编译项目：

```bash
mvn -DskipTests compile
```

6. 启动项目：

```bash
mvn spring-boot:run
```

7. 打开首页：
   - `http://localhost:8080/`

## 关键环境变量

1. 服务端口：`SERVER_PORT`（默认 `8080`）
2. 运行环境：`SPRING_PROFILES_ACTIVE`（`dev` / `prod`）
3. 数据库：
   - `DATASOURCE_URL`
   - `DATASOURCE_USERNAME`
   - `DATASOURCE_PASSWORD`
4. Redis：
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`
5. SQL 初始化：
   - `SPRING_SQL_INIT_MODE`（开发建议 `always`，生产建议 `never`）
6. 邮件通知：
   - `MAIL_HOST`
   - `MAIL_PORT`
   - `MAIL_USERNAME`
   - `MAIL_PASSWORD`
   - `MAIL_SMTP_AUTH`
   - `MAIL_SMTP_STARTTLS_ENABLE`
7. 注册验证码邮件：
   - `REGISTER_CODE_MAIL_FROM`
   - `REGISTER_CODE_LOG_ENABLED`（生产建议 `false`）

## 健康检查

提供公共接口：

1. `GET /api/v1/system/health`

返回项包含：

1. 总体状态 `overallStatus`
2. 数据库状态 `databaseStatus`
3. Redis状态 `redisStatus`
4. 当前环境 `environment`
5. 检查时间 `checkTime`

## 默认接口限流（Redis）

1. `POST /api/v1/users/login`：1分钟最多10次（按 IP）
2. `POST /api/v1/users/register/code/send`：10分钟最多5次（按 IP）
3. `POST /api/v1/users/register`：10分钟最多10次（按 IP）

## 会话与登录态

1. 登录接口：`POST /api/v1/users/login`
2. 登出接口：`POST /api/v1/users/logout`（服务端删除 Redis 会话）
3. 当前用户资料接口：`GET /api/v1/users/me/profile`
4. 前端请求默认超时：15秒
5. 会话失效时（`code=1002`）前端自动清理本地会话并跳转登录页

## 文件访问

1. 公开文件访问接口：`GET /api/v1/files/{fileId}`
2. 适用于商品图片预览与通用静态文件直链展示

## Docker 部署（推荐预上线联调）

1. 复制环境文件：

```bash
cd deploy
copy .env.example .env
```

2. 根据实际环境修改 `.env`：
   - 必须修改 `MYSQL_ROOT_PASSWORD`，不要使用示例密码。
   - 首次部署如需自动建表，可临时设置 `SPRING_SQL_INIT_MODE=always`；完成初始化后建议改回 `never`。
   - `MATERIAL_STORAGE_ROOT` 是资料附件持久化目录，Docker Compose 已挂载为 `material_files` 卷，容器重建后文件仍应保留。
   - 未配置 SMTP 时，关键业务通知以站内信为最低闭环；需要邮件真实投递时补齐 `MAIL_*` 配置。
3. 启动：

```bash
docker compose --env-file .env -f docker-compose.yml up -d --build
```

4. 访问：
   - `http://localhost:${APP_PORT}`

## 非功能目标（来自 SRS）

1. 支持不少于 500 名并发在线用户
2. 普通列表/详情接口 95% 响应时间不超过 3 秒
3. 复杂检索不超过 5 秒
4. 搜索首屏展示不超过 2 秒
5. 100MB 内文件支持上传进度与失败重试

## 开发规范

1. 类名、方法名使用大驼峰。
2. 变量使用小驼峰。
3. 常量使用全大写。
4. 提交信息格式：`fix:中文说明`

## 说明

`Document/` 目录用于本地需求与进度文档管理，已默认加入 `.gitignore`，不纳入仓库版本管理。
