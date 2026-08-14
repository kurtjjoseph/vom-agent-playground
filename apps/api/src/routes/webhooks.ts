import { Router } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../lib/logger';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { runAgent } from '../services/agentExecutor';

const router = Router();
const logger = createLogger('webhooks-routes');

// Create webhook for agent
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { agentId, url, event } = req.body;

    if (!agentId || !url || !event) {
      throw new ValidationError('Agent ID, URL, and event are required');
    }

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: req.userId },
    });

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    const secret = Buffer.from(`${agentId}:${Date.now()}`).toString('base64');

    const webhook = await prisma.webhook.create({
      data: {
        agentId,
        url,
        event,
        secret,
      },
    });

    res.status(201).json(webhook);
  } catch (error) {
    logger.error('Create webhook error:', error);
    throw error;
  }
});

// List webhooks for agent
router.get('/agent/:agentId', async (req: AuthRequest, res) => {
  try {
    const { agentId } = req.params;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: req.userId },
    });

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    const webhooks = await prisma.webhook.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(webhooks);
  } catch (error) {
    logger.error('List webhooks error:', error);
    throw error;
  }
});

// Handle incoming webhook
router.post('/trigger/:webhookId', async (req: AuthRequest, res) => {
  try {
    const { webhookId } = req.params;
    const payload = req.body;

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    if (!webhook.active) {
      throw new ValidationError('Webhook is not active');
    }

    // Execute agent with webhook payload
    const run = await prisma.agentRun.create({
      data: {
        agentId: webhook.agentId,
        userId: 'system', // Webhook runs as system
        input: JSON.stringify(payload),
        status: 'RUNNING',
        tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      },
    });

    await prisma.webhook.update({
      where: { id: webhookId },
      data: { lastTriggered: new Date() },
    });

    // Execute agent (non-blocking)
    runAgent(webhook.agentId, JSON.stringify(payload), run.id).catch((error) => {
      logger.error('Webhook execution error:', error);
    });

    res.json({ message: 'Webhook received', runId: run.id });
  } catch (error) {
    logger.error('Webhook trigger error:', error);
    throw error;
  }
});

// Delete webhook
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id },
      include: { agent: true },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    if (webhook.agent.userId !== req.userId) {
      throw new ValidationError('Unauthorized');
    }

    await prisma.webhook.delete({
      where: { id },
    });

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    logger.error('Delete webhook error:', error);
    throw error;
  }
});

// Toggle webhook
router.patch('/:id/toggle', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id },
      include: { agent: true },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    if (webhook.agent.userId !== req.userId) {
      throw new ValidationError('Unauthorized');
    }

    const updated = await prisma.webhook.update({
      where: { id },
      data: { active: !webhook.active },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Toggle webhook error:', error);
    throw error;
  }
});

export default router;
