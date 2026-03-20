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
2. Spring Boot 3.x
3. MyBatis
4. MySQL 8.x
5. Redis（可选）

## 当前开发状态

当前仓库处于基础搭建阶段，已完成：

1. Spring Boot 工程初始化
2. 基础领域实体类（User、Resource、Order、Report、Point 等）骨架
3. 基础业务枚举（角色、状态、通知类型、积分流水类型等）定义

尚未完成：

1. 数据库建表脚本与 Mapper/XML
2. 业务 Service 与接口 Controller
3. 权限体系落地（RBAC 细化）
4. 单元测试与集成测试

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

1. 准备环境：JDK 17、Maven 3.9+、MySQL 8.x
2. 创建数据库：`campusshare`
3. 修改配置：`src/main/resources/application.properties`
4. 编译项目：

```bash
mvn -DskipTests compile
```

5. 启动项目：

```bash
mvn spring-boot:run
```

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
