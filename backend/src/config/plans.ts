export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    credits: 3,
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    stripePriceIdMonthly: null as string | null,
    stripePriceIdYearly: null as string | null,
    features: ['3 analysis credits', 'Competitive reports', 'Growth advisor'],
  },
  starter: {
    name: 'Starter',
    credits: 30,
    monthlyPriceCents: 2900,
    yearlyPriceCents: 24360, // $203/yr = 2 months free
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY || null,
    features: ['30 analysis credits/mo', 'Competitive reports', 'Growth advisor', 'Email support'],
  },
  pro: {
    name: 'Pro',
    credits: 100,
    monthlyPriceCents: 7900,
    yearlyPriceCents: 66360, // $553/yr = 2 months free
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY || null,
    features: ['100 analysis credits/mo', 'Competitive reports', 'Growth advisor', 'Priority support', 'Lead Discovery'],
  },
  agency: {
    name: 'Agency',
    credits: -1, // unlimited
    monthlyPriceCents: 19900,
    yearlyPriceCents: 167160, // $1393/yr = 2 months free
    stripePriceIdMonthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY || null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_AGENCY_YEARLY || null,
    features: ['Unlimited credits', 'Competitive reports', 'Growth advisor', 'Lead Discovery', 'Dedicated support', 'White-label exports'],
  },
} as const;

export const ADDON_PACKS = [
  { id: 'pack_10', credits: 10, priceCents: 1500, label: '10 Credits — $15', stripePriceId: process.env.STRIPE_PRICE_PACK_10 || null },
  { id: 'pack_25', credits: 25, priceCents: 3000, label: '25 Credits — $30', stripePriceId: process.env.STRIPE_PRICE_PACK_25 || null },
  { id: 'pack_50', credits: 50, priceCents: 5000, label: '50 Credits — $50', stripePriceId: process.env.STRIPE_PRICE_PACK_50 || null },
] as const;

export type PlanKey = keyof typeof PLAN_CONFIG;
