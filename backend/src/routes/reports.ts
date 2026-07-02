import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { checkAndDeductCredit } from '../middleware/credits';
import { generateAnalysis } from '../services/analysis';
import { generateGrowthAnalysis } from '../services/growthAnalysis';
import { generateReviewAnalysis } from '../services/reviewAnalysis';
import { upsertScore } from '../services/scoreCache';

const router = Router();

function hashUrl(url: string): string {
  return crypto.createHash('md5').update(url.toLowerCase().trim()).digest('hex');
}

function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const privatePatterns = [
      /^localhost$/i, /^127\./, /^10\./, /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^::1$/,
    ];
    return !privatePatterns.some(p => p.test(hostname));
  } catch {
    return false;
  }
}

// In-memory job store for long-running review analysis
interface ReviewJob {
  status: 'pending' | 'completed' | 'failed';
  reportId?: string;
  error?: string;
}
const reviewJobs = new Map<string, ReviewJob>();

function startReviewJob(userId: string, url: string): string {
  const jobId = crypto.randomUUID();
  reviewJobs.set(jobId, { status: 'pending' });

  generateReviewAnalysis(url)
    .then(async (analysisData) => {
      const report = await prisma.report.create({
        data: {
          userId,
          url,
          urlHash: hashUrl(url),
          radiusMi: 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reportData: analysisData as any,
          reportType: 'review',
          paidAmount: 0,
        },
      });
      reviewJobs.set(jobId, { status: 'completed', reportId: report.id });
    })
    .catch((err) => {
      console.error('[review] job error:', err);
      reviewJobs.set(jobId, { status: 'failed', error: 'Failed to generate review analysis' });
    })
    .finally(() => {
      // Clean up after 10 minutes
      setTimeout(() => reviewJobs.delete(jobId), 10 * 60 * 1000);
    });

  return jobId;
}

// GET /api/reports — list user's reports
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true, radiusMi: true, createdAt: true, reportData: true, reportType: true, city: true, state: true },
    });
    res.json(reports.map((r: typeof reports[number]) => ({
      id: r.id,
      url: r.url,
      radius: r.radiusMi,
      at: r.createdAt,
      data: r.reportData,
      reportType: r.reportType,
      city: r.city,
      state: r.state,
    })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/reports/check?url= — check if report exists
router.get('/check', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).json({ error: 'URL parameter required' });
    return;
  }
  try {
    const hash = hashUrl(url);
    const report = await prisma.report.findFirst({
      where: { userId: req.userId!, urlHash: hash },
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true, radiusMi: true, createdAt: true, reportData: true, reportType: true },
    });
    if (report) {
      res.json({
        found: true,
        report: {
          id: report.id,
          url: report.url,
          radius: report.radiusMi,
          at: report.createdAt,
          data: report.reportData,
          reportType: report.reportType,
        },
      });
    } else {
      res.json({ found: false });
    }
  } catch {
    res.status(500).json({ error: 'Failed to check report' });
  }
});

// POST /api/reports/generate — authenticated users with credits (admins bypass credit check)
router.post('/generate', requireAuth, checkAndDeductCredit, async (req: AuthRequest, res: Response): Promise<void> => {
  const { url, radius } = req.body;
  if (!url || !radius) {
    res.status(400).json({ error: 'URL and radius are required' });
    return;
  }
  if (!validateUrl(url)) {
    res.status(400).json({ error: 'Invalid URL: private/local addresses not allowed' });
    return;
  }
  try {
    const analysisData = await generateAnalysis(url, Number(radius));
    const report = await prisma.report.create({
      data: {
        userId: req.userId!,
        url,
        urlHash: hashUrl(url),
        radiusMi: Number(radius),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reportData: analysisData as any,
        paidAmount: 0,
      },
    });
    // Cache this URL's score for consistency in future competitor comparisons
    const overallScore = (analysisData as { overallScore?: number }).overallScore;
    if (typeof overallScore === 'number') {
      await upsertScore(url, overallScore).catch(() => {});
    }
    res.json({
      id: report.id,
      url: report.url,
      radius: report.radiusMi,
      at: report.createdAt,
      data: report.reportData,
      reportType: report.reportType,
      city: report.city,
      state: report.state,
    });
  } catch (err) {
    console.error('Admin generate error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// POST /api/reports/generate-growth — authenticated users with credits (admins bypass credit check)
router.post('/generate-growth', requireAuth, checkAndDeductCredit, async (req: AuthRequest, res: Response): Promise<void> => {
  const { url, radius, city, state } = req.body;
  if (!url || !radius) {
    res.status(400).json({ error: 'URL and radius are required' });
    return;
  }
  if (!validateUrl(url)) {
    res.status(400).json({ error: 'Invalid URL: private/local addresses not allowed' });
    return;
  }
  try {
    const analysisData = await generateGrowthAnalysis(url, Number(radius), city || '', state || '');
    const report = await prisma.report.create({
      data: {
        userId: req.userId!,
        url,
        urlHash: hashUrl(url),
        radiusMi: Number(radius),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reportData: analysisData as any,
        paidAmount: 0,
        reportType: 'growth',
        city: city || null,
        state: state || null,
      },
    });
    res.json({
      id: report.id,
      url: report.url,
      radius: report.radiusMi,
      at: report.createdAt,
      data: report.reportData,
      reportType: report.reportType,
      city: report.city,
      state: report.state,
    });
  } catch (err) {
    console.error('Admin generate-growth error:', err);
    res.status(500).json({ error: 'Failed to generate growth report' });
  }
});

// POST /api/reports/generate-review — starts async job, returns jobId immediately
router.post('/generate-review', requireAuth, checkAndDeductCredit, (req: AuthRequest, res: Response): void => {
  const { url } = req.body;
  if (!url) { res.status(400).json({ error: 'URL is required' }); return; }
  if (!validateUrl(url)) { res.status(400).json({ error: 'Invalid URL: private/local addresses not allowed' }); return; }
  const jobId = startReviewJob(req.userId!, url);
  res.status(202).json({ jobId });
});

// POST /api/reports/generate-review-admin — admin bypass, also async
router.post('/generate-review-admin', requireAuth, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { url } = req.body;
  if (!url) { res.status(400).json({ error: 'URL is required' }); return; }
  if (!validateUrl(url)) { res.status(400).json({ error: 'Invalid URL' }); return; }
  const jobId = startReviewJob(req.userId!, url);
  res.status(202).json({ jobId });
});

// GET /api/reports/review-job/:jobId — poll for async review job status
router.get('/review-job/:jobId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const job = reviewJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ status: 'not_found', error: 'Job not found or expired' });
    return;
  }
  if (job.status === 'pending') {
    res.json({ status: 'pending' });
    return;
  }
  if (job.status === 'failed') {
    res.status(500).json({ status: 'failed', error: job.error });
    return;
  }
  try {
    const report = await prisma.report.findFirst({
      where: { id: job.reportId!, userId: req.userId! },
    });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    res.json({
      status: 'completed',
      report: { id: report.id, url: report.url, radius: 0, at: report.createdAt, data: report.reportData, reportType: 'review' },
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// GET /api/reports/:id — get single report
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await prisma.report.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    res.json({
      id: report.id,
      url: report.url,
      radius: report.radiusMi,
      at: report.createdAt,
      data: report.reportData,
      reportType: report.reportType,
      city: report.city,
      state: report.state,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await prisma.report.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    await prisma.report.delete({ where: { id: req.params.id } });
    res.json({ message: 'Report deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export { hashUrl };
export default router;
