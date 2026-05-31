import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { sendPasswordResetEmail } from '../services/email';

const router = Router();

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

const AGREEMENT_VERSION = '1.0';

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, agreedToTerms } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }
  if (!agreedToTerms) {
    res.status(400).json({ error: 'You must agree to the Terms of Service to create an account' });
    return;
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, isAdmin: isAdminEmail(email) },
      select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
    });

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
    await prisma.userAgreement.create({
      data: { userId: user.id, agreementVersion: AGREEMENT_VERSION, ipAddress: ip },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ message: 'Logged out successfully' });
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  // Always respond success to prevent email enumeration
  res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}?reset_token=${token}`;
    await sendPasswordResetEmail(user.email, resetLink, user.name);
  } catch (err) {
    console.error('forgot-password error:', err);
  }
});

router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  console.log('[reset-password] handler called, body keys:', Object.keys(req.body || {}));
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400).json({ error: 'Token and password are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }
  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
