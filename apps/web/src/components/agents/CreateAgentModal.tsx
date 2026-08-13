'use client';

import { useState } from 'react';
import { agentApi, templateApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const ARCHETYPES = [
  { id: 'SLACK_RESPONDER', name: 'Slack Responder', icon: '💬' },
  { id: 'GOOGLE_DRIVE_SCANNER', name: 'Google Drive Scanner', icon: '📁' },
  { id: 'WEBHOOK_LISTENER', name: 'Webhook Listener', icon: '🔗' },
  { id: 'EMAIL_PROCESSOR', name: 'Email Processor', icon: '📧' },
  { id: 'DATA_ANALYST', name: 'Data Analyst', icon: '📊' },
];

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAgentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAgentModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    archetype: '',
    templateId: '',
    systemPrompt: '',
    model: 'SONNET_4',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await templateApi.list();
      return response.data;
    },
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.archetype) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await agentApi.create({
        name: formData.name,
        description: formData.description,
        archetype: formData.archetype,
        systemPrompt: formData.systemPrompt,
        model: formData.model as any,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert('Failed to create agent');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Agent
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === 1 ? (
            <>
              {/* Step 1: Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Slack Support Bot"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this agent do?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Select Archetype *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ARCHETYPES.map((arch) => (
                    <button
                      key={arch.id}
                      onClick={() => setFormData({ ...formData, archetype: arch.id })}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        formData.archetype === arch.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900'
                          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400'
                      }`}
                    >
                      <div className="text-2xl mb-2">{arch.icon}</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {arch.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  System Prompt
                </label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  placeholder="Define the agent's behavior and personality..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  LLM Model
                </label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="OPUS_4">Claude Opus 4 (Most capable)</option>
                  <option value="SONNET_4">Claude Sonnet 4 (Balanced)</option>
                  <option value="HAIKU_4">Claude Haiku 4 (Fastest/Cheapest)</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Step {step} of 2
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.archetype}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition"
              >
                {isLoading ? 'Creating...' : 'Create Agent'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
