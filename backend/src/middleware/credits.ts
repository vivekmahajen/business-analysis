import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth';

export async function checkAndDeductCredit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true, plan: true, creditsRemaining: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Admins and agency plan have unlimited access
    if (user.isAdmin || user.plan === 'agency') {
      next();
      return;
    }

    if (user.creditsRemaining <= 0) {
      res.status(402).json({
        error: 'No credits remaining. Please upgrade your plan to continue.',
        code: 'CREDITS_EXHAUSTED',
        plan: user.plan,
        creditsRemaining: 0,
      });
      return;
    }

    // Atomically deduct 1 credit
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.userId },
        data: { creditsRemaining: { decrement: 1 } },
      }),
      prisma.creditTransaction.create({
        data: { userId: req.userId, delta: -1, reason: 'report_generated' },
      }),
    ]);

    next();
  } catch (err) {
    console.error('Credit check error:', err);
    res.status(500).json({ error: 'Credit check failed' });
  }
}
