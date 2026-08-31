import axios from 'axios';

const api = axios.create({
  baseURL: '/api/ai',
  timeout: 120000,
});

export interface AiProvider {
  id?: number;
  name: string;
  providerKey: string;
  baseUrl: string;
  apiKey: string;
  description?: string;
  enabled?: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiModel {
  id?: number;
  providerKey: string;
  brand: string;
  modelName: string;
  modelKey: string;
  capabilities: string;
  modelType: string;
  tag?: string;
  contextLength?: number;
  enabled?: boolean;
  sortOrder?: number;
  createdAt?: string;
}

export interface AiConversation {
  id: number;
  title: string;
  providerKey: string;
  modelKey: string;
  systemPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id?: number;
  conversationId?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  imageUrls?: string;
  videoUrls?: string;
  audioUrls?: string;
  mediaType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  tokensUsed?: number;
  latencyMs?: number;
  createdAt?: string;
}

export interface AiCallLog {
  id: number;
  providerKey: string;
  modelKey: string;
  callType: string;
  promptSnippet: string;
  responseSnippet?: string;
  tokensPrompt: number;
  tokensCompletion: number;
  latencyMs: number;
  status: string;
  errorMsg?: string;
  requestJson?: string;
  responseJson?: string;
  createdAt: string;
}

export interface CallStats {
  totalCalls: number;
  successCalls: number;
  successRate: number;
  totalTokens: number;
  avgLatencyMs: number;
  totalModels: number;
  totalProviders: number;
}

export interface GenerationTask {
  id: number;
  taskType: 'IMAGE' | 'VIDEO';
  providerKey: string;
  modelKey: string;
  prompt: string;
  negativePrompt?: string;
  inputImageUrl?: string;
  resultUrl?: string;
  status: string;
  parameters?: string;
  errorMsg?: string;
  durationSec?: number;
  createdAt: string;
  completedAt?: string;
}

export const aiApi = {
  // Providers
  getProviders: () => api.get<AiProvider[]>('/providers').then(r => r.data),
  saveProvider: (p: AiProvider) => api.post<AiProvider>('/providers', p).then(r => r.data),
  deleteProvider: (id: number) => api.delete(`/providers/${id}`).then(r => r.data),
  testConnection: (id: number) => api.post(`/providers/${id}/test`).then(r => r.data),
  testCustomConnection: (baseUrl: string, apiKey: string) => api.post('/providers/test-custom', { base_url: baseUrl, api_key: apiKey }).then(r => r.data),

  // Models
  getModels: (params?: { brand?: string; capability?: string; modelType?: string; enabledOnly?: boolean }) =>
    api.get<AiModel[]>('/models', { params }).then(r => r.data),
  saveModel: (m: AiModel) => api.post<AiModel>('/models', m).then(r => r.data),
  deleteModel: (id: number) => api.delete(`/models/${id}`).then(r => r.data),
  toggleModel: (id: number) => api.post<AiModel>(`/models/${id}/toggle`).then(r => r.data),

  // Conversations
  getConversations: () => api.get<AiConversation[]>('/chat/conversations').then(r => r.data),
  createConversation: (title?: string, modelKey?: string, providerKey?: string, systemPrompt?: string) =>
    api.post<AiConversation>('/chat/conversations', { title, model_key: modelKey, provider_key: providerKey, system_prompt: systemPrompt }).then(r => r.data),
  getConversationDetail: (id: number) => api.get<{ conversation: AiConversation; messages: AiMessage[] }>(`/chat/conversations/${id}`).then(r => r.data),
  updateConversation: (id: number, title?: string, systemPrompt?: string) =>
    api.put<AiConversation>(`/chat/conversations/${id}`, { title, system_prompt: systemPrompt }).then(r => r.data),
  deleteConversation: (id: number) => api.delete(`/chat/conversations/${id}`).then(r => r.data),

  // Chat
  sendChat: (body: any) => api.post('/chat/completions', body).then(r => r.data),

  // Images
  generateImage: (body: any) => api.post<GenerationTask>('/images/generate', body).then(r => r.data),
  getImageTasks: () => api.get<GenerationTask[]>('/images/tasks').then(r => r.data),

  // Videos
  generateVideo: (body: any) => api.post<GenerationTask>('/videos/generate', body).then(r => r.data),
  getVideoTasks: () => api.get<GenerationTask[]>('/videos/tasks').then(r => r.data),

  // Logs & Stats
  getLogs: (callType?: string) => api.get<AiCallLog[]>('/logs', { params: { callType } }).then(r => r.data),
  getStats: () => api.get<CallStats>('/logs/stats').then(r => r.data),
};
