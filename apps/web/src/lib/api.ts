import axios, { AxiosInstance } from 'axios';
import { Session } from 'next-auth';

let apiClient: AxiosInstance;

export function initializeApiClient(session: Session | null) {
  apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (session?.user?.id) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${session.user.id}`;
    apiClient.defaults.headers.common['x-user-id'] = session.user.id;
  }

  return apiClient;
}

export function getApiClient() {
  if (!apiClient) {
    apiClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  return apiClient;
}

// API interfaces
export interface Agent {
  id: string;
  name: string;
  description?: string;
  archetype: string;
  systemPrompt: string;
  model: 'OPUS_4' | 'SONNET_4' | 'HAIKU_4';
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  isPublished: boolean;
  config: Record<string, any>;
  lastRun?: Date;
  executionCount: number;
  successCount: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
  runCount?: number;
}

export interface AgentRun {
  id: string;
  agentId: string;
  input: string;
  output?: string;
  error?: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  costEstimate: number;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description?: string;
  archetype: string;
  systemPrompt: string;
  model: 'OPUS_4' | 'SONNET_4' | 'HAIKU_4';
  configTemplate: Record<string, any>;
}

export interface Integration {
  id: string;
  type: 'SLACK' | 'GOOGLE_DRIVE' | 'WEBHOOK' | 'EMAIL' | 'GITHUB';
  name: string;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Webhook {
  id: string;
  agentId: string;
  url: string;
  event: string;
  active: boolean;
  lastTriggered?: Date;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Agent API calls
export const agentApi = {
  list: () => getApiClient().get<Agent[]>('/agents'),
  get: (id: string) => getApiClient().get<Agent>(`/agents/${id}`),
  create: (data: Partial<Agent>) => getApiClient().post<Agent>('/agents', data),
  update: (id: string, data: Partial<Agent>) =>
    getApiClient().patch<Agent>(`/agents/${id}`, data),
  delete: (id: string) => getApiClient().delete(`/agents/${id}`),
  toggle: (id: string) => getApiClient().patch<Agent>(`/agents/${id}/toggle`, {}),
};

// Agent run API calls
export const agentRunApi = {
  test: (agentId: string, input: string) =>
    getApiClient().post<AgentRun>('/agent-runs/test', { agentId, input }),
  get: (id: string) => getApiClient().get<AgentRun>(`/agent-runs/${id}`),
  listByAgent: (agentId: string, limit?: number, offset?: number) =>
    getApiClient().get<{ runs: AgentRun[]; total: number }>(
      `/agent-runs/agent/${agentId}`,
      { params: { limit, offset } }
    ),
  stats: (agentId: string) =>
    getApiClient().get<any>(`/agent-runs/stats/${agentId}`),
};

// Template API calls
export const templateApi = {
  list: () => getApiClient().get<AgentTemplate[]>('/templates'),
  get: (id: string) => getApiClient().get<AgentTemplate>(`/templates/${id}`),
};

// Integration API calls
export const integrationApi = {
  list: () => getApiClient().get<Integration[]>('/integrations'),
  get: (id: string) => getApiClient().get<Integration>(`/integrations/${id}`),
  create: (data: Partial<Integration>) =>
    getApiClient().post<Integration>('/integrations', data),
  update: (id: string, data: Partial<Integration>) =>
    getApiClient().patch<Integration>(`/integrations/${id}`, data),
  delete: (id: string) => getApiClient().delete(`/integrations/${id}`),
};

// Webhook API calls
export const webhookApi = {
  listByAgent: (agentId: string) =>
    getApiClient().get<Webhook[]>(`/webhooks/agent/${agentId}`),
  create: (data: Partial<Webhook>) =>
    getApiClient().post<Webhook>('/webhooks', data),
  delete: (id: string) => getApiClient().delete(`/webhooks/${id}`),
  toggle: (id: string) =>
    getApiClient().patch<Webhook>(`/webhooks/${id}/toggle`, {}),
};
