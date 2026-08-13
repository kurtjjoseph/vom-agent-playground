import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../lib/logger';

const logger = createLogger('auth');

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.slice(7);

    // In production, verify JWT token properly
    // For MVP, we'll accept the token as-is and validate via session in NextAuth
    const sessionToken = token;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // TODO: Validate session via NextAuth or JWT
    // For now, extract userId from token (in real implementation, decode JWT)
    req.userId = req.headers['x-user-id'] as string;

    if (!req.userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Webhook auth - verify webhook signature
export function webhookAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signature = req.headers['x-webhook-signature'];

  if (!signature) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  // TODO: Verify signature against webhook secret
  next();
}
