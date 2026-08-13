'use client';

import Link from 'next/link';
import { Agent } from '@/lib/api';
import AgentCard from './AgentCard';

interface AgentListProps {
  agents: Agent[];
  onRefresh: () => void;
}

export default function AgentList({ agents, onRefresh }: AgentListProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No agents found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
