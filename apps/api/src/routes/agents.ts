import { Router } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../lib/logger';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

const router = Router();
const logger = createLogger('agent-routes');

// Create agent
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, description, templateId, archetype, systemPrompt, model } = req.body;

    if (!name || !archetype) {
      throw new ValidationError('Name and archetype are required');
    }

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const agent = await prisma.agent.create({
      data: {
        userId: req.userId,
        name,
        description,
        archetype,
        systemPrompt: systemPrompt || `You are a helpful AI assistant. Respond to user requests professionally.`,
        model: model || 'SONNET_4',
        templateId,
        config: {},
      },
    });

    res.status(201).json(agent);
  } catch (error) {
    logger.error('Create agent error:', error);
    throw error;
  }
});

// List agents
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const agents = await prisma.agent.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: true,
        _count: {
          select: { runs: true },
        },
      },
    });

    const agentsWithStats = agents.map((agent) => ({
      ...agent,
      runCount: agent._count.runs,
      _count: undefined,
    }));

    res.json(agentsWithStats);
  } catch (error) {
    logger.error('List agents error:', error);
    throw error;
  }
});

// Get agent by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const agent = await prisma.agent.findFirst({
      where: { id, userId: req.userId },
      include: {
        template: true,
        integrations: true,
        webhooks: true,
      },
    });

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    res.json(agent);
  } catch (error) {
    logger.error('Get agent error:', error);
    throw error;
  }
});

// Update agent
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const agent = await prisma.agent.findFirst({
      where: { id, userId: req.userId },
    });

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    const updated = await prisma.agent.update({
      where: { id },
      data: updates,
    });

    res.json(updated);
  } catch (error) {
    logger.error('Update agent error:', error);
    throw error;
  }
});

// Delete agent
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const agent = await prisma.agent.findFirst({
      where: { id, userId: req.userId },
    });

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    await prisma.agent.delete({
      where: { id },
    });

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    logger.error('Delete agent error:', error);
    throw error;
  }
});

// Toggle agent enabled status
router.patch('/:id/toggle', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const agent = await prisma.agent.findFirst({
      where: { id, userId: req.userId },
    });

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    const updated = await prisma.agent.update({
      where: { id },
      data: { enabled: !agent.enabled },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Toggle agent error:', error);
    throw error;
  }
});

export default router;
