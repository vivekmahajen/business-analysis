import { Router, Request } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { apiKeyAuth, ApiKeyRequest, PLAN_LIMITS } from '../middleware/apiKeyAuth';
import { generateAnalysis } from '../services/analysis';
import { upsertScoreSafe } from '../services/scoreCache';
import { enqueueWebhookEvent } from '../services/webhookDelivery';

const router = Router();
router.use(apiKeyAuth);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function apireq(req: Request) {
  return req as ApiKeyRequest;
}

function formatReport(report: {
  id: string; url: string; radiusMi: number; reportData: unknown;
  reportType: string | null; city: string | null; state: string | null; createdAt: Date;
}) {
  const data = report.reportData as Record<string, unknown>;
  return {
    reportId: report.id,
    url: report.url,
    reportType: report.reportType || 'competitive',
    city: report.city,
    state: report.state,
    radiusMi: report.radiusMi,
    data,
    createdAt: report.createdAt.toISOString(),
  };
}

async function runJobAsync(jobId: string, userId: string, url: string, radiusMi: number) {
  try {
    await prisma.apiJob.update({
      where: { id: jobId },
      data: { status: 'processing', currentStep: 'scanning_website', percentComplete: 10 },
    });

    const analysisData = await generateAnalysis(url, radiusMi);

    await prisma.apiJob.update({
      where: { id: jobId },
      data: { currentStep: 'building_report', percentComplete: 85 },
    });

    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    const overallScore = (analysisData as any)?.overallScore as number | undefined;

    const report = await prisma.report.create({
      data: {
        userId,
        url,
        urlHash,
        radiusMi,
        reportData: JSON.parse(JSON.stringify(analysisData)) as any,
        paidAmount: 0,
      },
    });

    if (overallScore != null) {
      upsertScoreSafe(url, overallScore).catch(console.error);
    }

    const job = await prisma.apiJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        currentStep: 'complete',
        percentComplete: 100,
        reportId: report.id,
        completedAt: new Date(),
      },
    });

    await enqueueWebhookEvent(job.apiKeyId, 'analysis.completed', {
      jobId,
      reportId: report.id,
      url,
      completedAt: job.completedAt?.toISOString(),
      data: analysisData,
    });
  } catch (err) {
    const message = (err as Error).message;
    const job = await prisma.apiJob.update({
      where: { id: jobId },
      data: { status: 'failed', errorCode: 'ANALYSIS_FAILED', errorMessage: message },
    });
    await enqueueWebhookEvent(job.apiKeyId, 'analysis.failed', {
      jobId,
      url,
      error: { code: 'ANALYSIS_FAILED', message },
    });
    console.error(`[v1] Job ${jobId} failed:`, err);
  }
}

// ─── POST /api/v1/analyze ────────────────────────────────────────────────────

router.post('/analyze', async (req, res) => {
  const { apiKey, apiPlan } = apireq(req);
  const { url, radius, responseMode = 'async', webhookUrl, options = {}, metadata } = req.body as {
    url?: string; radius?: number; responseMode?: 'sync' | 'async';
    webhookUrl?: string; options?: { reportDepth?: string; maxRadius?: number };
    metadata?: Record<string, string>;
  };

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: { code: 'INVALID_URL', message: 'url is required.' } });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ error: { code: 'INVALID_URL', message: 'url must be a valid http/https URL.' } });
  }

  const radiusMi = Math.min(Math.max(Number(radius) || 25, 1), apiPlan.maxRadius);
  const requestedDepth = options.reportDepth || apiPlan.reportDepth;

  if (requestedDepth === 'deep' && !apiPlan.llmVisibility) {
    return res.status(402).json({ error: { code: 'FEATURE_NOT_IN_PLAN', message: 'deep reportDepth requires Professional plan.' } });
  }

  if (webhookUrl && !apiPlan.webhooks) {
    return res.status(402).json({ error: { code: 'FEATURE_NOT_IN_PLAN', message: 'Webhooks require Starter plan or above.' } });
  }

  if (responseMode === 'sync') {
    try {
      const analysisData = await generateAnalysis(parsedUrl.href, radiusMi);
      const urlHash = crypto.createHash('md5').update(parsedUrl.href).digest('hex');
      const report = await prisma.report.create({
        data: {
          userId: apiKey.userId,
          url: parsedUrl.href,
          urlHash,
          radiusMi,
          reportData: JSON.parse(JSON.stringify(analysisData)) as any,
          paidAmount: 0,
        },
      });
      return res.json(formatReport(report));
    } catch (err) {
      return res.status(500).json({ error: { code: 'ANALYSIS_FAILED', message: (err as Error).message } });
    }
  }

  const job = await prisma.apiJob.create({
    data: {
      apiKeyId: apiKey.id,
      url: parsedUrl.href,
      radiusMi,
      reportDepth: requestedDepth,
      webhookUrl: webhookUrl || null,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) as any : undefined,
    },
  });

  setImmediate(() => runJobAsync(job.id, apiKey.userId, parsedUrl.href, radiusMi));

  res.status(202).json({
    jobId: job.id,
    status: 'queued',
    estimatedCompletionSeconds: 75,
    createdAt: job.createdAt.toISOString(),
  });
});

// ─── GET /api/v1/jobs/:id ────────────────────────────────────────────────────

router.get('/jobs/:id', async (req, res) => {
  const { apiKey } = apireq(req);
  const job = await prisma.apiJob.findFirst({
    where: { id: req.params.id, apiKeyId: apiKey.id },
  });

  if (!job) return res.status(404).json({ error: { code: 'JOB_NOT_FOUND', message: 'Job not found.' } });

  const payload: Record<string, unknown> = {
    jobId: job.id,
    status: job.status,
    progress: {
      currentStep: job.currentStep,
      percentComplete: job.percentComplete,
    },
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  };

  if (job.status === 'completed' && job.reportId) {
    const report = await prisma.report.findUnique({ where: { id: job.reportId } });
    if (report) payload.result = formatReport(report);
  }

  if (job.status === 'failed') {
    payload.error = { code: job.errorCode, message: job.errorMessage };
  }

  res.json(payload);
});

// ─── GET /api/v1/reports ─────────────────────────────────────────────────────

router.get('/reports', async (req, res) => {
  const { apiKey } = apireq(req);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const where: any = { apiKeyId: apiKey.id };
  const jobs = await prisma.apiJob.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  const reportIds = jobs.map(j => j.reportId).filter(Boolean) as string[];
  const reports = reportIds.length > 0
    ? await prisma.report.findMany({ where: { id: { in: reportIds } } })
    : [];

  const reportMap = new Map(reports.map(r => [r.id, r]));
  const data = jobs
    .filter(j => j.reportId && reportMap.has(j.reportId!))
    .map(j => formatReport(reportMap.get(j.reportId!)!));

  const total = await prisma.apiJob.count({ where });
  res.json({ total, limit, offset, data });
});

// ─── GET /api/v1/reports/:id ─────────────────────────────────────────────────

router.get('/reports/:id', async (req, res) => {
  const { apiKey } = apireq(req);
  const job = await prisma.apiJob.findFirst({
    where: { reportId: req.params.id, apiKeyId: apiKey.id },
  });

  if (!job) return res.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });

  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!report) return res.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });

  res.json(formatReport(report));
});

// ─── POST /api/v1/reports/:id/refresh ────────────────────────────────────────

router.post('/reports/:id/refresh', async (req, res) => {
  const { apiKey } = apireq(req);
  const job = await prisma.apiJob.findFirst({
    where: { reportId: req.params.id, apiKeyId: apiKey.id },
  });

  if (!job) return res.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });

  const newJob = await prisma.apiJob.create({
    data: { apiKeyId: apiKey.id, url: job.url, radiusMi: job.radiusMi, reportDepth: job.reportDepth },
  });

  setImmediate(() => runJobAsync(newJob.id, apiKey.userId, job.url, job.radiusMi));

  res.status(202).json({
    jobId: newJob.id,
    status: 'queued',
    originalReportId: req.params.id,
    estimatedCompletionSeconds: 75,
  });
});

// ─── GET /api/v1/llm-visibility/:reportId ────────────────────────────────────

router.get('/llm-visibility/:reportId', async (req, res) => {
  const { apiKey, apiPlan } = apireq(req);

  if (!apiPlan.llmVisibility) {
    return res.status(402).json({ error: { code: 'FEATURE_NOT_IN_PLAN', message: 'LLM visibility requires Professional plan.' } });
  }

  const job = await prisma.apiJob.findFirst({
    where: { reportId: req.params.reportId, apiKeyId: apiKey.id },
  });
  if (!job) return res.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });

  const audit = await prisma.llmAudit.findFirst({
    where: { userId: apiKey.userId, status: 'completed' },
    orderBy: { completedAt: 'desc' },
    include: { results: true },
  });

  if (!audit) return res.status(404).json({ error: { code: 'NO_AUDIT', message: 'No LLM visibility audit found. Run an audit first.' } });

  res.json({
    reportId: req.params.reportId,
    businessName: audit.businessName,
    aisps: audit.overallScore,
    scoreBreakdown: audit.scoreBreakdown,
    mentionCount: audit.mentionCount,
    totalQueries: audit.totalQueries,
    auditedAt: audit.completedAt?.toISOString(),
  });
});

// ─── GET /api/v1/usage ────────────────────────────────────────────────────────

router.get('/usage', async (req, res) => {
  const { apiKey, apiPlan } = apireq(req);
  const planName = apiKey.plan as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[planName]?.callsPerMonth ?? 100;

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  res.json({
    plan: apiKey.plan,
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    calls: {
      used: apiKey.callsThisMonth,
      limit,
      remaining: limit === -1 ? null : Math.max(0, limit - apiKey.callsThisMonth),
    },
    features: apiPlan,
    nextResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
  });
});

// ─── Webhooks ─────────────────────────────────────────────────────────────────

router.get('/webhooks', async (req, res) => {
  const { apiKey } = apireq(req);
  const webhooks = await prisma.apiWebhook.findMany({
    where: { apiKeyId: apiKey.id },
    select: { id: true, url: true, events: true, isActive: true, failureCount: true, lastSuccessAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ webhooks });
});

router.post('/webhooks', async (req, res) => {
  const { apiKey, apiPlan } = apireq(req);

  if (!apiPlan.webhooks) {
    return res.status(402).json({ error: { code: 'FEATURE_NOT_IN_PLAN', message: 'Webhooks require Starter plan or above.' } });
  }

  const { url, events, secret } = req.body as { url?: string; events?: string[]; secret?: string };

  if (!url || !url.startsWith('https://')) {
    return res.status(400).json({ error: { code: 'WEBHOOK_URL_INVALID', message: 'Webhook URL must be https://.' } });
  }

  const VALID_EVENTS = ['analysis.completed', 'analysis.failed', 'report.refreshed'];
  if (!Array.isArray(events) || events.length === 0 || !events.every(e => VALID_EVENTS.includes(e))) {
    return res.status(400).json({ error: { code: 'INVALID_EVENTS', message: `events must be a non-empty array of: ${VALID_EVENTS.join(', ')}` } });
  }

  const signingSecret = secret || crypto.randomBytes(32).toString('hex');

  const webhook = await prisma.apiWebhook.create({
    data: { apiKeyId: apiKey.id, url, events, signingSecret },
  });

  res.status(201).json({
    webhookId: webhook.id,
    url: webhook.url,
    events: webhook.events,
    signingSecret,
    createdAt: webhook.createdAt.toISOString(),
    note: 'Store signingSecret — it will not be shown again.',
  });
});

router.delete('/webhooks/:id', async (req, res) => {
  const { apiKey } = apireq(req);
  const webhook = await prisma.apiWebhook.findFirst({
    where: { id: req.params.id, apiKeyId: apiKey.id },
  });

  if (!webhook) return res.status(404).json({ error: { code: 'WEBHOOK_NOT_FOUND', message: 'Webhook not found.' } });

  await prisma.apiWebhook.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Webhook deregistered.' });
});

export default router;
