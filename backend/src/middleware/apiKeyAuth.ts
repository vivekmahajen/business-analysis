import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const PLAN_LIMITS = {
  free:         { callsPerMonth: 100,  callsPerMinute: 2,  reportDepth: 'preview',  webhooks: false, llmVisibility: false, maxRadius: 25  },
  starter:      { callsPerMonth: 500,  callsPerMinute: 5,  reportDepth: 'standard', webhooks: true,  llmVisibility: false, maxRadius: 100 },
  professional: { callsPerMonth: 2000, callsPerMinute: 10, reportDepth: 'deep',     webhooks: true,  llmVisibility: true,  maxRadius: 100 },
  enterprise:   { callsPerMonth: -1,   callsPerMinute: 30, reportDepth: 'deep',     webhooks: true,  llmVisibility: true,  maxRadius: 100 },
} as const;

export type ApiPlanName = keyof typeof PLAN_LIMITS;
export type ApiPlan = typeof PLAN_LIMITS[ApiPlanName];

export interface ApiKeyRequest extends Request {
  apiKey: {
    id: string;
    userId: string;
    keyHash: string;
    keyPrefix: string;
    name: string | null;
    plan: string;
    callsThisMonth: number;
    callsTotal: bigint;
    isActive: boolean;
  };
  apiPlan: ApiPlan;
}

const keyCache = new Map<string, { record: ApiKeyRequest['apiKey']; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function invalidateApiKeyCache(keyHash: string) {
  keyCache.delete(keyHash);
}

function hashKey(rawKey: string) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// RapidAPI proxy requests: verified by secret header, user identified by X-RapidAPI-User
function handleRapidApiRequest(req: Request, res: Response, next: NextFunction) {
  const rapidApiUser = (req.headers['x-rapidapi-user'] as string) || 'anonymous';
  const rapidApiSubscription = (req.headers['x-rapidapi-subscription'] as string) || 'BASIC';

  const planMap: Record<string, ApiPlanName> = {
    BASIC: 'free', STARTER: 'starter', PRO: 'starter',
    ULTRA: 'professional', MEGA: 'professional', ENTERPRISE: 'enterprise',
  };
  const planName: ApiPlanName = planMap[rapidApiSubscription.toUpperCase()] ?? 'free';
  const plan = PLAN_LIMITS[planName];

  // Synthetic key record for RapidAPI users (not stored in DB)
  (req as ApiKeyRequest).apiKey = {
    id: `rapidapi_${rapidApiUser}`,
    userId: `rapidapi_${rapidApiUser}`,
    keyHash: '',
    keyPrefix: 'rapidapi',
    name: `RapidAPI: ${rapidApiUser}`,
    plan: planName,
    callsThisMonth: 0,
    callsTotal: BigInt(0),
    isActive: true,
  };
  (req as ApiKeyRequest).apiPlan = plan;

  res.setHeader('X-RateLimit-Plan', planName);
  next();
}

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // RapidAPI sends a proxy secret to prove requests come through their gateway
  const rapidApiProxySecret = process.env.RAPIDAPI_PROXY_SECRET;
  const incomingProxySecret = req.headers['x-rapidapi-proxy-secret'] as string | undefined;

  if (rapidApiProxySecret && incomingProxySecret && incomingProxySecret === rapidApiProxySecret) {
    return handleRapidApiRequest(req, res, next);
  }

  const rawKey = req.headers['x-api-key'] as string | undefined;

  if (!rawKey) {
    return res.status(401).json({ error: { code: 'INVALID_API_KEY', message: 'API key required — pass X-API-Key header.' } });
  }

  const keyHash = hashKey(rawKey);

  let keyRecord = keyCache.get(keyHash);
  let record: ApiKeyRequest['apiKey'] | null = null;
  if (keyRecord && Date.now() < keyRecord.expiresAt) {
    record = keyRecord.record;
  } else {
    record = await prisma.apiKey.findUnique({ where: { keyHash } }) as ApiKeyRequest['apiKey'] | null;
    if (record) {
      keyCache.set(keyHash, { record, expiresAt: Date.now() + CACHE_TTL });
    }
  }

  if (!record || !record.isActive) {
    return res.status(401).json({ error: { code: 'INVALID_API_KEY', message: 'Invalid or revoked API key.' } });
  }

  const planName = (record.plan in PLAN_LIMITS ? record.plan : 'free') as ApiPlanName;
  const plan = PLAN_LIMITS[planName];

  if (plan.callsPerMonth !== -1 && record.callsThisMonth >= plan.callsPerMonth) {
    return res.status(402).json({
      error: {
        code: 'QUOTA_EXCEEDED',
        message: `Monthly quota of ${plan.callsPerMonth} calls exceeded. Upgrade at siteanalyzerpro.com/pricing`,
      },
    });
  }

  (req as ApiKeyRequest).apiKey = record;
  (req as ApiKeyRequest).apiPlan = plan;

  const remaining = plan.callsPerMonth === -1 ? 999999 : plan.callsPerMonth - record.callsThisMonth;
  res.setHeader('X-RateLimit-Limit', plan.callsPerMonth === -1 ? 'unlimited' : String(plan.callsPerMonth));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Plan', planName);

  const startMs = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - startMs;
    prisma.apiKey.update({
      where: { id: record!.id },
      data: { callsThisMonth: { increment: 1 }, callsTotal: { increment: 1 }, lastUsedAt: new Date() },
    }).catch(console.error);
    prisma.apiUsageLog.create({
      data: { apiKeyId: record!.id, endpoint: req.path, method: req.method, statusCode: res.statusCode, responseMs: ms },
    }).catch(console.error);
  });

  next();
}
