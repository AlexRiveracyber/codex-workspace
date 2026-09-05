import { EventEmitter } from "node:events";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface, type Interface } from "node:readline";
import type {
  AppServerEvent,
  ModelOption,
  RpcId,
  RpcMessage,
  RuntimeInfo,
  StartThreadOptions,
  ThreadHistory,
  ThreadSummary,
} from "../shared/types";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export class CodexAppServer extends EventEmitter {
  private process: ChildProcessWithoutNullStreams | null = null;
  private lines: Interface | null = null;
  private requestId = 1;
  private pending = new Map<RpcId, PendingRequest>();
  private startPromise: Promise<RuntimeInfo> | null = null;

  start(): Promise<RuntimeInfo> {
    if (this.startPromise) return this.startPromise;
    this.startPromise = this.doStart().catch((error) => {
      this.startPromise = null;
      throw error;
    });
    return this.startPromise;
  }

  private async doStart(): Promise<RuntimeInfo> {
    this.emitEvent({ kind: "state", state: "starting", detail: "正在启动 Codex App Server" });

    const executable = process.env.CODEX_BIN?.trim() || "codex";
    const child = spawn(executable, ["app-server", "--listen", "stdio://"], {
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    this.process = child;

    child.once("error", (error) => {
      this.emitEvent({ kind: "state", state: "error", detail: error.message });
      this.rejectAll(error);
    });

    child.once("exit", (code, signal) => {
      const detail = `Codex App Server 已退出（code=${code ?? "null"}, signal=${signal ?? "null"}）`;
      this.emitEvent({ kind: "state", state: code === 0 ? "disconnected" : "error", detail });
      this.rejectAll(new Error(detail));
      this.cleanupProcess();
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      const detail = chunk.trim();
      if (detail) this.emitEvent({ kind: "log", detail });
    });

    this.lines = createInterface({ input: child.stdout });
    this.lines.on("line", (line) => this.handleLine(line));

    const response = (await this.request("initialize", {
      clientInfo: {
        name: "arc_code",
        title: "Arc Code",
        version: "0.1.0",
      },
      capabilities: {
        experimentalApi: false,
        requestAttestation: false,
        mcpServerOpenaiFormElicitation: false,
        optOutNotificationMethods: null,
        extensions: null,
      },
    })) as { userAgent?: string };

    this.notify("initialized");
    const [modelResult, accountResult] = await Promise.all([
      this.request("model/list", { cursor: null, limit: 50, includeHidden: false }),
      this.request("account/read", { refreshToken: false }),
    ]);
    const models = ((modelResult as { data?: Array<Record<string, unknown>> })?.data ?? []).map((model): ModelOption => ({
      id: String(model.id ?? model.model ?? ""),
      model: String(model.model ?? model.id ?? ""),
      displayName: String(model.displayName ?? model.model ?? model.id ?? "Unknown"),
      description: String(model.description ?? ""),
      isDefault: Boolean(model.isDefault),
      defaultReasoningEffort: String(model.defaultReasoningEffort ?? "medium"),
    }));
    const account = (accountResult as { account?: Record<string, unknown> | null })?.account;
    const accountLabel = account?.type === "chatgpt"
      ? String(account.email ?? account.planType ?? "ChatGPT")
      : account?.type === "apiKey"
        ? "OpenAI API Key"
        : account?.type === "amazonBedrock"
          ? "Amazon Bedrock"
          : "未登录";

    this.emitEvent({ kind: "state", state: "connected", detail: `已连接 · ${accountLabel}` });
    return {
      version: response?.userAgent ?? "Codex App Server",
      accountLabel,
      signedIn: Boolean(account),
      models,
    };
  }

  async startThread(options: StartThreadOptions): Promise<{ threadId: string }> {
    await this.start();
    const result = (await this.request("thread/start", {
      cwd: options.cwd,
      model: options.model || null,
      approvalPolicy: options.approvalPolicy,
      sandbox: options.sandbox,
      serviceName: "arc_code_desktop",
      ephemeral: false,
    })) as { thread: { id: string } };

    if (!result?.thread?.id) throw new Error("Codex 没有返回 threadId");
    return { threadId: result.thread.id };
  }

  async startTurn(threadId: string, prompt: string): Promise<{ turnId: string }> {
    const result = (await this.request("turn/start", {
      threadId,
      input: [{ type: "text", text: prompt, text_elements: [] }],
    })) as { turn: { id: string } };

    if (!result?.turn?.id) throw new Error("Codex 没有返回 turnId");
    return { turnId: result.turn.id };
  }

  async listThreads(cwd: string): Promise<ThreadSummary[]> {
    await this.start();
    const result = (await this.request("thread/list", {
      cursor: null,
      limit: 20,
      sortKey: "updated_at",
      sortDirection: "desc",
      cwd,
      archived: false,
    })) as { data?: Array<Record<string, unknown>> };
    return (result.data ?? []).map((thread) => ({
      id: String(thread.id),
      title: String(thread.name ?? thread.preview ?? "未命名任务"),
      preview: String(thread.preview ?? ""),
      updatedAt: Number(thread.updatedAt ?? thread.createdAt ?? 0),
    }));
  }

  async resumeThread(threadId: string, cwd: string): Promise<ThreadHistory> {
    await this.start();
    const result = (await this.request("thread/resume", {
      threadId,
      cwd,
      approvalPolicy: "on-request",
      sandbox: "workspace-write",
      excludeTurns: false,
    })) as {
      thread: { id: string; turns?: ThreadHistory["turns"] };
      model?: string;
    };
    return {
      threadId: result.thread.id,
      model: result.model ?? "",
      turns: result.thread.turns ?? [],
    };
  }

  async interruptTurn(threadId: string, turnId: string): Promise<void> {
    await this.request("turn/interrupt", { threadId, turnId });
  }

  respondToServerRequest(id: RpcId, result: unknown): void {
    this.write({ id, result });
  }

  stop(): void {
    if (!this.process) return;
    this.lines?.close();
    this.process.kill();
    this.cleanupProcess();
  }

  private request(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.process?.stdin.writable) {
      return Promise.reject(new Error("Codex App Server 尚未连接"));
    }

    const id = this.requestId++;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`请求超时：${method}`));
      }, 30_000);
      this.pending.set(id, { resolve, reject, timeout });
      this.write({ id, method, params });
    });
  }

  private notify(method: string, params?: Record<string, unknown>): void {
    this.write({ method, params });
  }

  private write(message: RpcMessage): void {
    if (!this.process?.stdin.writable) throw new Error("Codex App Server 连接已关闭");
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  private handleLine(line: string): void {
    let message: RpcMessage;
    try {
      message = JSON.parse(line) as RpcMessage;
    } catch {
      this.emitEvent({ kind: "log", detail: `无法解析 App Server 输出：${line}` });
      return;
    }

    if (message.id !== undefined && !message.method) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timeout);
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message || `RPC 错误 ${message.error.code ?? ""}`));
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    if (message.id !== undefined && message.method) {
      this.emitEvent({ kind: "request", message });
      return;
    }

    if (message.method) this.emitEvent({ kind: "notification", message });
  }

  private emitEvent(event: AppServerEvent): void {
    this.emit("event", event);
  }

  private rejectAll(error: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
  }

  private cleanupProcess(): void {
    this.lines = null;
    this.process = null;
    this.startPromise = null;
  }
}
