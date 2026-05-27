import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { runLeadDiscovery } from '../services/leadDiscovery';

const router = Router();

router.use(requireAuth, requireAdmin);

const CATEGORIES = [
  'Food & Restaurant', 'Retail', 'Health & Wellness', 'Beauty & Personal Care',
  'Auto & Transportation', 'Professional Services', 'Home Services',
  'Fitness & Recreation', 'Entertainment & Nightlife', 'Hospitality & Hotels',
  'Education & Childcare', 'Pet Services',
];

function mapBizToLead(biz: Record<string, unknown>, adminId: string) {
  return {
    businessName: String(biz.businessName || ''),
    category: String(biz.category || ''),
    subCategory: biz.subCategory ? String(biz.subCategory) : null,
    rating: Number(biz.rating) || 0,
    reviewCount: Number(biz.reviewCount) || 0,
    ratingTrend: String(biz.ratingTrend || 'flat'),
    reviewResponseRate: biz.reviewResponseRate ? String(biz.reviewResponseRate) : null,
    primarySource: String(biz.primarySource || 'Other'),
    address: biz.address ? String(biz.address) : null,
    city: String(biz.city || ''),
    state: String(biz.state || ''),
    zipCode: biz.zipCode ? String(biz.zipCode) : null,
    phone: biz.phone ? String(biz.phone) : null,
    website: biz.website ? String(biz.website) : null,
    email: biz.email ? String(biz.email) : null,
    ownerName: biz.ownerName ? String(biz.ownerName) : null,
    contactFound: Boolean(biz.contactFound),
    hasOnlineOrdering: biz.hasOnlineOrdering != null ? Boolean(biz.hasOnlineOrdering) : null,
    hasSocialMedia: biz.hasSocialMedia != null ? Boolean(biz.hasSocialMedia) : null,
    lastReviewDate: biz.lastReviewDate ? String(biz.lastReviewDate) : null,
    conversionScore: Number(biz.conversionScore) || 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    competitors: (biz.competitors as any) ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    teaserFindings: (biz.teaserFindings as any) ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fullFindings: (biz.fullFindings as any) ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    teaserReport: (biz.teaserReport as any) ?? null,
    discoveredBy: adminId,
  };
}

// POST /api/admin/discover — Run lead discovery
router.post('/discover', async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    category,
    state,
    city,
    ratingCeiling = 3.5,
    minReviews = 3,
    maxResults = 50,
    forceRefresh = false,
  } = req.body;

  if (!category || !state || !city) {
    res.status(400).json({ error: 'category, state, and city are required' });
    return;
  }
  if (!CATEGORIES.includes(category)) {
    res.status(400).json({ error: 'Invalid category' });
    return;
  }

  // Cache: return existing leads for this category+city from last 24h unless forceRefresh
  if (!forceRefresh) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cached = await prisma.adminLead.findMany({
      where: { category, city: { equals: city, mode: 'insensitive' }, discoveredAt: { gte: since } },
      orderBy: { conversionScore: 'desc' },
    });
    if (cached.length > 0) {
      res.json({ cached: true, totalFound: cached.length, leads: cached });
      return;
    }
  }

  // Rate limit: max 10 discovery runs per admin per day
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const todayCount = await prisma.adminLead.groupBy({
    by: ['category', 'city'],
    where: { discoveredBy: req.userId!, discoveredAt: { gte: dayStart } },
  });
  if (todayCount.length >= 10) {
    res.status(429).json({ error: 'Daily limit of 10 discovery runs reached. Try again tomorrow.' });
    return;
  }

  try {
    const result = await runLeadDiscovery({ category, state, city, ratingCeiling, minReviews, maxResults });
    const businesses = (result.businesses as Record<string, unknown>[]) || [];

    const savedLeads = await Promise.all(
      businesses.map(biz =>
        prisma.adminLead.create({ data: mapBizToLead(biz, req.userId!) }).catch(err => {
          console.error('[admin] Failed to save lead:', err);
          return null;
        }),
      ),
    );

    const leads = savedLeads.filter(Boolean);
    res.json({ cached: false, totalFound: leads.length, queryMeta: result.queryMeta, leads });
  } catch (err) {
    console.error('[admin] Discovery error:', err);
    res.status(500).json({ error: 'Lead discovery failed. Please try again.' });
  }
});

// GET /api/admin/leads — List leads with optional filters
router.get('/leads', async (req: AuthRequest, res: Response): Promise<void> => {
  const { category, state, city, status, sort = 'conversionScore', page = '1', limit = '50' } = req.query;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (state) where.state = state;
  if (city) where.city = { equals: city as string, mode: 'insensitive' };
  if (status) where.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const orderBy = sort === 'rating' ? { rating: 'asc' as const }
    : sort === 'reviewCount' ? { reviewCount: 'desc' as const }
    : { conversionScore: 'desc' as const };

  try {
    const [leads, total] = await Promise.all([
      prisma.adminLead.findMany({
        where,
        orderBy,
        skip,
        take: Number(limit),
      }),
      prisma.adminLead.count({ where }),
    ]);
    res.json({ leads, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[admin] List leads error:', err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET /api/admin/leads/:id — Single lead
router.get('/leads/:id', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lead = await prisma.adminLead.findUnique({ where: { id: _req.params.id } });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }
    res.json(lead);
  } catch {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// PATCH /api/admin/leads/:id/status — Update status
router.patch('/leads/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  const validStatuses = ['discovered', 'emailed', 'clicked', 'signed_up', 'converted'];
  const { status } = req.body;
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  try {
    const lead = await prisma.adminLead.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(status === 'emailed' ? { teaserSentAt: new Date() } : {}),
        ...(status === 'clicked' ? { teaserClickedAt: new Date() } : {}),
        ...(status === 'converted' ? { convertedAt: new Date() } : {}),
      },
    });
    res.json(lead);
  } catch {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /api/admin/leads/:id
router.delete('/leads/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.adminLead.delete({ where: { id: req.params.id } });
    res.json({ message: 'Lead deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// GET /api/admin/categories
router.get('/categories', (_req, res: Response) => {
  res.json(CATEGORIES);
});

// GET /api/admin/states/:category — States that have leads for this category
router.get('/states/:category', async (req, res: Response): Promise<void> => {
  try {
    const rows = await prisma.adminLead.findMany({
      where: { category: req.params.category },
      select: { state: true },
      distinct: ['state'],
      orderBy: { state: 'asc' },
    });
    res.json(rows.map(r => r.state));
  } catch {
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// GET /api/admin/cities/:category/:state — Cities in category+state
router.get('/cities/:category/:state', async (req, res: Response): Promise<void> => {
  try {
    const rows = await prisma.adminLead.findMany({
      where: { category: req.params.category, state: req.params.state },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    res.json(rows.map(r => r.city));
  } catch {
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

export default router;
