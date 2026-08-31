# Platform Integrated

基于原 `platform` 创建的集成式版本。Platform、Task、AI、Tool 仍然保持清晰的应用边界，但前端页面与后端 API 被打包进同一个 Spring Boot 运行时。

## 目录结构

```text
platform-integrated/
├─ apps/
│  ├─ platform/{frontend,backend}
│  ├─ task/{frontend,backend}
│  ├─ ai/{frontend,backend}
│  └─ tool/{frontend,backend}
├─ runtime/backend/        # 唯一 Spring Boot 启动器
├─ Dockerfile              # 四个 React 构建 + 一个 Java 构建
└─ docker-compose.yml      # 一个应用容器 + MySQL
```

四个逻辑应用继续拥有独立源码目录；统一运行时只负责聚合构建和部署，不改变已有 Controller、Service、Repository 与 API 请求结构。

## 统一入口

| 逻辑应用 | 页面地址 | API 前缀 |
| --- | --- | --- |
| Platform | `/dashboard` | `/api/apps`、`/api/dashboard`、`/api/docker` 等 |
| Task | `/task/` | `/api/tasks`、`/api/huifu` |
| AI | `/ai/` | `/api/ai` |
| Tool | `/tool/` | `/api/code`、`/api/crypto`、`/api/network` 等 |

所有地址默认使用同一个端口 `3200`，不存在跨域和独立前端服务。

## 启动

```powershell
cd D:\dev\code\ai\codex\platform-integrated
.\start.ps1
```

也可以直接执行：

```powershell
docker compose up -d --build
```

启动后访问：

- Platform：http://localhost:3200/dashboard
- Task：http://localhost:3200/task/
- AI：http://localhost:3200/ai/
- Tool：http://localhost:3200/tool/
- 模块清单：http://localhost:3200/api/integrated/modules
- 健康检查：http://localhost:3200/actuator/health

停止服务：

```powershell
docker compose stop
```

## 构建过程

Docker 多阶段构建会分别执行四个 React/Vite 构建，再将产物复制到 Spring Boot 静态资源目录：

```text
Platform UI -> static/
Task UI     -> static/task/
AI UI       -> static/ai/
Tool UI     -> static/tool/
```

随后 Maven 使用 `build-helper-maven-plugin` 聚合四个后端源码目录，生成一个 `platform-integrated.jar`。
