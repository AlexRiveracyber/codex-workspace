export type ConnectionState = "starting" | "connected" | "disconnected" | "error";

export type RpcId = string | number;

export interface RpcMessage {
  id?: RpcId;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: {
    code?: number;
    message?: string;
    data?: unknown;
  };
}

export interface AppServerEvent {
  kind: "notification" | "request" | "state" | "log";
  message?: RpcMessage;
  state?: ConnectionState;
  detail?: string;
}

export type SandboxMode = "read-only" | "workspace-write";
export type ApprovalPolicy = "untrusted" | "on-request" | "never";

export interface StartThreadOptions {
  cwd: string;
  model?: string;
  sandbox: SandboxMode;
  approvalPolicy: ApprovalPolicy;
}

export interface ProjectInfo {
  path: string;
  name: string;
  branch: string | null;
  isGitRepository: boolean;
  diff: string;
  changedFiles: number;
}

export type ApprovalDecision = "accept" | "acceptForSession" | "decline" | "cancel";

export interface ModelOption {
  id: string;
  model: string;
  displayName: string;
  description: string;
  isDefault: boolean;
  defaultReasoningEffort: string;
}

export interface RuntimeInfo {
  version: string;
  accountLabel: string;
  signedIn: boolean;
  models: ModelOption[];
}

export interface ThreadSummary {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
}

export interface ThreadHistory {
  threadId: string;
  model: string;
  turns: Array<{
    id: string;
    status: string;
    items: Array<Record<string, unknown>>;
  }>;
}

export interface PersistedState {
  lastProject: string | null;
}

export interface DesktopApi {
  connect(): Promise<RuntimeInfo>;
  pickProject(): Promise<ProjectInfo | null>;
  loadProject(path: string): Promise<ProjectInfo>;
  getInitialState(): Promise<PersistedState>;
  startThread(options: StartThreadOptions): Promise<{ threadId: string }>;
  listThreads(cwd: string): Promise<ThreadSummary[]>;
  resumeThread(threadId: string, cwd: string): Promise<ThreadHistory>;
  startTurn(threadId: string, prompt: string): Promise<{ turnId: string }>;
  interruptTurn(threadId: string, turnId: string): Promise<void>;
  respondToRequest(id: RpcId, result: unknown): Promise<void>;
  onEvent(listener: (event: AppServerEvent) => void): () => void;
}
