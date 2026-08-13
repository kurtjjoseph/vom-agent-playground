'use client';

import Link from 'next/link';
import { Agent, agentApi } from '@/lib/api';
import { useState } from 'react';

interface AgentCardProps {
  agent: Agent;
  onRefresh: () => void;
}

export default function AgentCard({ agent, onRefresh }: AgentCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsToggling(true);
    try {
      await agentApi.toggle(agent.id);
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle agent:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this agent?')) return;

    setIsDeleting(true);
    try {
      await agentApi.delete(agent.id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete agent:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const successRate = agent.executionCount > 0
    ? (agent.successCount / agent.executionCount) * 100
    : 0;

  return (
    <Link href={`/agents/${agent.id}`}>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {agent.description || 'No description'}
            </p>
          </div>
          <div onClick={(e) => e.preventDefault()}>
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                agent.enabled
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {agent.enabled ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-t border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Model</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {agent.model}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Runs</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {agent.executionCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Success Rate</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {successRate.toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Cost (7d)</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              ${agent.totalCost.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Last Run */}
        <div className="mb-4 text-xs text-gray-600 dark:text-gray-400">
          {agent.lastRun
            ? `Last run: ${new Date(agent.lastRun).toLocaleDateString()}`
            : 'Never run'}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto" onClick={(e) => e.preventDefault()}>
          <Link
            href={`/agents/${agent.id}`}
            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition text-center"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-3 py-2 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 text-sm font-medium rounded transition"
          >
            Delete
          </button>
        </div>
      </div>
    </Link>
  );
}
