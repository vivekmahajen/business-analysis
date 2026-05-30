import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateAnalysis } from '../services/analysis';
import { addToMailchimp } from '../services/mailchimp';

const router = Router();

// POST /api/funnel/analyze — public, no auth required
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  const { url, radius = 25 } = req.body;
  if (!url) { res.status(400).json({ error: 'URL required' }); return; }

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const h = parsed.hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) {
      res.status(400).json({ error: 'Invalid URL' }); return;
    }
  } catch { res.status(400).json({ error: 'Invalid URL format' }); return; }

  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const data = await generateAnalysis(normalizedUrl, Number(radius));
    res.json({ success: true, url: normalizedUrl, data });
  } catch (err) {
    console.error('[funnel] analyze error:', err);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

// POST /api/funnel/gate — capture email lead
router.post('/gate', async (req: Request, res: Response): Promise<void> => {
  const { email, firstName, businessName, analyzedUrl, reportData, utmSource, utmMedium, utmCampaign, referrer } = req.body;
  if (!email || !analyzedUrl) { res.status(400).json({ error: 'email and analyzedUrl required' }); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { res.status(400).json({ error: 'Invalid email' }); return; }

  const overallScore = (reportData as Record<string, unknown>)?.overallScore as number | undefined;
  const gaps = (reportData as Record<string, unknown>)?.gaps as Array<{ title: string }> | undefined;

  // Always fire Mailchimp immediately — do not block on DB
  addToMailchimp({
    email, firstName, businessName, analyzedUrl,
    overallScore,
    topGap: gaps?.[0]?.title,
    reportId: undefined,
  }).catch(err => console.error('[funnel] mailchimp error:', err));

  // Save to DB independently — failure here does not block the response
  let leadId: string | undefined;
  try {
    const lead = await prisma.lead.upsert({
      where: { idx_leads_email_url: { email, analyzedUrl } },
      update: { firstName, businessName, reportData, updatedAt: new Date() },
      create: { email, firstName, businessName, analyzedUrl, reportData, utmSource, utmMedium, utmCampaign, referrer },
    });
    leadId = lead.id;
    console.log('[funnel] lead saved:', leadId);
  } catch (err) {
    console.error('[funnel] DB save failed (non-fatal):', err);
  }

  res.json({ success: true, leadId, reportData });
});

export default router;
