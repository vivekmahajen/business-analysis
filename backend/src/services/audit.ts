import { Request } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export type AuditEvent =
  | 'register'
  | 'login_success'
  | 'login_failed'
  | 'otp_sent'
  | 'otp_verified'
  | 'otp_failed'
  | 'phone_verified'
  | 'profile_completed'
  | 'recovery_code_used'
  | 'recovery_code_failed'
  | 'recovery_codes_generated'
  | 'password_reset_requested'
  | 'password_reset_completed';

export function getClientIp(req: Request): string | null {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
}

export function logAudit(
  event: AuditEvent,
  success: boolean,
  req: Request,
  userId?: string,
  metadata?: Record<string, unknown>,
): void {
  prisma.authAuditLog.create({
    data: {
      userId: userId ?? null,
      event,
      success,
      ipAddress: getClientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
      ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
  }).catch((err: unknown) => console.error('[audit] write failed:', err));
}
