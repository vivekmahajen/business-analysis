import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { sendSms } from './sms';

const OTP_TTL_MS = 10 * 60 * 1000;       // 10 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_S = 60;             // 60 seconds between resends
const HOURLY_SEND_LIMIT = 5;
const DAILY_SEND_LIMIT = 10;

// In-memory fallback store for dev mode when DB tables don't exist yet
const devOtpStore = new Map<string, { hash: string; expiresAt: Date }>();

export class OtpError extends Error {
  constructor(
    message: string,
    public readonly code: 'RATE_LIMITED' | 'MAX_ATTEMPTS' | 'INVALID' | 'EXPIRED' | 'NOT_FOUND',
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

function hashOtp(otp: string, userId: string): string {
  const pepper = process.env.OTP_PEPPER || '';
  return crypto.createHash('sha256').update(`${otp}:${userId}:${pepper}`).digest('hex');
}

async function checkSendRateLimit(userId: string): Promise<void> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [hourlyCount, dailyCount] = await Promise.all([
    prisma.otpChallenge.count({ where: { userId, createdAt: { gte: oneHourAgo } } }),
    prisma.otpChallenge.count({ where: { userId, createdAt: { gte: oneDayAgo } } }),
  ]);

  if (hourlyCount >= HOURLY_SEND_LIMIT) {
    throw new OtpError('Too many OTP requests. Please try again in an hour.', 'RATE_LIMITED', 3600);
  }
  if (dailyCount >= DAILY_SEND_LIMIT) {
    throw new OtpError('Daily OTP limit reached. Please try again tomorrow.', 'RATE_LIMITED', 86400);
  }
}

export async function sendOtp(
  userId: string,
  phone: string,
  purpose: 'login_2fa' | 'phone_verify',
): Promise<void> {
  const devMode = !process.env.TWILIO_ACCOUNT_SID;

  if (!devMode) {
    // Check resend cooldown on the most recent challenge for this purpose
    const recent = await prisma.otpChallenge.findFirst({
      where: { userId, purpose },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      const cooldownEndsAt = new Date(recent.lastSentAt.getTime() + RESEND_COOLDOWN_S * 1000);
      if (new Date() < cooldownEndsAt) {
        const waitSeconds = Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 1000);
        throw new OtpError(
          `Please wait ${waitSeconds}s before requesting another code.`,
          'RATE_LIMITED',
          waitSeconds,
        );
      }
    }
    await checkSendRateLimit(userId);
  }

  const otp = String(crypto.randomInt(100000, 999999));
  const otpHash = hashOtp(otp, userId);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Log immediately in dev mode so it appears in logs even if DB ops fail
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[OTP dev] userId=${userId} purpose=${purpose} code=${otp}`);
  }

  // Replace any existing challenge for this purpose atomically
  try {
    await prisma.$transaction([
      prisma.otpChallenge.deleteMany({ where: { userId, purpose } }),
      prisma.otpChallenge.create({
        data: { userId, purpose, otpHash, expiresAt },
      }),
    ]);
  } catch (dbErr) {
    if (devMode) {
      console.error('[OTP dev] DB save failed, using memory store:', (dbErr as Error).message);
      devOtpStore.set(`${userId}:${purpose}`, { hash: otpHash, expiresAt });
      return;
    }
    throw dbErr;
  }

  await sendSms(phone, `Your SiteAnalyzer verification code is: ${otp}. Valid for 10 minutes.`);
}

export async function verifyOtp(
  userId: string,
  otp: string,
  purpose: 'login_2fa' | 'phone_verify',
): Promise<void> {
  const devMode = !process.env.TWILIO_ACCOUNT_SID;
  const expectedHash = hashOtp(otp, userId);

  // Dev mode: check in-memory store first
  if (devMode) {
    const devKey = `${userId}:${purpose}`;
    const devEntry = devOtpStore.get(devKey);
    if (devEntry) {
      if (devEntry.expiresAt < new Date()) {
        devOtpStore.delete(devKey);
        throw new OtpError('Verification code has expired. Please request a new one.', 'EXPIRED');
      }
      if (devEntry.hash !== expectedHash) {
        throw new OtpError('Invalid code. Please check the Railway logs for the correct code.', 'INVALID');
      }
      devOtpStore.delete(devKey);
      return;
    }
    // Fall through to DB check if not in memory store
  }

  const challenge = await prisma.otpChallenge.findFirst({
    where: { userId, purpose },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) {
    throw new OtpError('No active verification code found. Please request a new one.', 'NOT_FOUND');
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } });
    throw new OtpError('Too many failed attempts. Please request a new code.', 'MAX_ATTEMPTS');
  }
  if (challenge.expiresAt < new Date()) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } });
    throw new OtpError('Verification code has expired. Please request a new one.', 'EXPIRED');
  }

  if (challenge.otpHash !== expectedHash) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_ATTEMPTS - challenge.attempts - 1;
    throw new OtpError(
      remaining > 0
        ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Invalid code. No attempts remaining — please request a new code.',
      'INVALID',
    );
  }

  // Valid — consume the challenge
  await prisma.otpChallenge.delete({ where: { id: challenge.id } });
}

export async function generateRecoveryCodes(userId: string): Promise<string[]> {
  const codes: string[] = [];
  const hashed: string[] = [];

  for (let i = 0; i < 8; i++) {
    const raw = crypto.randomBytes(16).toString('hex');
    codes.push(raw);
    hashed.push(crypto.createHash('sha256').update(raw).digest('hex'));
  }

  await prisma.$transaction([
    prisma.recoveryCode.deleteMany({ where: { userId } }),
    ...hashed.map(codeHash => prisma.recoveryCode.create({ data: { userId, codeHash } })),
  ]);

  return codes;
}

export async function useRecoveryCode(userId: string, rawCode: string): Promise<void> {
  const codeHash = crypto.createHash('sha256').update(rawCode.trim()).digest('hex');
  const record = await prisma.recoveryCode.findFirst({
    where: { userId, codeHash, usedAt: null },
  });
  if (!record) {
    throw new OtpError('Invalid or already-used recovery code.', 'INVALID');
  }
  await prisma.recoveryCode.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
}
