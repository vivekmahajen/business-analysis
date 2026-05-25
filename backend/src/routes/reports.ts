import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { generateAnalysis } from '../services/analysis';
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

// GET /api/reports — list user's reports
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true, radiusMi: true, createdAt: true, reportData: true },
    });
    res.json(reports.map((r: typeof reports[number]) => ({
      id: r.id,
      url: r.url,
      radius: r.radiusMi,
      at: r.createdAt,
      data: r.reportData,
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
      select: { id: true, url: true, radiusMi: true, createdAt: true, reportData: true },
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
        },
      });
    } else {
      res.json({ found: false });
    }
  } catch {
    res.status(500).json({ error: 'Failed to check report' });
  }
});

// POST /api/reports/generate — admin-only: generate report without payment
router.post('/generate', requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
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
        reportData: analysisData,
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
    });
  } catch (err) {
    console.error('Admin generate error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
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
