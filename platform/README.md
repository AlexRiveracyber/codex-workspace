# Platform Control OS - 本地微应用与容器管控工作区

> 现代分布式多应用管理平台（前后端分离架构），基于 **Java 21 + Spring Boot 3**、**React + Vite + Tailwind CSS** 与 **MySQL 8.4**。项目运行于本地 Docker 环境，用一个清晰、高密度的工作区统一纳管、监控与调度微应用及通用容器。

---

## 🌟 核心特性

- 🖥️ **现代化高密度控制台**：深色工作区导航、轻量渐变与清晰状态层级；支持桌面收起、快捷键和移动端抽屉导航。
- ✨ **流畅的局部状态同步**：创建、编辑、部署、导入与删除无需整页刷新，统一展示非阻塞成功/失败提示，并覆盖后端离线状态。
- ⚡ **前后端分离多应用框架**：作为母平台（Parent Platform），支持挂载各种前后端分离子应用（如 `apps/task`）。
- 🐳 **本地 Docker 深度纳管**：
  - 一键启动 (Start)、停止 (Stop)、重启 (Restart) 任意受管应用或容器。
  - 实时终端流式运行日志查看器 (Live Terminal Log Viewer)。
  - 实时 CPU、内存、网络与磁盘 I/O 资源性能监控 (Live Stats Monitor)。
  - 宿主机 Docker 容器自动发现与“一键纳管” (Auto Discovery & Import)。
- 📦 **应用模板市场 (1-Click Deploy)**：
  - 预设 Nginx、Redis、PostgreSQL、RabbitMQ、MongoDB 等主流中间件模板，一键在本地 Docker 中拉起。
- 📊 **系统总览与审计日志**：
  - 实时应用健康率、容器分布、生命周期操作完整审计追踪。
- 🧩 **任务调度子应用 (Task Sub-App)**：
  - 自带独立的 `apps/task`（Java 后端 + Vue 前端），演示平台下微应用的挂载与调度管控。
- 🤖 **AI 大模型调度中心子应用 (Lumen AI)**：
  - 独立的 `apps/ai`（Java 后端 + Vue 前端），支持接入汇付天下 (Huifu) 等 AI 统一网关，管理千问、DeepSeek、万相、HappyHorse 等 29 款大模型，提供一体化智能会话、深度推理思考链、图片生成与全功能查看器（放大/缩小/旋转/下载）、视频生成与播放器、调用审计等能力。
- 🛠️ **全能开发者工具箱子应用 (Toolbox)**：
  - 独立的 `apps/tool`（Java 后端 + Vue 前端），集成 30+ 款日常高频研发工具：Base64/URL/JWT/多进制/Unicode编码转换、MD5/SHA/SM3/AES/SM4/RSA加解密与签名、强密码/UUID/雪花ID生成、JSON格式化/转Java/TypeScript、SQL DDL转实体类、Cron表达式解析与执行预测、轻量HTTP调试、端口探活、CIDR计算、代码Diff对比、正则测试、命名法转换、拾色器与二维码生成、速查表与代码片段管理。
- 🧠 **Arc Code 桌面编码 Agent**：
  - 位于同级目录 `../codex-studio` 的独立桌面应用（Electron + React），通过本地 Codex App Server 提供项目选择、流式会话、任务恢复、工具审批、Git diff 和工作区沙箱。

---

## 🏗️ 整体架构目录

```text
platform/
├── apps/                            # 统一收敛所有前后端应用与服务 (All Applications)
│   ├── platform/                    # 🌟 Platform 核心管控主基座
│   │   ├── backend/                 # Platform 后端 (Java 21 + Spring Boot 3, 宿主机端口: 8090)
│   │   │   ├── Dockerfile
│   │   │   ├── pom.xml
│   │   │   └── src/
│   │   └── frontend/                # Platform 控制台前端 (React + Vite + Tailwind, 宿主机端口: 3100)
│   │       ├── Dockerfile
│   │       ├── nginx.conf
│   │       ├── package.json
│   │       └── src/
│   │
│   ├── task/                        # 任务调度中心子应用 (前后端分离)
│   │   ├── backend/                 # Task 后端 (Java 21 + Spring Boot 3, 宿主机端口: 8082)
│   │   └── frontend/                # Task 前端 (Vue 3 + Vite, 宿主机端口: 3002)
│   │
│   ├── ai/                          # AI 大模型调度与创作中心 (前后端分离)
│   │   ├── backend/                 # AI 后端 (Java 21 + Spring Boot 3, 宿主机端口: 8083)
│   │   └── frontend/                # AI 前端 (Vue 3 + Vite, 宿主机端口: 3003)
│   │
│   └── tool/                        # 全能开发者工具箱 (前后端分离)
│       ├── backend/                 # Tool 后端 (Java 21 + Spring Boot 3, 宿主机端口: 8084)
│       └── frontend/                # Tool 前端 (Vue 3 + Vite, 宿主机端口: 3004)
│
├── docker-compose.yml               # 本地一键编排启动文件 (MySQL + Platform + Task + AI + Tool)
├── init-db.sql                      # MySQL 初始建表与种子数据 (含预置 Huifu 与 29 款大模型)
├── start.ps1                        # Windows 一键启动辅助脚本
└── README.md
```

---

## 🚀 端口与服务规划

| 服务名称 | 模块路径 | 容器端口 | 宿主机端口 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **MySQL 8.4** | `platform-mysql` | `3306` | `3306` | 平台核心元数据库 |
| **Platform API** | `apps/platform/backend/` | `8080` | `8090` | 平台核心管控 RESTful 后端 |
| **Platform UI** | `apps/platform/frontend/` | `3000` | `3100` | 平台精美 Web 管理控制台 |
| **Task API** | `apps/task/backend/` | `8082` | `8082` | 任务调度子应用后端服务 |
| **Task UI** | `apps/task/frontend/` | `80` | `3002` | 任务调度子应用前端界面 |
| **AI API** | `apps/ai/backend/` | `8083` | `8083` | AI 大模型网关与调度后端服务 |
| **AI UI** | `apps/ai/frontend/` | `80` | `3003` | AI 大模型多模态会话与创作控制台 |
| **Tool API** | `apps/tool/backend/` | `8084` | `8084` | 开发者工具箱后端服务 |
| **Tool UI** | `apps/tool/frontend/` | `80` | `3004` | 开发者工具箱前端界面 |

---

## 💻 快速启动指南

### 方式一：Docker Compose 一键启动全部服务（推荐）

在 Windows 中可直接运行一键启动脚本。脚本会自动查找并唤醒 Docker Desktop，等待引擎就绪后构建全部服务：

```powershell
.\start.ps1
```

也可以在 `platform` 项目根目录手动执行：

```powershell
docker compose up -d --build
```

启动完成后，打开浏览器访问：
- **Platform 主控制台**: [http://localhost:3100](http://localhost:3100)
- **Lumen AI 子应用界面**: [http://localhost:3003](http://localhost:3003)
- **Task 子应用界面**: [http://localhost:3002](http://localhost:3002)
- **Tool 子应用界面**: [http://localhost:3004](http://localhost:3004)
- **Platform 后端健康检查**: [http://localhost:8090/actuator/health](http://localhost:8090/actuator/health)

如需调整端口或本地数据库凭据，将 `.env.example` 复制为 `.env` 后修改。完整变量说明见 [运行配置](docs/configuration/application-configuration.md)。

---

### 方式二：本地开发调试模式

1. **启动 MySQL 数据库容器**：
   ```powershell
   docker compose up -d platform-mysql
   ```

2. **启动 Platform 后端服务**：
   ```powershell
   cd apps/platform/backend
   mvn spring-boot:run
   ```

3. **启动 Platform 前端服务**：
   ```powershell
   cd apps/platform/frontend
   npm install
   npm run dev
   ```
   前端本地开发地址为：`http://localhost:3000`。

4. **启动 Arc Code 桌面应用（可选）**：
   ```powershell
   cd ../codex-studio
   npm install
   npm run dev
   ```
   需要预先安装并登录可从终端执行的 `codex` CLI。桌面应用与 `platform` 同级，完整说明和验证命令见 [`codex-studio/README.md`](../codex-studio/README.md)。

---

## 🔌 添加新的子应用指南

在 `apps/` 目录下新增子应用，例如 `apps/workflow`：
1. 建立 `apps/workflow/backend`（后端）与 `apps/workflow/frontend`（前端）。
2. 在 `docker-compose.yml` 中添加该子应用的服务定义。
3. 在 `Platform` 控制台的“所有应用”或 `init-db.sql` 中注册该应用即可通过 Platform 进行统一生命周期管控。
