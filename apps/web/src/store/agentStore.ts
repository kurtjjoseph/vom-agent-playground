import { create } from 'zustand';
import { Agent, AgentRun } from '../lib/api';

interface AgentStore {
  agents: Agent[];
  selectedAgent: Agent | null;
  currentRun: AgentRun | null;
  isLoading: boolean;
  error: string | null;

  setAgents: (agents: Agent[]) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  setCurrentRun: (run: AgentRun | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  selectedAgent: null,
  currentRun: null,
  isLoading: false,
  error: null,

  setAgents: (agents) => set({ agents }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setCurrentRun: (run) => set({ currentRun: run }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
  updateAgent: (agent) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === agent.id ? agent : a)),
      selectedAgent: state.selectedAgent?.id === agent.id ? agent : state.selectedAgent,
    })),
  removeAgent: (agentId) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== agentId),
      selectedAgent: state.selectedAgent?.id === agentId ? null : state.selectedAgent,
    })),
}));
