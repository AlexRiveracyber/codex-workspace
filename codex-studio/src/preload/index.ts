import { contextBridge, ipcRenderer } from "electron";
import type { AppServerEvent, DesktopApi, RpcId, StartThreadOptions } from "../shared/types";

const api: DesktopApi = {
  connect: () => ipcRenderer.invoke("codex:connect"),
  pickProject: () => ipcRenderer.invoke("project:pick"),
  loadProject: (path: string) => ipcRenderer.invoke("project:load", path),
  getInitialState: () => ipcRenderer.invoke("state:get"),
  startThread: (options: StartThreadOptions) => ipcRenderer.invoke("codex:thread:start", options),
  listThreads: (cwd: string) => ipcRenderer.invoke("codex:thread:list", cwd),
  resumeThread: (threadId: string, cwd: string) => ipcRenderer.invoke("codex:thread:resume", threadId, cwd),
  startTurn: (threadId: string, prompt: string) => ipcRenderer.invoke("codex:turn:start", threadId, prompt),
  interruptTurn: (threadId: string, turnId: string) => ipcRenderer.invoke("codex:turn:interrupt", threadId, turnId),
  respondToRequest: (id: RpcId, result: unknown) => ipcRenderer.invoke("codex:request:respond", id, result),
  onEvent: (listener: (event: AppServerEvent) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: AppServerEvent): void => listener(payload);
    ipcRenderer.on("codex:event", handler);
    return () => ipcRenderer.removeListener("codex:event", handler);
  },
};

contextBridge.exposeInMainWorld("codexDesktop", api);
