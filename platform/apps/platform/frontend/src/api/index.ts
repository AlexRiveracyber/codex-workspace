import axios from 'axios';
import type {
  ApiResponse,
  ManagedApp,
  DashboardSummary,
  DockerContainer,
  AppTemplate,
  AppLog,
  AppStats
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const dashboardApi = {
  getSummary: async () => {
    const res = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },
};

export const appsApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<ManagedApp[]>>('/apps');
    return res.data.data;
  },
  getById: async (id: number) => {
    const res = await api.get<ApiResponse<ManagedApp>>(`/apps/${id}`);
    return res.data.data;
  },
  create: async (app: Partial<ManagedApp>) => {
    const res = await api.post<ApiResponse<ManagedApp>>('/apps', app);
    return res.data.data;
  },
  update: async (id: number, app: Partial<ManagedApp>) => {
    const res = await api.put<ApiResponse<ManagedApp>>(`/apps/${id}`, app);
    return res.data.data;
  },
  delete: async (id: number, removeContainer: boolean = false) => {
    const res = await api.delete<ApiResponse<void>>(`/apps/${id}`, {
      params: { removeContainer },
    });
    return res.data;
  },
  start: async (id: number) => {
    const res = await api.post<ApiResponse<ManagedApp>>(`/apps/${id}/start`);
    return res.data.data;
  },
  stop: async (id: number) => {
    const res = await api.post<ApiResponse<ManagedApp>>(`/apps/${id}/stop`);
    return res.data.data;
  },
  restart: async (id: number) => {
    const res = await api.post<ApiResponse<ManagedApp>>(`/apps/${id}/restart`);
    return res.data.data;
  },
  getLogs: async (id: number, lines: number = 200) => {
    const res = await api.get<ApiResponse<string>>(`/apps/${id}/logs`, {
      params: { lines },
    });
    return res.data.data;
  },
  getStats: async (id: number) => {
    const res = await api.get<ApiResponse<AppStats>>(`/apps/${id}/stats`);
    return res.data.data;
  },
};

export const dockerApi = {
  getStatus: async () => {
    const res = await api.get<ApiResponse<{ available: boolean; version: string }>>('/docker/status');
    return res.data.data;
  },
  getContainers: async (all: boolean = true) => {
    const res = await api.get<ApiResponse<DockerContainer[]>>('/docker/containers', {
      params: { all },
    });
    return res.data.data;
  },
  importContainer: async (params: {
    containerId: string;
    containerName: string;
    image: string;
    state: string;
    appName?: string;
    category?: string;
  }) => {
    const res = await api.post<ApiResponse<ManagedApp>>('/docker/containers/import', params);
    return res.data.data;
  },
  startContainer: async (nameOrId: string) => {
    const res = await api.post<ApiResponse<boolean>>(`/docker/containers/${nameOrId}/start`);
    return res.data;
  },
  stopContainer: async (nameOrId: string) => {
    const res = await api.post<ApiResponse<boolean>>(`/docker/containers/${nameOrId}/stop`);
    return res.data;
  },
  restartContainer: async (nameOrId: string) => {
    const res = await api.post<ApiResponse<boolean>>(`/docker/containers/${nameOrId}/restart`);
    return res.data;
  },
  removeContainer: async (nameOrId: string, force: boolean = false) => {
    const res = await api.delete<ApiResponse<boolean>>(`/docker/containers/${nameOrId}`, {
      params: { force },
    });
    return res.data;
  },
};

export const templatesApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<AppTemplate[]>>('/templates');
    return res.data.data;
  },
  deploy: async (params: {
    templateKey: string;
    appName: string;
    containerName?: string;
    hostPort?: number;
    envVars?: string;
    startImmediately?: boolean;
  }) => {
    const res = await api.post<ApiResponse<ManagedApp>>('/templates/deploy', params);
    return res.data.data;
  },
};

export const logsApi = {
  getRecent: async () => {
    const res = await api.get<ApiResponse<AppLog[]>>('/logs/recent');
    return res.data.data;
  },
};
