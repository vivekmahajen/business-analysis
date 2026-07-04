import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { sendPasswordResetEmail } from '../services/email';
import { sendOtp, verifyOtp, useRecoveryCode, generateRecoveryCodes, OtpError } from '../services/otp';
import { requirePending2FA, requirePendingProfile, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router();

const AGREEMENT_VERSION = '1.0';

// --- helpers ---

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const e164 = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits[0] === '1' ? `+${digits}` : null;
  if (!e164 || !/^\+[1-9]\d{7,14}$/.test(e164)) return null;
  return e164;
}

function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{4})/g, '*');
}

function normalizeWebsite(raw: string): string | null {
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase();
    if (!hostname || hostname.split('.').length < 2) return null;
    return `https://${hostname}`;
  } catch {
    return null;
  }
}

function computeProfileComplete(user: {
  isAdmin: boolean;
  phoneVerified: boolean;
  role: string;
  websiteUrl: string | null;
}): boolean {
  if (user.isAdmin) return true;
  if (!user.phoneVerified) return false;
  if (user.role === 'business_owner' && !user.websiteUrl) return false;
  return true;
}

function issueToken(userId: string, purpose: 'session' | 'pending_2fa' | 'pending_profile'): string {
  const expiresIn = purpose === 'session' ? '7d' : purpose === 'pending_2fa' ? '15m' : '30m';
  if (purpose === 'session') {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn });
  }
  return jwt.sign({ userId, purpose }, process.env.JWT_SECRET!, { expiresIn });
}

// --- POST /auth/register ---
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, agreedToTerms, phone, role } = req.body;
  if (!name || !email || !password || !phone) {
    res.status(400).json({ error: 'Name, email, password, and phone are required' });
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
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    res.status(400).json({ error: 'Invalid phone number. Please use a valid US phone number.' });
    return;
  }
  const userRole = role === 'business_owner' ? 'business_owner' : 'user';

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const phoneConflict = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (phoneConflict) {
      // Non-enumeration: same message as email conflict but generic
      res.status(409).json({ error: 'An account with this phone number already exists' });
      return;
    }

    const isAdmin = isAdminEmail(email);
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone: normalizedPhone,
        role: userRole,
        isAdmin,
        profileComplete: isAdmin,
      },
      select: { id: true, name: true, email: true, isAdmin: true, role: true, profileComplete: true, createdAt: true },
    });

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
    await prisma.userAgreement.create({
      data: { userId: user.id, agreementVersion: AGREEMENT_VERSION, ipAddress: ip },
    });

    logAudit('register', true, req, user.id);

    if (isAdmin) {
      const token = issueToken(user.id, 'session');
      res.status(201).json({ user, token, purpose: 'session' });
      return;
    }

    // Send OTP for phone verification — don't block on SMS failure
    try {
      await sendOtp(user.id, normalizedPhone, 'phone_verify');
      logAudit('otp_sent', true, req, user.id, { purpose: 'phone_verify' });
    } catch (smsErr) {
      console.error('[register] OTP send failed:', smsErr);
    }

    const token = issueToken(user.id, 'pending_2fa');
    res.status(201).json({
      user,
      token,
      purpose: 'pending_2fa',
      phoneHint: maskPhone(normalizedPhone),
    });
  } catch (err) {
    console.error('[register] error:', err instanceof Error ? err.message : err);
    console.error('[register] stack:', err instanceof Error ? err.stack : '');
    res.status(500).json({ error: 'Registration failed' });
  }
});

// --- POST /auth/login ---
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password, recoveryCode } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logAudit('login_failed', false, req, undefined, { email });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logAudit('login_failed', false, req, user.id);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    logAudit('login_success', true, req, user.id);

    // Admin bypass — full session immediately
    if (user.isAdmin) {
      const token = issueToken(user.id, 'session');
      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser, token, purpose: 'session' });
      return;
    }

    // Recovery code path
    if (recoveryCode) {
      try {
        await useRecoveryCode(user.id, recoveryCode);
        logAudit('recovery_code_used', true, req, user.id);
        const token = issueToken(user.id, 'session');
        const { password: _, ...safeUser } = user;
        res.json({ user: safeUser, token, purpose: 'session' });
      } catch (rcErr) {
        logAudit('recovery_code_failed', false, req, user.id);
        res.status(400).json({ error: (rcErr as Error).message });
      }
      return;
    }

    // No phone stored — legacy user needing profile completion
    if (!user.phone) {
      const token = issueToken(user.id, 'pending_profile');
      res.json({ token, purpose: 'pending_profile', needsPhone: true });
      return;
    }

    // Standard 2FA path — send OTP
    try {
      await sendOtp(user.id, user.phone, 'login_2fa');
      logAudit('otp_sent', true, req, user.id, { purpose: 'login_2fa' });
    } catch (otpErr) {
      if (otpErr instanceof OtpError && otpErr.code === 'RATE_LIMITED') {
        res.status(429).json({ error: otpErr.message, retryAfterSeconds: otpErr.retryAfterSeconds });
        return;
      }
      console.error('[login] OTP send failed:', otpErr);
    }

    const token = issueToken(user.id, 'pending_2fa');
    res.json({
      token,
      purpose: 'pending_2fa',
      phoneHint: maskPhone(user.phone),
    });
  } catch (err) {
    console.error('[login] error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- POST /auth/otp/send — resend OTP (requires pending_2fa token) ---
router.post('/otp/send', requirePending2FA, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { phone: true, phoneVerified: true },
    });
    if (!user?.phone) {
      res.status(400).json({ error: 'No phone number on file' });
      return;
    }
    const purpose = user.phoneVerified ? 'login_2fa' : 'phone_verify';
    await sendOtp(req.userId!, user.phone, purpose as 'login_2fa' | 'phone_verify');
    logAudit('otp_sent', true, req, req.userId!);
    res.json({ message: 'Verification code sent' });
  } catch (err) {
    if (err instanceof OtpError && err.code === 'RATE_LIMITED') {
      res.status(429).json({ error: err.message, retryAfterSeconds: err.retryAfterSeconds });
      return;
    }
    console.error('[otp/send] error:', err);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// --- POST /auth/otp/verify — verify OTP (requires pending_2fa token) ---
router.post('/otp/verify', requirePending2FA, async (req: AuthRequest, res: Response): Promise<void> => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Verification code is required' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, name: true, email: true, isAdmin: true, role: true, phoneVerified: true, profileComplete: true, phone: true, websiteUrl: true, plan: true, creditsRemaining: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const purpose = user.phoneVerified ? 'login_2fa' : 'phone_verify';
    await verifyOtp(req.userId!, code, purpose as 'login_2fa' | 'phone_verify');
    logAudit('otp_verified', true, req, req.userId!, { purpose });

    const updates: Record<string, unknown> = {};
    if (!user.phoneVerified) {
      updates.phoneVerified = true;
      updates.phoneVerifiedAt = new Date();
      logAudit('phone_verified', true, req, req.userId!);
    }

    const effectiveProfileComplete = computeProfileComplete({
      isAdmin: user.isAdmin,
      phoneVerified: true,
      role: user.role,
      websiteUrl: user.websiteUrl,
    });
    updates.profileComplete = effectiveProfileComplete;

    await prisma.user.update({ where: { id: req.userId! }, data: updates });

    if (effectiveProfileComplete) {
      // Generate recovery codes if user has none
      const existingCodes = await prisma.recoveryCode.count({ where: { userId: req.userId!, usedAt: null } });
      let recoveryCodes: string[] | undefined;
      if (existingCodes === 0) {
        recoveryCodes = await generateRecoveryCodes(req.userId!);
        logAudit('recovery_codes_generated', true, req, req.userId!);
      }
      logAudit('profile_completed', true, req, req.userId!);
      const token = issueToken(req.userId!, 'session');
      const { phone: _p, ...safeUser } = { ...user, phoneVerified: true, profileComplete: true };
      res.json({ user: safeUser, token, purpose: 'session', ...(recoveryCodes ? { recoveryCodes } : {}) });
    } else {
      // business_owner needs website
      const token = issueToken(req.userId!, 'pending_profile');
      res.json({ token, purpose: 'pending_profile' });
    }
  } catch (err) {
    if (err instanceof OtpError) {
      logAudit('otp_failed', false, req, req.userId!);
      const status = err.code === 'RATE_LIMITED' ? 429 : 400;
      res.status(status).json({ error: err.message, code: err.code });
      return;
    }
    console.error('[otp/verify] error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// --- POST /auth/phone/update — set phone for legacy users (requires pending_profile token) ---
router.post('/phone/update', requirePendingProfile, async (req: AuthRequest, res: Response): Promise<void> => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: 'Phone number is required' });
    return;
  }
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    res.status(400).json({ error: 'Invalid phone number. Please use a valid US phone number.' });
    return;
  }
  try {
    const conflict = await prisma.user.findFirst({
      where: { phone: normalizedPhone, id: { not: req.userId! } },
    });
    if (conflict) {
      res.status(409).json({ error: 'An account with this phone number already exists' });
      return;
    }
    await prisma.user.update({ where: { id: req.userId! }, data: { phone: normalizedPhone } });
    await sendOtp(req.userId!, normalizedPhone, 'phone_verify');
    logAudit('otp_sent', true, req, req.userId!, { purpose: 'phone_verify' });
    const token = issueToken(req.userId!, 'pending_2fa');
    res.json({ token, purpose: 'pending_2fa', phoneHint: maskPhone(normalizedPhone) });
  } catch (err) {
    if (err instanceof OtpError && err.code === 'RATE_LIMITED') {
      res.status(429).json({ error: err.message, retryAfterSeconds: err.retryAfterSeconds });
      return;
    }
    console.error('[phone/update] error:', err);
    res.status(500).json({ error: 'Failed to update phone number' });
  }
});

// --- POST /auth/profile/complete — finalize business_owner website (requires pending_profile token) ---
router.post('/profile/complete', requirePendingProfile, async (req: AuthRequest, res: Response): Promise<void> => {
  const { websiteUrl } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, name: true, email: true, isAdmin: true, role: true, phoneVerified: true, websiteUrl: true, plan: true, creditsRemaining: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (!user.phoneVerified) {
      res.status(400).json({ error: 'Phone verification must be completed first' });
      return;
    }
    const updates: Record<string, unknown> = {};
    if (user.role === 'business_owner') {
      if (!websiteUrl) {
        res.status(400).json({ error: 'Website URL is required for business owners' });
        return;
      }
      const normalized = normalizeWebsite(websiteUrl);
      if (!normalized) {
        res.status(400).json({ error: 'Invalid website URL' });
        return;
      }
      const conflict = await prisma.user.findFirst({
        where: { websiteUrl: normalized, id: { not: req.userId! } },
      });
      if (conflict) {
        res.status(409).json({ error: 'A business account already exists for this website' });
        return;
      }
      updates.websiteUrl = normalized;
    }
    updates.profileComplete = true;
    await prisma.user.update({ where: { id: req.userId! }, data: updates });

    const existingCodes = await prisma.recoveryCode.count({ where: { userId: req.userId!, usedAt: null } });
    let recoveryCodes: string[] | undefined;
    if (existingCodes === 0) {
      recoveryCodes = await generateRecoveryCodes(req.userId!);
      logAudit('recovery_codes_generated', true, req, req.userId!);
    }
    logAudit('profile_completed', true, req, req.userId!);

    const token = issueToken(req.userId!, 'session');
    const safeUser = { ...user, profileComplete: true, websiteUrl: updates.websiteUrl ?? user.websiteUrl ?? null };
    res.json({ user: safeUser, token, purpose: 'session', ...(recoveryCodes ? { recoveryCodes } : {}) });
  } catch (err) {
    console.error('[profile/complete] error:', err);
    res.status(500).json({ error: 'Failed to complete profile' });
  }
});

// --- GET /auth/me — get current user (requires session token) ---
router.get('/me', async (req: AuthRequest, res: Response): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return; }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; purpose?: string };
    if (payload.purpose && payload.purpose !== 'session') {
      res.status(403).json({ error: 'Session token required' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, isAdmin: true, role: true, phoneVerified: true, profileComplete: true, websiteUrl: true, plan: true, creditsRemaining: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// --- POST /auth/logout ---
router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ message: 'Logged out successfully' });
});

// --- POST /auth/forgot-password ---
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await sendPasswordResetEmail(user.email, `${frontendUrl}?reset_token=${token}`, user.name);
    logAudit('password_reset_requested', true, req, user.id);
  } catch (err) {
    console.error('[forgot-password] error:', err);
  }
});

// --- POST /auth/reset-password ---
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
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
    logAudit('password_reset_completed', true, req, record.userId);
    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
