import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { PLAN_CONFIG, ADDON_PACKS, PlanKey } from '../config/plans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
});

const router = Router();

// GET /api/billing/plans — public
router.get('/plans', (_req: Request, res: Response): void => {
  const plans = Object.entries(PLAN_CONFIG).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    credits: plan.credits,
    monthlyPriceCents: plan.monthlyPriceCents,
    yearlyPriceCents: plan.yearlyPriceCents,
    features: plan.features,
    hasMonthlyPrice: !!plan.stripePriceIdMonthly,
    hasYearlyPrice: !!plan.stripePriceIdYearly,
  }));
  res.json({ plans, addonPacks: ADDON_PACKS });
});

// GET /api/billing/status — authenticated
router.get('/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { plan: true, creditsRemaining: true, stripeSubId: true, planExpiresAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const planInfo = PLAN_CONFIG[user.plan as PlanKey] || PLAN_CONFIG.free;
    res.json({
      plan: user.plan,
      planName: planInfo.name,
      creditsRemaining: user.creditsRemaining,
      creditsTotal: planInfo.credits,
      unlimited: planInfo.credits === -1,
      hasSubscription: !!user.stripeSubId,
      planExpiresAt: user.planExpiresAt,
    });
  } catch (err) {
    console.error('Billing status error:', err);
    res.status(500).json({ error: 'Failed to fetch billing status' });
  }
});

// GET /api/billing/usage — authenticated
router.get('/usage', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const txns = await prisma.creditTransaction.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ transactions: txns });
  } catch (err) {
    console.error('Billing usage error:', err);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

// POST /api/billing/checkout — create subscription checkout session
router.post('/checkout', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { planId, interval } = req.body as { planId: string; interval: 'month' | 'year' };
  const plan = PLAN_CONFIG[planId as PlanKey];
  if (!plan || planId === 'free') {
    res.status(400).json({ error: 'Invalid plan' });
    return;
  }

  const priceId = interval === 'year' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
  if (!priceId) {
    res.status(400).json({ error: 'Stripe price not configured for this plan. Please contact support.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { email: true, stripeCustomerId: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { userId: req.userId! } });
      customerId = customer.id;
      await prisma.user.update({ where: { id: req.userId! }, data: { stripeCustomerId: customerId } });
    }

    const appUrl = process.env.APP_URL || 'https://siteanalyzer-backend-promo-production.up.railway.app';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?billing=success&plan=${planId}`,
      cancel_url: `${appUrl}/?billing=cancelled`,
      metadata: { userId: req.userId!, planId, interval },
      subscription_data: { metadata: { userId: req.userId!, planId } },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/billing/addon-checkout — buy extra credit pack
router.post('/addon-checkout', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { packId } = req.body as { packId: string };
  const pack = ADDON_PACKS.find(p => p.id === packId);
  if (!pack) {
    res.status(400).json({ error: 'Invalid pack' });
    return;
  }
  if (!pack.stripePriceId) {
    res.status(400).json({ error: 'Pack not configured. Please contact support.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { email: true, stripeCustomerId: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { userId: req.userId! } });
      customerId = customer.id;
      await prisma.user.update({ where: { id: req.userId! }, data: { stripeCustomerId: customerId } });
    }

    const appUrl = process.env.APP_URL || 'https://siteanalyzer-backend-promo-production.up.railway.app';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{ price: pack.stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/?billing=addon_success&pack=${packId}&credits=${pack.credits}`,
      cancel_url: `${appUrl}/?billing=cancelled`,
      metadata: { userId: req.userId!, packId, credits: String(pack.credits), amountCents: String(pack.priceCents) },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Addon checkout error:', err);
    res.status(500).json({ error: 'Failed to create addon checkout session' });
  }
});

// POST /api/billing/portal — customer portal
router.post('/portal', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: 'No billing account found. Please subscribe first.' });
      return;
    }

    const appUrl = process.env.APP_URL || 'https://siteanalyzer-backend-promo-production.up.railway.app';
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: appUrl,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

// POST /api/billing/demo-add-credits — add credits instantly without payment (demo mode)
router.post('/demo-add-credits', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { credits = 25 } = req.body as { credits?: number };
  const amount = Math.min(Math.max(1, Number(credits)), 200);
  console.log(`[demo-add-credits] userId=${req.userId} amount=${amount}`);
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.userId! },
        data: { creditsRemaining: { increment: amount } },
      }),
      prisma.creditTransaction.create({
        data: { userId: req.userId!, delta: amount, reason: 'demo_purchase' },
      }),
    ]);
    const updated = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { creditsRemaining: true },
    });
    console.log(`[demo-add-credits] success creditsRemaining=${updated?.creditsRemaining}`);
    res.json({ success: true, creditsAdded: amount, creditsRemaining: updated?.creditsRemaining });
  } catch (err) {
    console.error('[demo-add-credits] error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// POST /api/billing/demo-upgrade — change plan instantly without payment (demo mode)
router.post('/demo-upgrade', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { planId } = req.body as { planId: string };
  const plan = PLAN_CONFIG[planId as PlanKey];
  if (!plan) { res.status(400).json({ error: 'Invalid plan' }); return; }
  const credits = plan.credits === -1 ? 999999 : plan.credits;
  console.log(`[demo-upgrade] userId=${req.userId} planId=${planId} credits=${credits}`);
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.userId! },
        data: { plan: planId, creditsRemaining: credits },
      }),
      prisma.creditTransaction.create({
        data: { userId: req.userId!, delta: credits, reason: 'demo_plan_upgrade' },
      }),
    ]);
    res.json({ success: true, plan: planId, creditsRemaining: credits });
  } catch (err) {
    console.error('[demo-upgrade] error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Failed to upgrade plan' });
  }
});

// POST /api/billing/webhook — Stripe subscription webhook
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_BILLING_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch {
    res.status(400).json({ error: 'Billing webhook signature verification failed' });
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) { res.json({ received: true }); return; }

      if (session.mode === 'subscription') {
        const planId = (session.metadata?.planId || 'starter') as PlanKey;
        const plan = PLAN_CONFIG[planId] || PLAN_CONFIG.starter;
        const subId = session.subscription as string;

        // Fetch subscription to get period end
        const sub = await stripe.subscriptions.retrieve(subId);
        const periodEnd = new Date((sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000);

        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: {
              plan: planId,
              creditsRemaining: plan.credits === -1 ? 999999 : plan.credits,
              stripeSubId: subId,
              planExpiresAt: periodEnd,
            },
          }),
          prisma.creditTransaction.create({
            data: { userId, delta: plan.credits === -1 ? 999999 : plan.credits, reason: 'plan_renewal' },
          }),
          prisma.subscriptionEvent.create({
            data: {
              userId,
              stripeEventId: event.id,
              eventType: 'checkout.session.completed',
              plan: planId,
              creditsGranted: plan.credits === -1 ? 999999 : plan.credits,
            },
          }),
        ]);
      } else if (session.mode === 'payment') {
        // Add-on pack purchase
        const packId = session.metadata?.packId;
        const credits = parseInt(session.metadata?.credits || '0');
        const amountCents = parseInt(session.metadata?.amountCents || '0');
        if (packId && credits > 0) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: { creditsRemaining: { increment: credits } },
            }),
            prisma.creditTransaction.create({
              data: { userId, delta: credits, reason: 'addon_purchase' },
            }),
            prisma.creditPurchase.create({
              data: {
                userId,
                stripeSessionId: session.id,
                creditsPurchased: credits,
                amountCents,
              },
            }),
          ]);
        }
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (!userId) { res.json({ received: true }); return; }

      const planId = (sub.metadata?.planId || 'starter') as PlanKey;
      const plan = PLAN_CONFIG[planId] || PLAN_CONFIG.starter;
      const periodEnd = new Date((sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000);

      await prisma.user.update({
        where: { id: userId },
        data: { plan: planId, stripeSubId: sub.id, planExpiresAt: periodEnd },
      });

      await prisma.subscriptionEvent.create({
        data: {
          userId,
          stripeEventId: event.id,
          eventType: 'customer.subscription.updated',
          plan: planId,
          creditsGranted: plan.credits === -1 ? 999999 : plan.credits,
        },
      });
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (!userId) { res.json({ received: true }); return; }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { plan: 'free', creditsRemaining: 0, stripeSubId: null, planExpiresAt: null },
        }),
        prisma.subscriptionEvent.create({
          data: {
            userId,
            stripeEventId: event.id,
            eventType: 'customer.subscription.deleted',
            plan: 'free',
            creditsGranted: 0,
          },
        }),
      ]);
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      // Only grant credits on renewal (not first payment, which is handled by checkout.session.completed)
      if ((invoice as Stripe.Invoice & { billing_reason: string }).billing_reason !== 'subscription_create') {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const userId = sub.metadata?.userId;
        const planId = (sub.metadata?.planId || 'starter') as PlanKey;
        const plan = PLAN_CONFIG[planId] || PLAN_CONFIG.starter;
        if (userId) {
          const periodEnd = new Date((sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000);
          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: {
                plan: planId,
                creditsRemaining: plan.credits === -1 ? 999999 : plan.credits,
                planExpiresAt: periodEnd,
              },
            }),
            prisma.creditTransaction.create({
              data: { userId, delta: plan.credits === -1 ? 999999 : plan.credits, reason: 'plan_renewal' },
            }),
            prisma.subscriptionEvent.create({
              data: {
                userId,
                stripeEventId: event.id,
                eventType: 'invoice.payment_succeeded',
                plan: planId,
                creditsGranted: plan.credits === -1 ? 999999 : plan.credits,
              },
            }),
          ]);
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const userId = sub.metadata?.userId;
      if (userId) {
        await prisma.subscriptionEvent.create({
          data: {
            userId,
            stripeEventId: event.id,
            eventType: 'invoice.payment_failed',
            plan: sub.metadata?.planId || 'unknown',
          },
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Billing webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
