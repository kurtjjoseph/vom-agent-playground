import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../index';
import { createLogger } from '../lib/logger';

const logger = createLogger('agent-executor');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'OPUS_4': { input: 0.005, output: 0.025 }, // per 1k tokens
  'SONNET_4': { input: 0.003, output: 0.015 },
  'HAIKU_4': { input: 0.001, output: 0.005 },
};

// The LLMModel enum names are historical; they map to the current model IDs.
const MODEL_NAMES: Record<string, string> = {
  'OPUS_4': 'claude-opus-5',
  'SONNET_4': 'claude-sonnet-5',
  'HAIKU_4': 'claude-haiku-4-5',
};

export async function runAgent(agentId: string, input: string, runId: string) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.enabled) {
      throw new Error(`Agent ${agentId} is disabled`);
    }

    const modelName = MODEL_NAMES[agent.model];
    if (!modelName) {
      throw new Error(`Unknown model: ${agent.model}`);
    }

    logger.info(`Running agent ${agentId} with input: ${input.slice(0, 100)}...`);

    const startTime = Date.now();
    let completionTokens = 0;
    let promptTokens = 0;

    const response = await anthropic.messages.create({
      model: modelName,
      max_tokens: agent.maxTokens,
      system: agent.systemPrompt,
      messages: [
        {
          role: 'user',
          content: input,
        },
      ],
    });

    const output = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract token usage
    if (response.usage) {
      promptTokens = response.usage.input_tokens;
      completionTokens = response.usage.output_tokens;
    }

    const duration = Date.now() - startTime;

    // Calculate cost
    const pricing = MODEL_PRICING[agent.model];
    const costEstimate =
      (promptTokens / 1000) * pricing.input + (completionTokens / 1000) * pricing.output;

    // Update run with results
    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        output,
        status: 'SUCCESS',
        duration,
        tokenUsage: {
          inputTokens: promptTokens,
          outputTokens: completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        costEstimate,
      },
    });

    // Update agent stats
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        lastRun: new Date(),
        executionCount: agent.executionCount + 1,
        successCount: agent.successCount + 1,
        totalCost: agent.totalCost + costEstimate,
      },
    });

    logger.info(`Agent ${agentId} executed successfully in ${duration}ms`);
  } catch (error) {
    logger.error(`Agent ${agentId} execution failed:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update run with error
    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        error: errorMessage,
      },
    }).catch((updateError) => {
      logger.error('Failed to update run with error:', updateError);
    });

    // Update agent failure count
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (agent) {
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          executionCount: agent.executionCount + 1,
        },
      }).catch((updateError) => {
        logger.error('Failed to update agent stats:', updateError);
      });
    }
  }
}

export async function streamAgentRun(
  agentId: string,
  input: string,
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void
) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const modelName = MODEL_NAMES[agent.model];
    if (!modelName) {
      throw new Error(`Unknown model: ${agent.model}`);
    }

    const stream = anthropic.messages.stream({
      model: modelName,
      max_tokens: agent.maxTokens,
      system: agent.systemPrompt,
      messages: [
        {
          role: 'user',
          content: input,
        },
      ],
    });

    stream.on('text', onChunk);

    await stream.finalMessage();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError(err);
  }
}
