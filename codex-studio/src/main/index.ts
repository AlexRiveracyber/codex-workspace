import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { CodexAppServer } from "./app-server";
import type { PersistedState, ProjectInfo, RpcId, StartThreadOptions } from "../shared/types";

const execFileAsync = promisify(execFile);
const codex = new CodexAppServer();
let mainWindow: BrowserWindow | null = null;

function getStatePath(): string {
  return join(app.getPath("userData"), "state.json");
}

async function readState(): Promise<PersistedState> {
  try {
    return JSON.parse(await readFile(getStatePath(), "utf8")) as PersistedState;
  } catch {
    return { lastProject: null };
  }
}

async function saveLastProject(path: string): Promise<void> {
  const statePath = getStatePath();
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify({ lastProject: path }, null, 2), "utf8");
}

async function runGit(cwd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["-C", cwd, ...args], {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
      encoding: "utf8",
    });
    return stdout.trimEnd();
  } catch {
    return "";
  }
}

function requiredString(value: unknown, label: string, maxLength = 4096): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new TypeError(`${label} 无效`);
  }
  return value;
}

function requiredRpcId(value: unknown): RpcId {
  if (typeof value === "string") return requiredString(value, "请求 ID", 512);
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  throw new TypeError("请求 ID 无效");
}

async function loadProject(inputPath: unknown): Promise<ProjectInfo> {
  const path = resolve(requiredString(inputPath, "项目路径"));
  if (!(await stat(path)).isDirectory()) throw new TypeError("项目路径不是目录");

  const inside = await runGit(path, ["rev-parse", "--is-inside-work-tree"]);
  const isGitRepository = inside === "true";
  const branch = isGitRepository ? await runGit(path, ["branch", "--show-current"]) : "";
  const unstaged = isGitRepository ? await runGit(path, ["diff", "--no-ext-diff", "--no-color", "--unified=3"]) : "";
  const staged = isGitRepository ? await runGit(path, ["diff", "--cached", "--no-ext-diff", "--no-color", "--unified=3"]) : "";
  const status = isGitRepository ? await runGit(path, ["status", "--short", "--untracked-files=all"]) : "";
  const statusLines = status ? status.split(/\r?\n/).filter(Boolean) : [];
  const untrackedFiles = statusLines.filter((line) => line.startsWith("?? ")).map((line) => line.slice(3));
  const untrackedSummary = untrackedFiles.length > 0
    ? `# 未跟踪文件\n${untrackedFiles.map((file) => `+ ${file}`).join("\n")}`
    : "";
  await saveLastProject(path);

  return {
    path,
    name: basename(path),
    branch: branch || null,
    isGitRepository,
    diff: [staged && "# 已暂存\n" + staged, unstaged && "# 未暂存\n" + unstaged, untrackedSummary].filter(Boolean).join("\n\n"),
    changedFiles: statusLines.length,
  };
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: "#0b0d0f",
    title: "Arc Code",
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function registerIpc(): void {
  ipcMain.handle("state:get", () => readState());
  ipcMain.handle("codex:connect", () => codex.start());
  ipcMain.handle("project:pick", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: "选择代码项目",
      properties: ["openDirectory"],
    });
    return result.canceled || !result.filePaths[0] ? null : loadProject(result.filePaths[0]);
  });
  ipcMain.handle("project:load", (_event, path: unknown) => loadProject(path));
  ipcMain.handle("codex:thread:start", (_event, options: StartThreadOptions) => {
    if (!options || typeof options !== "object") throw new TypeError("线程参数无效");
    const cwd = resolve(requiredString(options.cwd, "工作目录"));
    if (!(["read-only", "workspace-write"] as const).includes(options.sandbox)) throw new TypeError("沙箱模式无效");
    if (!(["untrusted", "on-request", "never"] as const).includes(options.approvalPolicy)) throw new TypeError("审批策略无效");
    const model = options.model === undefined ? undefined : requiredString(options.model, "模型", 256);
    return codex.startThread({ ...options, cwd, model });
  });
  ipcMain.handle("codex:thread:list", (_event, cwd: unknown) => codex.listThreads(resolve(requiredString(cwd, "工作目录"))));
  ipcMain.handle("codex:thread:resume", (_event, threadId: unknown, cwd: unknown) =>
    codex.resumeThread(requiredString(threadId, "线程 ID", 512), resolve(requiredString(cwd, "工作目录"))),
  );
  ipcMain.handle("codex:turn:start", (_event, threadId: unknown, prompt: unknown) =>
    codex.startTurn(requiredString(threadId, "线程 ID", 512), requiredString(prompt, "消息", 1_000_000)),
  );
  ipcMain.handle("codex:turn:interrupt", (_event, threadId: unknown, turnId: unknown) =>
    codex.interruptTurn(requiredString(threadId, "线程 ID", 512), requiredString(turnId, "回合 ID", 512)),
  );
  ipcMain.handle("codex:request:respond", (_event, id: RpcId, result: unknown) => {
    codex.respondToServerRequest(requiredRpcId(id), result);
  });

  codex.on("event", (event) => mainWindow?.webContents.send("codex:event", event));
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => codex.stop());
