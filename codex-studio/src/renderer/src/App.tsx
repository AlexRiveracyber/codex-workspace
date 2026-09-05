import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Check,
  ChevronDown,
  CircleStop,
  Code2,
  FileCode2,
  FolderGit2,
  GitBranch,
  LoaderCircle,
  MessageSquarePlus,
  PanelRightClose,
  PanelRightOpen,
  Play,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  TerminalSquare,
  User,
  X,
} from "lucide-react";
import type {
  AppServerEvent,
  ApprovalDecision,
  ConnectionState,
  ModelOption,
  ProjectInfo,
  RpcMessage,
  ThreadSummary,
} from "../../shared/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  streaming?: boolean;
}

interface ActivityItem {
  id: string;
  type: "command" | "file" | "reasoning" | "tool";
  title: string;
  subtitle?: string;
  output?: string;
  status: "running" | "completed" | "failed";
}

interface ApprovalRequest {
  id: string | number;
  method: string;
  kind: "approval" | "questions" | "permissions" | "unsupported";
  title: string;
  detail: string;
  questions?: Array<{
    id: string;
    header: string;
    question: string;
    isSecret: boolean;
    options: Array<{ label: string; description: string }>;
  }>;
  permissions?: unknown;
}

const starterPrompts = [
  "概览这个项目的架构",
  "检查当前改动并找出风险",
  "运行测试并修复失败项",
];

function textFromUserContent(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((item) => item && typeof item === "object" && (item as { type?: string }).type === "text")
    .map((item) => String((item as { text?: string }).text ?? ""))
    .join("\n");
}

function approvalFromMessage(message: RpcMessage): ApprovalRequest | null {
  if (message.id === undefined || !message.method) return null;
  const params = message.params ?? {};
  if (message.method === "item/commandExecution/requestApproval" || message.method === "execCommandApproval") {
    return {
      id: message.id,
      method: message.method,
      kind: "approval",
      title: "允许执行命令？",
      detail: String(params.command ?? params.reason ?? "Codex 请求执行一条命令"),
    };
  }
  if (message.method === "item/fileChange/requestApproval" || message.method === "applyPatchApproval") {
    return {
      id: message.id,
      method: message.method,
      kind: "approval",
      title: "允许修改文件？",
      detail: String(params.reason ?? params.grantRoot ?? "Codex 请求写入工作区以外的位置"),
    };
  }
  if (message.method === "item/permissions/requestApproval") {
    return {
      id: message.id,
      method: message.method,
      kind: "permissions",
      title: "允许额外权限？",
      detail: String(params.reason ?? "Codex 请求额外的文件或网络权限"),
      permissions: params.permissions,
    };
  }
  if (message.method === "item/tool/requestUserInput") {
    const questions = Array.isArray(params.questions) ? params.questions as Array<Record<string, unknown>> : [];
    return {
      id: message.id,
      method: message.method,
      kind: "questions",
      title: "Agent 需要更多信息",
      detail: "回答后，Agent 会继续当前任务。",
      questions: questions.map((question) => ({
        id: String(question.id),
        header: String(question.header ?? "问题"),
        question: String(question.question ?? ""),
        isSecret: Boolean(question.isSecret),
        options: Array.isArray(question.options)
          ? (question.options as Array<Record<string, unknown>>).map((option) => ({
              label: String(option.label ?? ""),
              description: String(option.description ?? ""),
            }))
          : [],
      })),
    };
  }
  return {
    id: message.id,
    method: message.method,
    kind: "unsupported",
    title: "Codex 需要你的确认",
    detail: JSON.stringify(params, null, 2),
  };
}

function activityFromItem(item: Record<string, unknown>): ActivityItem | null {
  const id = String(item.id ?? crypto.randomUUID());
  if (item.type === "commandExecution") {
    return {
      id,
      type: "command",
      title: String(item.command ?? "执行命令"),
      subtitle: String(item.cwd ?? ""),
      output: typeof item.aggregatedOutput === "string" ? item.aggregatedOutput : "",
      status: item.status === "failed" || item.status === "declined" ? "failed" : item.status === "completed" ? "completed" : "running",
    };
  }
  if (item.type === "fileChange") {
    const changes = Array.isArray(item.changes) ? item.changes : [];
    return {
      id,
      type: "file",
      title: `修改 ${changes.length || 1} 个文件`,
      status: item.status === "failed" || item.status === "declined" ? "failed" : item.status === "completed" ? "completed" : "running",
    };
  }
  if (item.type === "reasoning" || item.type === "plan") {
    return { id, type: "reasoning", title: item.type === "plan" ? "制定执行计划" : "分析任务", status: "running" };
  }
  if (item.type === "mcpToolCall" || item.type === "dynamicToolCall") {
    return {
      id,
      type: "tool",
      title: String(item.tool ?? "调用工具"),
      subtitle: item.server ? String(item.server) : undefined,
      status: item.status === "failed" ? "failed" : item.status === "completed" ? "completed" : "running",
    };
  }
  return null;
}

function DiffView({ diff }: { diff: string }): ReactElement {
  if (!diff.trim()) {
    return (
      <div className="empty-side">
        <Check size={22} />
        <span>工作区暂无改动</span>
      </div>
    );
  }
  return (
    <pre className="diff-view">
      {diff.split("\n").map((line, index) => {
        const className = line.startsWith("+") && !line.startsWith("+++")
          ? "diff-add"
          : line.startsWith("-") && !line.startsWith("---")
            ? "diff-del"
            : line.startsWith("@@")
              ? "diff-hunk"
              : line.startsWith("diff ") || line.startsWith("# ")
                ? "diff-head"
                : "";
        return <span className={className} key={`${index}-${line.slice(0, 8)}`}>{line || " "}{"\n"}</span>;
      })}
    </pre>
  );
}

export default function App(): ReactElement {
  const [connection, setConnection] = useState<ConnectionState>("starting");
  const [connectionDetail, setConnectionDetail] = useState("正在连接本地 Codex");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [recentThreads, setRecentThreads] = useState<ThreadSummary[]>([]);
  const [turnId, setTurnId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [rightTab, setRightTab] = useState<"changes" | "activity">("changes");
  const [turnDiff, setTurnDiff] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const approval = requests[0] ?? null;
  const displayedDiff = turnDiff || project?.diff || "";

  const upsertActivity = useCallback((next: ActivityItem) => {
    setActivities((current) => {
      const index = current.findIndex((item) => item.id === next.id);
      if (index < 0) return [...current, next];
      const copy = [...current];
      copy[index] = { ...copy[index], ...next };
      return copy;
    });
  }, []);

  const handleNotification = useCallback((message: RpcMessage) => {
    const method = message.method;
    const params = message.params ?? {};
    if (method === "turn/started") {
      const turn = params.turn as { id?: string } | undefined;
      if (turn?.id) setTurnId(turn.id);
      setBusy(true);
      return;
    }
    if (method === "turn/completed") {
      setBusy(false);
      setTurnId(null);
      setMessages((current) => current.map((item) => ({ ...item, streaming: false })));
      return;
    }
    if (method === "serverRequest/resolved") {
      const requestId = params.requestId;
      if (requestId !== undefined) setRequests((current) => current.filter((item) => String(item.id) !== String(requestId)));
      return;
    }
    if (method === "turn/diff/updated") {
      setTurnDiff(String(params.diff ?? ""));
      setRightTab("changes");
      return;
    }
    if (method === "item/agentMessage/delta") {
      const itemId = String(params.itemId ?? "assistant-stream");
      const delta = String(params.delta ?? "");
      setMessages((current) => {
        const index = current.findIndex((item) => item.id === itemId);
        if (index < 0) return [...current, { id: itemId, role: "assistant", text: delta, streaming: true }];
        const copy = [...current];
        copy[index] = { ...copy[index], text: copy[index].text + delta, streaming: true };
        return copy;
      });
      return;
    }
    if (method === "item/commandExecution/outputDelta") {
      const itemId = String(params.itemId ?? "command");
      const delta = String(params.delta ?? "");
      setActivities((current) => current.map((item) => item.id === itemId ? { ...item, output: (item.output ?? "") + delta } : item));
      return;
    }
    if (method === "item/started" || method === "item/completed") {
      const item = params.item as Record<string, unknown> | undefined;
      if (!item) return;
      if (item.type === "agentMessage" && method === "item/completed") {
        const id = String(item.id ?? "assistant");
        const text = String(item.text ?? "");
        setMessages((current) => {
          const index = current.findIndex((entry) => entry.id === id);
          if (index < 0) return [...current, { id, role: "assistant", text }];
          const copy = [...current];
          copy[index] = { ...copy[index], text: text || copy[index].text, streaming: false };
          return copy;
        });
      }
      const activity = activityFromItem(item);
      if (activity) {
        if (method === "item/completed" && activity.status === "running") activity.status = "completed";
        upsertActivity(activity);
        setRightTab("activity");
      }
      return;
    }
    if (method === "error") {
      const detail = (params.error as { message?: string } | undefined)?.message ?? params.message;
      setError(String(detail ?? "Codex 返回了未知错误"));
      setBusy(false);
    }
  }, [upsertActivity]);

  useEffect(() => {
    const unsubscribe = window.codexDesktop.onEvent((event: AppServerEvent) => {
      if (event.kind === "state" && event.state) {
        setConnection(event.state);
        setConnectionDetail(event.detail ?? "");
      } else if (event.kind === "request" && event.message) {
        const next = approvalFromMessage(event.message);
        if (next) setRequests((current) => current.some((item) => item.id === next.id) ? current : [...current, next]);
      } else if (event.kind === "notification" && event.message) {
        handleNotification(event.message);
      }
    });

    void window.codexDesktop.connect()
      .then((runtime) => {
        setModels(runtime.models);
        const defaultModel = runtime.models.find((model) => model.isDefault) ?? runtime.models[0];
        setSelectedModel(defaultModel?.model ?? "");
        setConnectionDetail(`已连接 · ${runtime.accountLabel}`);
      })
      .catch((reason: unknown) => {
        setConnection("error");
        setConnectionDetail(reason instanceof Error ? reason.message : String(reason));
      });

    void window.codexDesktop.getInitialState().then(async (state) => {
      if (!state.lastProject) return;
      try {
        setProject(await window.codexDesktop.loadProject(state.lastProject));
      } catch {
        // The saved folder may have moved; the user can choose another project.
      }
    });

    return unsubscribe;
  }, [handleNotification]);

  useEffect(() => {
    if (!project || connection !== "connected") {
      setRecentThreads([]);
      return;
    }
    void window.codexDesktop.listThreads(project.path)
      .then(setRecentThreads)
      .catch(() => setRecentThreads([]));
  }, [connection, project?.path]);

  useEffect(() => setQuestionAnswers({}), [approval?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, activities]);

  const chooseProject = async (): Promise<void> => {
    try {
      const picked = await window.codexDesktop.pickProject();
      if (!picked) return;
      setProject(picked);
      setThreadId(null);
      setTurnId(null);
      setMessages([]);
      setActivities([]);
      setRecentThreads([]);
      setRequests([]);
      setTurnDiff("");
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const refreshProject = async (): Promise<void> => {
    if (!project) return;
    setProject(await window.codexDesktop.loadProject(project.path));
  };

  const createThread = async (): Promise<string> => {
    if (!project) throw new Error("请先选择一个项目");
    const result = await window.codexDesktop.startThread({
      cwd: project.path,
      sandbox: "workspace-write",
      approvalPolicy: "on-request",
      model: selectedModel || undefined,
    });
    setThreadId(result.threadId);
    return result.threadId;
  };

  const sendPrompt = async (override?: string): Promise<void> => {
    const prompt = (override ?? input).trim();
    if (!prompt || busy) return;
    if (!project) {
      await chooseProject();
      return;
    }

    setInput("");
    setError(null);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: prompt }]);
    setBusy(true);
    try {
      const activeThread = threadId ?? await createThread();
      const result = await window.codexDesktop.startTurn(activeThread, prompt);
      setTurnId(result.turnId);
    } catch (reason) {
      setBusy(false);
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const stopTurn = async (): Promise<void> => {
    if (!threadId || !turnId) return;
    await window.codexDesktop.interruptTurn(threadId, turnId);
  };

  const answerApproval = async (decision: ApprovalDecision): Promise<void> => {
    if (!approval) return;
    await window.codexDesktop.respondToRequest(approval.id, { decision });
    setRequests((current) => current.slice(1));
  };

  const answerPermissions = async (allow: boolean, scope: "turn" | "session" = "turn"): Promise<void> => {
    if (!approval) return;
    await window.codexDesktop.respondToRequest(approval.id, {
      permissions: allow ? approval.permissions ?? {} : {},
      scope,
    });
    setRequests((current) => current.slice(1));
  };

  const submitQuestions = async (): Promise<void> => {
    if (!approval?.questions) return;
    const answers = Object.fromEntries(approval.questions.map((question) => [
      question.id,
      { answers: [questionAnswers[question.id] ?? ""] },
    ]));
    await window.codexDesktop.respondToRequest(approval.id, { answers });
    setRequests((current) => current.slice(1));
  };

  const cancelUnsupportedRequest = async (): Promise<void> => {
    if (!approval) return;
    await window.codexDesktop.respondToRequest(approval.id, { action: "cancel", content: null });
    setRequests((current) => current.slice(1));
  };

  const resumeThread = async (summary: ThreadSummary): Promise<void> => {
    if (!project || busy) return;
    setError(null);
    try {
      const history = await window.codexDesktop.resumeThread(summary.id, project.path);
      const restoredMessages: ChatMessage[] = [];
      const restoredActivities: ActivityItem[] = [];
      for (const turn of history.turns) {
        for (const item of turn.items) {
          const id = String(item.id ?? crypto.randomUUID());
          if (item.type === "userMessage") {
            restoredMessages.push({ id, role: "user", text: textFromUserContent(item.content) });
          } else if (item.type === "agentMessage") {
            restoredMessages.push({ id, role: "assistant", text: String(item.text ?? "") });
          }
          const activity = activityFromItem(item);
          if (activity) restoredActivities.push(activity);
        }
      }
      setThreadId(history.threadId);
      setMessages(restoredMessages);
      setActivities(restoredActivities);
      setTurnDiff("");
      if (history.model && models.some((model) => model.model === history.model)) setSelectedModel(history.model);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const newSession = (): void => {
    if (busy) return;
    setThreadId(null);
    setTurnId(null);
    setMessages([]);
    setActivities([]);
    setTurnDiff("");
    setRequests([]);
    setError(null);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendPrompt();
    }
  };

  const connectionLabel = useMemo(() => ({
    starting: "连接中",
    connected: "本地运行",
    disconnected: "已断开",
    error: "连接失败",
  })[connection], [connection]);

  return (
    <div className={`app-shell ${rightOpen ? "with-inspector" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <div><strong>Arc Code</strong><span>Local agent studio</span></div>
        </div>

        <button className="new-task" onClick={newSession} disabled={busy}>
          <MessageSquarePlus size={17} /> 新建任务
        </button>

        <div className="side-label">工作区</div>
        <button className="project-card" onClick={() => void chooseProject()}>
          <FolderGit2 size={19} />
          <span className="project-copy">
            <strong>{project?.name ?? "选择代码项目"}</strong>
            <small>{project?.path ?? "从本地文件夹开始"}</small>
          </span>
          <ChevronDown size={15} />
        </button>

        <div className="side-label task-label">当前任务</div>
        <div className="current-task">
          <Code2 size={16} />
          <span>{messages[0]?.text.slice(0, 34) || "等待开始…"}</span>
        </div>

        {recentThreads.length > 0 && (
          <>
            <div className="side-label recent-label">最近任务</div>
            <div className="recent-list">
              {recentThreads.slice(0, 6).map((item) => (
                <button className={threadId === item.id ? "active" : ""} key={item.id} onClick={() => void resumeThread(item)}>
                  <span>{item.title || item.preview || "未命名任务"}</span>
                  <small>{new Date(item.updatedAt * 1000).toLocaleDateString()}</small>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="sidebar-spacer" />
        <div className={`connection-card state-${connection}`} title={connectionDetail}>
          <span className="status-dot" />
          <div><strong>{connectionLabel}</strong><small>{connection === "connected" ? "Codex App Server" : connectionDetail}</small></div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="project-heading">
            <span>{project?.name ?? "未选择项目"}</span>
            {project?.branch && <span className="branch"><GitBranch size={14} />{project.branch}</span>}
          </div>
          <div className="top-actions">
            <span className="security-pill"><ShieldAlert size={14} />工作区沙箱</span>
            <button className="icon-button" onClick={() => setRightOpen((open) => !open)} title="切换检查器">
              {rightOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>
          </div>
        </header>

        <div className="conversation" ref={scrollRef}>
          {!project ? (
            <section className="welcome">
              <div className="hero-icon"><Bot size={32} /></div>
              <p className="eyebrow">YOUR LOCAL CODING AGENT</p>
              <h1>把任务交给你的<br />桌面开发搭档</h1>
              <p className="welcome-copy">选择一个本地项目，让 Agent 阅读代码、运行命令并提交可检查的文件修改。</p>
              <button className="primary-button" onClick={() => void chooseProject()}><FolderGit2 size={17} />选择项目</button>
            </section>
          ) : messages.length === 0 ? (
            <section className="welcome project-ready">
              <div className="project-orb"><Code2 size={28} /></div>
              <p className="eyebrow">{project.name.toUpperCase()}</p>
              <h1>今天想构建什么？</h1>
              <p className="welcome-copy">Agent 只会在这个工作区内写入；额外权限会先向你确认。</p>
              <div className="starter-grid">
                {starterPrompts.map((prompt) => (
                  <button key={prompt} onClick={() => void sendPrompt(prompt)}><Play size={15} />{prompt}</button>
                ))}
              </div>
            </section>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article className={`message message-${message.role}`} key={message.id}>
                  <div className="avatar">{message.role === "user" ? <User size={16} /> : <Sparkles size={16} />}</div>
                  <div className="message-body">
                    <div className="message-author">{message.role === "user" ? "你" : "Arc"}</div>
                    {message.role === "assistant" ? <ReactMarkdown>{message.text}</ReactMarkdown> : <p>{message.text}</p>}
                    {message.streaming && <span className="typing-caret" />}
                  </div>
                </article>
              ))}
              {busy && !messages.some((message) => message.streaming) && (
                <div className="thinking-row"><LoaderCircle className="spin" size={16} /> Agent 正在处理任务…</div>
              )}
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {error && <div className="error-banner"><ShieldAlert size={16} /><span>{error}</span><button onClick={() => setError(null)}><X size={15} /></button></div>}
          {approval && (
            <div className={`approval-card kind-${approval.kind}`}>
              <div className="approval-icon"><ShieldAlert size={18} /></div>
              <div className="approval-copy">
                <strong>{approval.title}{requests.length > 1 && <span className="request-count">+{requests.length - 1}</span>}</strong>
                <code>{approval.detail}</code>
                {approval.kind === "questions" && approval.questions && (
                  <div className="question-list">
                    {approval.questions.map((question) => (
                      <label key={question.id}>
                        <span>{question.header}</span>
                        <em>{question.question}</em>
                        {question.options.length > 0 ? (
                          <select value={questionAnswers[question.id] ?? ""} onChange={(event) => setQuestionAnswers((current) => ({ ...current, [question.id]: event.target.value }))}>
                            <option value="">请选择…</option>
                            {question.options.map((option) => <option value={option.label} key={option.label}>{option.label} — {option.description}</option>)}
                          </select>
                        ) : (
                          <input type={question.isSecret ? "password" : "text"} value={questionAnswers[question.id] ?? ""} onChange={(event) => setQuestionAnswers((current) => ({ ...current, [question.id]: event.target.value }))} />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {approval.kind === "approval" ? (
                <div className="approval-actions">
                  <button onClick={() => void answerApproval("decline")}>拒绝</button>
                  <button onClick={() => void answerApproval("acceptForSession")}>会话允许</button>
                  <button className="approve" onClick={() => void answerApproval("accept")}>允许一次</button>
                </div>
              ) : approval.kind === "permissions" ? (
                <div className="approval-actions">
                  <button onClick={() => void answerPermissions(false)}>拒绝</button>
                  <button onClick={() => void answerPermissions(true, "session")}>会话允许</button>
                  <button className="approve" onClick={() => void answerPermissions(true)}>本回合允许</button>
                </div>
              ) : approval.kind === "questions" ? (
                <div className="approval-actions"><button className="approve" onClick={() => void submitQuestions()}>提交回答</button></div>
              ) : (
                <div className="approval-actions"><button onClick={() => void cancelUnsupportedRequest()}>取消请求</button></div>
              )}
            </div>
          )}
          <div className={`composer ${busy ? "composer-busy" : ""}`}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={project ? "描述任务，Shift + Enter 换行…" : "先选择一个本地项目…"}
              rows={1}
              disabled={busy || connection !== "connected"}
            />
            <div className="composer-footer">
              <label className="model-select"><span className="model-dot" />
                <select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} disabled={Boolean(threadId)} title={threadId ? "新建任务后可更换模型" : "选择模型"}>
                  {models.length === 0 && <option value="">默认模型</option>}
                  {models.map((model) => <option value={model.model} key={model.id}>{model.displayName}</option>)}
                </select>
                <span>· 本地</span>
              </label>
              {busy ? (
                <button className="send-button stop" onClick={() => void stopTurn()} title="停止"><CircleStop size={18} /></button>
              ) : (
                <button className="send-button" onClick={() => void sendPrompt()} disabled={!input.trim() || !project}><Send size={17} /></button>
              )}
            </div>
          </div>
          <div className="composer-hint">Agent 可能会犯错。提交前请检查命令和文件更改。</div>
        </div>
      </main>

      {rightOpen && (
        <aside className="inspector">
          <div className="inspector-tabs">
            <button className={rightTab === "changes" ? "active" : ""} onClick={() => setRightTab("changes")}>
              更改 <span>{project?.changedFiles ?? 0}</span>
            </button>
            <button className={rightTab === "activity" ? "active" : ""} onClick={() => setRightTab("activity")}>
              活动 <span>{activities.length}</span>
            </button>
            <button className="refresh-button" onClick={() => void refreshProject()} title="刷新 Git 状态"><RefreshCw size={15} /></button>
          </div>
          <div className="inspector-content">
            {rightTab === "changes" ? <DiffView diff={displayedDiff} /> : activities.length === 0 ? (
              <div className="empty-side"><TerminalSquare size={22} /><span>命令和工具调用会显示在这里</span></div>
            ) : (
              <div className="activity-list">
                {activities.map((item) => (
                  <details className="activity" key={item.id} open={item.status === "running"}>
                    <summary>
                      <span className={`activity-icon type-${item.type}`}>{item.type === "file" ? <FileCode2 size={15} /> : <TerminalSquare size={15} />}</span>
                      <span className="activity-title"><strong>{item.title}</strong>{item.subtitle && <small>{item.subtitle}</small>}</span>
                      <span className={`activity-status ${item.status}`}>{item.status === "running" ? <LoaderCircle className="spin" size={14} /> : item.status === "failed" ? <X size={14} /> : <Check size={14} />}</span>
                    </summary>
                    {item.output && <pre>{item.output}</pre>}
                  </details>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
