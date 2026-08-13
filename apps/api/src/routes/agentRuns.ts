import { Router } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../lib/logger';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { runAgent } from '../services/agentExecutor';

const router = Router();
const logger = createLogger('agent-runs-routes');

// Create and run agent
router.post('/test', async (req: AuthRequest, res) => {
  try {
    const { agentId, input } = req.body;

    if (!agentId || !input) {
      throw new ValidationError('Agent ID and input are required');
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

    // Create run record
    const run = await prisma.agentRun.create({
      data: {
        agentId,
        userId: req.userId,
        input,
        status: 'RUNNING',
      },
    });

    // Execute agent (non-blocking)
    runAgent(agentId, input, run.id).catch((error) => {
      logger.error('Agent execution error:', error);
    });

    res.status(201).json(run);
  } catch (error) {
    logger.error('Test agent error:', error);
    throw error;
  }
});

// Get run by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const run = await prisma.agentRun.findFirst({
      where: { id, userId: req.userId },
    });

    if (!run) {
      throw new NotFoundError('Run not found');
    }

    res.json(run);
  } catch (error) {
    logger.error('Get run error:', error);
    throw error;
  }
});

// List runs for agent
router.get('/agent/:agentId', async (req: AuthRequest, res) => {
  try {
    const { agentId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: req.userId },
    });

    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    const runs = await prisma.agentRun.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit as string) || 20, 100),
      skip: parseInt(offset as string) || 0,
    });

    const total = await prisma.agentRun.count({ where: { agentId } });

    res.json({
      runs,
      total,
      limit: parseInt(limit as string) || 20,
      offset: parseInt(offset as string) || 0,
    });
  } catch (error) {
    logger.error('List runs error:', error);
    throw error;
  }
});

// Get dashboard stats
router.get('/stats/:agentId', async (req: AuthRequest, res) => {
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

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const runs7d = await prisma.agentRun.findMany({
      where: {
        agentId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const totalRuns = runs7d.length;
    const successfulRuns = runs7d.filter((r) => r.status === 'SUCCESS').length;
    const failedRuns = runs7d.filter((r) => r.status === 'FAILED').length;
    const totalCost = runs7d.reduce((sum, r) => sum + (r.costEstimate || 0), 0);

    res.json({
      lastRun: agent.lastRun,
      totalExecutions: agent.executionCount,
      successRate: agent.executionCount > 0 ? (agent.successCount / agent.executionCount) * 100 : 0,
      sevenDayStats: {
        totalRuns,
        successfulRuns,
        failedRuns,
        estimatedCost: totalCost,
        averageCostPerRun: totalRuns > 0 ? totalCost / totalRuns : 0,
      },
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    throw error;
  }
});

export default router;
