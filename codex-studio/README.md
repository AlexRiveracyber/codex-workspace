# Arc Code

Arc Code 是一个基于 Electron、React 和本地 Codex App Server 的轻量桌面编码 Agent。它不会把 shell 权限暴露给渲染页面；所有 Codex、文件夹选择和 Git 操作都经过 Electron 主进程的受限 IPC 接口。

## 当前功能

- 选择和记住本地项目目录
- 动态读取本机可用模型，并创建持久 Codex 线程
- 浏览最近任务、恢复历史消息并继续对话
- 流式显示 Agent 回复
- 展示命令、工具调用和命令输出
- 实时展示回合 diff、完整 Git diff 和未跟踪文件
- 对命令、文件修改、额外权限和 Agent 主动提问进行响应
- 默认使用 `workspace-write` 沙箱和 `on-request` 审批策略
- 中断正在执行的回合

## 环境要求

- Node.js 20 或更高版本
- 可从终端执行的 `codex` CLI
- 已登录的 Codex CLI；可以先运行 `codex` 完成登录

如果 `codex` 不在 `PATH`，启动前设置 `CODEX_BIN` 为可执行文件的绝对路径。

## 启动

```powershell
cd ../codex-studio
npm install
npm run dev
```

如果 Electron 安装包在当前网络环境下载失败，可指定镜像后重新安装二进制：

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
node node_modules/electron/install.js
```

## 验证

```powershell
npm run build
npm run smoke:protocol
npm run smoke:ui
```

`smoke:protocol` 只验证本地 App Server 的协议握手；`smoke:ui` 会启动生产构建，检查 preload 桥接、项目选择、事件流、diff、审批卡片和页面错误，并在 `artifacts/` 生成三张真实窗口截图。两者都不会向模型发送任务或产生模型调用。

## 安全模型

渲染进程启用了 `contextIsolation` 和 Chromium 沙箱，并关闭了 Node.js 集成。新线程默认只能写入所选工作区；如果 Agent 需要工作区外文件、网络或更高权限，App Server 会发起双向审批请求，界面不会自动同意。

## 协议兼容性

本项目按照 Codex App Server JSON-RPC 协议实现。协议会随 Codex CLI 更新；升级 CLI 后，可用下面的命令生成与本机版本完全一致的类型进行比对：

```powershell
codex app-server generate-ts --out ./generated-schema
```

官方文档：https://learn.chatgpt.com/docs/app-server
