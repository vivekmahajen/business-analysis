import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function hashUrl(url: string): string {
  return crypto.createHash('md5').update(url.toLowerCase().trim()).digest('hex');
}

// GET /api/reports — list user's reports
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true, radiusMi: true, createdAt: true, reportData: true },
    });
    res.json(reports.map(r => ({
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
