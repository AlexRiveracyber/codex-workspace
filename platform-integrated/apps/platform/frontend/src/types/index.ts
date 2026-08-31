export interface ManagedApp {
  id: number;
  name: string;
  appKey: string;
  description?: string;
  category: 'WEB' | 'DATABASE' | 'QUEUE' | 'APPLICATION' | 'TOOL' | string;
  appType: 'DOCKER' | 'NATIVE' | string;
  dockerImage?: string;
  containerName?: string;
  containerId?: string;
  hostPort?: number;
  containerPort?: number;
  envVars?: string;
  command?: string;
  status: 'RUNNING' | 'STOPPED' | 'STARTING' | 'RESTARTING' | 'ERROR' | 'UNKNOWN';
  healthUrl?: string;
  icon?: string;
  autoStart?: boolean;
  cpuLimit?: string;
  memoryLimit?: string;
  lastStartedAt?: string;
  lastStoppedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppLog {
  id: number;
  appId?: number;
  appName?: string;
  action: string;
  status: string;
  message: string;
  details?: string;
  createdAt: string;
}

export interface AppTemplate {
  id: number;
  name: string;
  templateKey: string;
  description: string;
  category: string;
  dockerImage: string;
  defaultHostPort?: number;
  defaultContainerPort?: number;
  defaultEnvVars?: string;
  defaultCommand?: string;
  icon?: string;
  tags?: string;
}

export interface AppStats {
  containerId?: string;
  containerName?: string;
  cpuPercent?: string;
  memoryUsage?: string;
  memoryLimit?: string;
  memoryPercent?: string;
  netIO?: string;
  blockIO?: string;
  pids?: string;
  status?: string;
  uptime?: string;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  created: string;
  isManaged: boolean;
  managedAppId?: number;
}

export interface DashboardSummary {
  totalApps: number;
  runningApps: number;
  stoppedApps: number;
  errorApps: number;
  totalContainers: number;
  dockerConnected: boolean;
  dockerVersion: string;
  categoryCounts: Record<string, number>;
  recentLogs: AppLog[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
