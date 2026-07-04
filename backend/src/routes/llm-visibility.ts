import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { runLlmAudit } from '../services/llm-visibility';
import { runAdvisorAnalysis } from '../services/advisorAnalysis';

const router = Router();

// POST /api/llm/audit — start a new audit
router.post('/audit', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { businessName, businessUrl, city, state, category } = req.body;

  if (!businessName || !city || !state || !category) {
    res.status(400).json({ error: 'businessName, city, state, and category are required' });
    return;
  }

  // One audit per user per day per business
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await prisma.llmAudit.findFirst({
    where: {
      userId: req.userId!,
      businessName: { equals: businessName, mode: 'insensitive' },
      createdAt: { gte: oneDayAgo },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing && existing.status !== 'failed') {
    res.json({ auditId: existing.id, status: existing.status, cached: true });
    return;
  }

  const audit = await prisma.llmAudit.create({
    data: {
      userId: req.userId!,
      businessName: businessName.trim(),
      businessUrl: businessUrl?.trim() || null,
      city: city.trim(),
      state: state.trim(),
      category: category.trim(),
      status: 'pending',
    },
  });

  // Fire-and-forget — don't await so request returns immediately
  setImmediate(() => {
    runLlmAudit(audit.id).catch(err =>
      console.error('[llm-visibility] unhandled audit error:', err),
    );
  });

  res.json({ auditId: audit.id, status: 'pending', cached: false });
});

// GET /api/llm/audit/:id — poll for audit status/results
router.get('/audit/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const audit = await prisma.llmAudit.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: {
        results: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, provider: true, queryCategory: true, query: true,
            mentioned: true, mentionRank: true, mentionContext: true,
          },
        },
      },
    });

    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }

    res.json(audit);
  } catch {
    res.status(500).json({ error: 'Failed to fetch audit' });
  }
});

// POST /api/llm/advisor/:id — run AI Search Visibility Advisor on a completed audit
router.post('/advisor/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check ownership
    const audit = await prisma.llmAudit.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      select: { id: true, status: true, advisorReport: true },
    });

    if (!audit) {
      res.status(404).json({ error: 'Audit not found' });
      return;
    }
    if (audit.status !== 'completed') {
      res.status(400).json({ error: 'Audit must be completed before running the advisor' });
      return;
    }

    // Return cached report if already generated
    if (audit.advisorReport) {
      res.json({ report: audit.advisorReport, cached: true });
      return;
    }

    const report = await runAdvisorAnalysis(req.params.id);
    res.json({ report, cached: false });
  } catch (err) {
    console.error('[advisor] error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: (err as Error).message || 'Failed to run advisor analysis' });
  }
});

// GET /api/llm/audits — list my audits
router.get('/audits', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const audits = await prisma.llmAudit.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, businessName: true, businessUrl: true, city: true, state: true,
        category: true, status: true, overallScore: true, scoreBreakdown: true,
        totalQueries: true, mentionCount: true, createdAt: true, completedAt: true,
      },
    });

    res.json({ audits });
  } catch {
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// POST /api/llm/waitlist — join beta waitlist (no auth required)
router.post('/waitlist', async (req, res: Response): Promise<void> => {
  const { email, name, businessUrl, city, state } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Valid email is required' });
    return;
  }

  try {
    const existing = await prisma.llmWaitlist.findUnique({ where: { email } });
    if (existing) {
      res.json({ message: "You're already on the waitlist! We'll be in touch soon.", alreadyJoined: true });
      return;
    }

    await prisma.llmWaitlist.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
        businessUrl: businessUrl?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
      },
    });

    res.json({ message: "You're on the waitlist! We'll notify you when AI Visibility Audits go live.", alreadyJoined: false });
  } catch {
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

// GET /api/llm/waitlist-count — public count for social proof
router.get('/waitlist-count', async (_req, res: Response): Promise<void> => {
  try {
    const count = await prisma.llmWaitlist.count();
    res.json({ count });
  } catch {
    res.status(500).json({ count: 0 });
  }
});

export default router;
