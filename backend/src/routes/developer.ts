import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { invalidateApiKeyCache } from '../middleware/apiKeyAuth';

const router = Router();

router.use(requireAuth);

function generateRawKey(): string {
  return 'sk_live_' + crypto.randomBytes(24).toString('hex');
}

function hashKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// List API keys for the logged-in user
router.get('/keys', async (req, res) => {
  const userId = (req as any).userId as string;
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true, keyPrefix: true, name: true, plan: true,
      callsThisMonth: true, callsTotal: true,
      isActive: true, lastUsedAt: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ keys });
});

// Create a new API key
router.post('/keys', async (req, res) => {
  const userId = (req as any).userId as string;

  const existing = await prisma.apiKey.count({ where: { userId, isActive: true } });
  if (existing >= 5) {
    return res.status(400).json({ error: 'Maximum of 5 active API keys reached.' });
  }

  const name = (req.body.name as string | undefined)?.trim().slice(0, 100) || null;

  const rawKey = generateRawKey();
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.substring(0, 12);

  const key = await prisma.apiKey.create({
    data: { userId, keyHash, keyPrefix, name, plan: 'free' },
  });

  res.status(201).json({
    id: key.id,
    key: rawKey,
    keyPrefix: key.keyPrefix,
    name: key.name,
    plan: key.plan,
    createdAt: key.createdAt,
    note: 'Store this key securely — it will not be shown again.',
  });
});

// Rename a key
router.patch('/keys/:id', async (req, res) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;
  const name = (req.body.name as string | undefined)?.trim().slice(0, 100) || null;

  const key = await prisma.apiKey.findFirst({ where: { id, userId } });
  if (!key) return res.status(404).json({ error: 'Key not found.' });

  const updated = await prisma.apiKey.update({ where: { id }, data: { name } });
  res.json({ id: updated.id, name: updated.name });
});

// Revoke a key
router.delete('/keys/:id', async (req, res) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;

  const key = await prisma.apiKey.findFirst({ where: { id, userId } });
  if (!key) return res.status(404).json({ error: 'Key not found.' });

  await prisma.apiKey.update({ where: { id }, data: { isActive: false } });
  invalidateApiKeyCache(key.keyHash);

  res.json({ message: 'API key revoked.' });
});

export default router;
