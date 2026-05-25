import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateAnalysis } from '../services/analysis';
import { hashUrl } from './reports';
import { upsertScore } from '../services/scoreCache';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
});

const router = Router();

// POST /api/payments/intent — create Stripe PaymentIntent
router.post('/intent', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { url, radius } = req.body;
  if (!url || !radius) {
    res.status(400).json({ error: 'URL and radius are required' });
    return;
  }
  try {
    const amount = parseInt(process.env.REPORT_PRICE_CENTS || '9900');
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { userId: req.userId!, url, radius: String(radius) },
    });

    await prisma.payment.create({
      data: {
        userId: req.userId!,
        stripepiId: paymentIntent.id,
        amountCents: amount,
        status: 'pending',
        reportUrl: url,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    console.error('Payment intent error:', err);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// POST /api/payments/confirm — confirm payment and trigger analysis
router.post('/confirm', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { paymentIntentId, url, radius } = req.body;
  if (!paymentIntentId || !url || !radius) {
    res.status(400).json({ error: 'paymentIntentId, url, and radius are required' });
    return;
  }

  // Validate URL — reject local/private IPs
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^::1$/,
    ];
    if (privatePatterns.some(p => p.test(hostname))) {
      res.status(400).json({ error: 'Invalid URL: private/local addresses not allowed' });
      return;
    }
  } catch {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }

  try {
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      res.status(402).json({ error: 'Payment not completed' });
      return;
    }
    if (paymentIntent.metadata.userId !== req.userId) {
      res.status(403).json({ error: 'Payment does not belong to this user' });
      return;
    }

    // Update payment record
    await prisma.payment.update({
      where: { stripepiId: paymentIntentId },
      data: { status: 'succeeded' },
    });

    // Run Claude analysis
    const analysisData = await generateAnalysis(url, Number(radius));

    // Save report
    const report = await prisma.report.create({
      data: {
        userId: req.userId!,
        url,
        urlHash: hashUrl(url),
        radiusMi: Number(radius),
        reportData: analysisData,
        paidAmount: paymentIntent.amount,
        stripePi: paymentIntentId,
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
    console.error('Payment confirm error:', err);
    res.status(500).json({ error: 'Failed to process payment and generate report' });
  }
});

// POST /api/payments/webhook — Stripe webhook handler
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent;
    await prisma.payment.updateMany({
      where: { stripepiId: pi.id },
      data: { status: 'failed' },
    });
  }

  res.json({ received: true });
});

export default router;
