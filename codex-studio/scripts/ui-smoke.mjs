import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { _electron as electron } from "playwright";

const artifacts = resolve("artifacts");
const screenshotPath = resolve(artifacts, "ui-smoke.png");
const projectScreenshotPath = resolve(artifacts, "ui-project.png");
const agentScreenshotPath = resolve(artifacts, "ui-agent.png");
await mkdir(artifacts, { recursive: true });
const isolatedProfile = resolve(artifacts, `profile-${process.pid}-${Date.now()}`);
await mkdir(isolatedProfile, { recursive: true });

const errors = [];
const electronApp = await electron.launch({ args: [".", `--user-data-dir=${isolatedProfile}`], cwd: process.cwd() });

try {
  const window = await electronApp.firstWindow();
  window.on("pageerror", (error) => errors.push(error.message));
  window.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await window.waitForLoadState("domcontentloaded");
  try {
    await window.waitForFunction(() => document.body.innerText.includes("本地运行"), null, { timeout: 20_000 });
  } catch {
    errors.push("Codex connection did not reach the connected state within 20 seconds.");
  }

  const result = await window.evaluate(() => ({
    title: document.title,
    heading: document.querySelector("h1")?.textContent?.trim() ?? "",
    hasDesktopApi: typeof window.codexDesktop?.connect === "function",
    isConnected: document.body.innerText.includes("本地运行"),
    visibleText: document.body.innerText.slice(0, 600),
    bodySize: { width: document.body.clientWidth, height: document.body.clientHeight },
  }));
  await window.screenshot({ path: screenshotPath });

  await electronApp.evaluate(({ dialog }, projectPath) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [projectPath], bookmarks: [] });
  }, process.cwd());
  await window.getByRole("button", { name: "选择项目", exact: true }).click();
  await window.getByRole("heading", { name: "今天想构建什么？" }).waitFor({ timeout: 10_000 });
  await window.screenshot({ path: projectScreenshotPath });

  const projectReady = await window.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent?.trim() ?? "",
    hasStarterPrompts: document.querySelectorAll(".starter-grid button").length === 3,
    projectName: document.querySelector(".project-heading")?.textContent?.trim() ?? "",
  }));

  await electronApp.evaluate(({ BrowserWindow }) => {
    const target = BrowserWindow.getAllWindows()[0];
    const emit = (payload) => target.webContents.send("codex:event", payload);
    emit({ kind: "notification", message: { method: "turn/started", params: { turn: { id: "visual-turn" } } } });
    emit({ kind: "notification", message: { method: "item/agentMessage/delta", params: { itemId: "visual-agent", delta: "我已经检查了项目。接下来会运行测试，并把所有修改保留在工作区沙箱中。" } } });
    emit({ kind: "notification", message: { method: "item/started", params: { item: { type: "commandExecution", id: "visual-command", command: "npm run test", cwd: "C:/workspace", status: "inProgress", aggregatedOutput: null } } } });
    emit({ kind: "notification", message: { method: "item/commandExecution/outputDelta", params: { itemId: "visual-command", delta: "> running tests…\n" } } });
    emit({ kind: "notification", message: { method: "turn/diff/updated", params: { diff: "diff --git a/src/app.ts b/src/app.ts\n--- a/src/app.ts\n+++ b/src/app.ts\n@@ -1,1 +1,2 @@\n export const ready = true;\n+export const polished = true;" } } });
    emit({ kind: "request", message: { method: "item/commandExecution/requestApproval", id: "visual-approval", params: { command: "npm run test", reason: "验证项目修改" } } });
  });
  await window.getByText("允许执行命令？").waitFor({ timeout: 5_000 });
  await window.screenshot({ path: agentScreenshotPath });

  const agentReady = await window.evaluate(() => ({
    hasAgentMessage: document.body.innerText.includes("我已经检查了项目"),
    hasApproval: document.body.innerText.includes("允许执行命令？"),
    hasDiff: document.body.innerText.includes("polished = true"),
  }));

  if (!result.hasDesktopApi) errors.push("Preload API is unavailable in the renderer.");
  if (!result.heading) errors.push("The primary heading is missing.");
  if (!projectReady.hasStarterPrompts) errors.push("Project starter prompts are missing.");
  if (!agentReady.hasAgentMessage || !agentReady.hasApproval || !agentReady.hasDiff) errors.push("Agent event rendering is incomplete.");
  if (errors.length > 0) throw new Error(errors.join("\n"));

  console.log(JSON.stringify({ ...result, projectReady, agentReady, screenshotPath, projectScreenshotPath, agentScreenshotPath }, null, 2));
} finally {
  await electronApp.close();
}
