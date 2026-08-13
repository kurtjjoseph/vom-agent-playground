import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { createLogger } from '../lib/logger';

const router = Router();
const logger = createLogger('auth-routes');

// GitHub OAuth callback endpoint
router.post('/github/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // In production, exchange code for GitHub access token
    // For MVP, accept the code and create/update user session
    const githubId = state || 'temp-github-id';

    const user = await prisma.user.upsert({
      where: { githubId },
      update: { updatedAt: new Date() },
      create: {
        githubId,
        email: `user-${githubId}@github.local`,
        name: `User ${githubId}`,
      },
    });

    // Create session token (in production, use proper JWT)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    res.json({
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error('GitHub auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify session
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ error: 'Missing session token' });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    res.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
    });
  } catch (error) {
    logger.error('Session verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.body;

    if (sessionToken) {
      await prisma.session.delete({
        where: { sessionToken },
      }).catch(() => {
        // Session may not exist, ignore error
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
