# Platform 运行配置

项目使用 Docker Compose 读取根目录下可选的 `.env` 文件。没有 `.env` 时会使用适合本地开发的默认值；需要更换端口或凭据时，复制 `.env.example` 为 `.env` 后修改。

## Docker Compose 环境变量

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `PLATFORM_DB_NAME` | `platform_db` | 四个后端共享的 MySQL 数据库名 |
| `PLATFORM_DB_PASSWORD` | `root123456` | 本地 MySQL root 密码及后端连接密码；对外共享环境必须修改 |
| `MYSQL_PORT` | `3306` | MySQL 暴露到宿主机的端口 |
| `PLATFORM_API_PORT` | `8090` | 主平台 API 端口 |
| `PLATFORM_UI_PORT` | `3100` | 主控制台端口 |
| `TASK_API_PORT` / `TASK_UI_PORT` | `8082` / `3002` | Task Studio 后端与界面端口 |
| `AI_API_PORT` / `AI_UI_PORT` | `8083` / `3003` | AI Studio 后端与界面端口 |
| `TOOL_API_PORT` / `TOOL_UI_PORT` | `8084` / `3004` | DevTools 后端与界面端口 |

## 后端数据库参数

所有 Spring Boot 服务支持以下运行时变量，Docker Compose 会自动传入：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DB_HOST` | `localhost` | MySQL 主机；容器内为 `platform-mysql` |
| `DB_PORT` | `3306` | MySQL 端口 |
| `DB_NAME` | `platform_db` | 数据库名 |
| `DB_USER` | `root` | 数据库用户 |
| `DB_PASSWORD` | `root123456` | 数据库密码 |

本项目默认配置仅面向本机开发环境。不要将默认密码用于公网、共享服务器或生产环境。

## 一键启动脚本

`start.ps1` 会自动检测 Docker 引擎；未启动时会在常见安装位置查找 Docker Desktop，并等待最多 120 秒。默认会重新构建镜像；已完成构建时可使用：

```powershell
.\start.ps1 -SkipBuild
```
