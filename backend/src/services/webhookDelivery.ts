import crypto from 'crypto';
import { prisma } from '../lib/prisma';

const RETRY_DELAYS_SEC = [60, 300, 1800, 7200, 86400];
const MAX_ATTEMPTS = 5;
const DELIVERY_TIMEOUT_MS = 10_000;

export async function enqueueWebhookEvent(apiKeyId: string, event: string, payload: Record<string, unknown>) {
  const webhooks = await prisma.apiWebhook.findMany({
    where: { apiKeyId, isActive: true, events: { has: event } },
  });

  for (const webhook of webhooks) {
    await prisma.apiWebhookDelivery.create({
      data: { webhookId: webhook.id, event, payload: JSON.parse(JSON.stringify(payload)) as any },
    });
  }
}

async function attemptDelivery(delivery: {
  id: string; webhookId: string; event: string; payload: unknown; attempts: number;
  webhook: { url: string; signingSecret: string };
}) {
  const envelope = JSON.stringify({
    event: delivery.event,
    webhookId: delivery.webhookId,
    deliveryId: delivery.id,
    timestamp: new Date().toISOString(),
    data: delivery.payload,
  });

  const signature = crypto.createHmac('sha256', delivery.webhook.signingSecret).update(envelope).digest('hex');

  let httpStatus: number | null = null;
  try {
    const res = await fetch(delivery.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SiteAnalyzer-Signature': signature,
        'X-SiteAnalyzer-Event': delivery.event,
        'X-Delivery-ID': delivery.id,
        'User-Agent': 'SiteAnalyzerPro-Webhooks/1.0',
      },
      body: envelope,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    httpStatus = res.status;

    if (res.ok) {
      await prisma.apiWebhookDelivery.update({
        where: { id: delivery.id },
        data: { status: 'delivered', httpStatus, deliveredAt: new Date() },
      });
      await prisma.apiWebhook.update({
        where: { id: delivery.webhookId },
        data: { lastSuccessAt: new Date(), failureCount: 0 },
      });
      return;
    }
  } catch {
    // network error or timeout — fall through to retry logic
  }

  const attempts = delivery.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    await prisma.apiWebhookDelivery.update({
      where: { id: delivery.id },
      data: { status: 'failed', httpStatus, attempts },
    });
    await prisma.apiWebhook.update({
      where: { id: delivery.webhookId },
      data: { lastFailureAt: new Date(), failureCount: { increment: 1 } },
    });
    return;
  }

  const delaySec = RETRY_DELAYS_SEC[attempts - 1] ?? 86400;
  const nextRetryAt = new Date(Date.now() + delaySec * 1000);
  await prisma.apiWebhookDelivery.update({
    where: { id: delivery.id },
    data: { attempts, httpStatus, nextRetryAt },
  });
  await prisma.apiWebhook.update({
    where: { id: delivery.webhookId },
    data: { lastFailureAt: new Date(), failureCount: { increment: 1 } },
  });
}

export async function processPendingDeliveries() {
  const pending = await prisma.apiWebhookDelivery.findMany({
    where: {
      status: 'pending',
      attempts: { lt: MAX_ATTEMPTS },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    include: { webhook: { select: { url: true, signingSecret: true } } },
    take: 50,
    orderBy: { createdAt: 'asc' },
  });

  for (const delivery of pending) {
    attemptDelivery(delivery).catch(console.error);
  }
}

export function startWebhookWorker() {
  setInterval(() => {
    processPendingDeliveries().catch(console.error);
  }, 30_000);
}
