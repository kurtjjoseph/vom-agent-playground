'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { agentApi, Agent } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AgentList from '@/components/agents/AgentList';
import CreateAgentModal from '@/components/agents/CreateAgentModal';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: agents = [], isLoading, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      try {
        const response = await agentApi.list();
        return response.data;
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        return [];
      }
    },
    enabled: status === 'authenticated',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  if (status === 'loading') {
    return <DashboardLayout><div className="flex items-center justify-center h-full">Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Agent Playground
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Build and manage AI agents that automate tasks
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            + New Agent
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Agents</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {agents.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Active Agents</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {agents.filter((a: Agent) => a.enabled).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Executions</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {agents.reduce((sum: number, a: Agent) => sum + a.executionCount, 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">7-Day Cost</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              ${agents.reduce((sum: number, a: Agent) => sum + a.totalCost, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Agent List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading agents...</p>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No agents yet. Create your first agent to get started.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Create First Agent
            </button>
          </div>
        ) : (
          <AgentList agents={agents} onRefresh={refetch} />
        )}
      </div>

      {/* Create Agent Modal */}
      {isCreateModalOpen && (
        <CreateAgentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
        />
      )}
    </DashboardLayout>
  );
}
