import { Router } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../lib/logger';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

const router = Router();
const logger = createLogger('integrations-routes');

// Create integration
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { type, name, config } = req.body;

    if (!type || !name) {
      throw new ValidationError('Type and name are required');
    }

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const integration = await prisma.integration.create({
      data: {
        userId: req.userId,
        type,
        name,
        config,
      },
    });

    res.status(201).json(integration);
  } catch (error) {
    logger.error('Create integration error:', error);
    throw error;
  }
});

// List integrations
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const integrations = await prisma.integration.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(integrations);
  } catch (error) {
    logger.error('List integrations error:', error);
    throw error;
  }
});

// Get integration
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const integration = await prisma.integration.findFirst({
      where: { id, userId: req.userId },
    });

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    res.json(integration);
  } catch (error) {
    logger.error('Get integration error:', error);
    throw error;
  }
});

// Update integration
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const integration = await prisma.integration.findFirst({
      where: { id, userId: req.userId },
    });

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    const updated = await prisma.integration.update({
      where: { id },
      data: updates,
    });

    res.json(updated);
  } catch (error) {
    logger.error('Update integration error:', error);
    throw error;
  }
});

// Delete integration
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      throw new ValidationError('User ID is required');
    }

    const integration = await prisma.integration.findFirst({
      where: { id, userId: req.userId },
    });

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    await prisma.integration.delete({
      where: { id },
    });

    res.json({ message: 'Integration deleted successfully' });
  } catch (error) {
    logger.error('Delete integration error:', error);
    throw error;
  }
});

export default router;
