import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export type JwtPurpose = 'session' | 'pending_2fa' | 'pending_profile';

export interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
  jwtPurpose?: JwtPurpose;
}

function verifyToken(token: string): { userId: string; purpose?: string } {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; purpose?: string };
}

// requireAuth: accepts any valid token (backward-compat: missing purpose = session)
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.jwtPurpose = (payload.purpose as JwtPurpose) ?? 'session';
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// requireFullSession: only accepts session tokens (not pending_* tokens)
export function requireFullSession(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const payload = verifyToken(token);
    const purpose = (payload.purpose as JwtPurpose) ?? 'session';
    if (purpose !== 'session') {
      res.status(403).json({ error: 'Profile setup required', code: 'PROFILE_INCOMPLETE' });
      return;
    }
    req.userId = payload.userId;
    req.jwtPurpose = 'session';
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// requirePending2FA: only accepts pending_2fa tokens
export function requirePending2FA(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const payload = verifyToken(token);
    if (payload.purpose !== 'pending_2fa') {
      res.status(403).json({ error: 'Invalid token type for this endpoint' });
      return;
    }
    req.userId = payload.userId;
    req.jwtPurpose = 'pending_2fa';
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// requirePendingProfile: only accepts pending_profile tokens
export function requirePendingProfile(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const payload = verifyToken(token);
    if (payload.purpose !== 'pending_profile') {
      res.status(403).json({ error: 'Invalid token type for this endpoint' });
      return;
    }
    req.userId = payload.userId;
    req.jwtPurpose = 'pending_profile';
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true },
    });
    if (!user?.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    req.isAdmin = true;
    next();
  } catch {
    res.status(500).json({ error: 'Authorization check failed' });
  }
}
