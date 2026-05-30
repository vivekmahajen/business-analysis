import React, { useState } from 'react';
import { api } from '../utils/api';

interface Plan {
  id: string;
  name: string;
  credits: number;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  features: string[];
  hasMonthlyPrice: boolean;
  hasYearlyPrice: boolean;
}

interface Props {
  onBack: () => void;
  isLoggedIn: boolean;
  onLoginPrompt: () => void;
  currentPlan?: string;
}

const PLAN_DISPLAY: Record<string, { tagline: string; highlight?: boolean; badge?: string }> = {
  free:    { tagline: 'Try before you commit' },
  starter: { tagline: 'Perfect for small businesses', badge: 'Most Popular', highlight: true },
  pro:     { tagline: 'For growing teams' },
  agency:  { tagline: 'Unlimited scale' },
};

const ADDON_PACKS = [
  { id: 'pack_10', credits: 10, priceCents: 1500, label: '10 Credits' },
  { id: 'pack_25', credits: 25, priceCents: 3000, label: '25 Credits' },
  { id: 'pack_50', credits: 50, priceCents: 5000, label: '50 Credits' },
];

export default function PricingScreen({ onBack, isLoggedIn, onLoginPrompt, currentPlan }: Props) {
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const plans: Plan[] = [
    {
      id: 'free', name: 'Free', credits: 3, monthlyPriceCents: 0, yearlyPriceCents: 0,
      features: ['3 analysis credits total', 'Competitive reports', 'Growth advisor'],
      hasMonthlyPrice: false, hasYearlyPrice: false,
    },
    {
      id: 'starter', name: 'Starter', credits: 30, monthlyPriceCents: 2900, yearlyPriceCents: 24360,
      features: ['30 credits/month', 'Competitive reports', 'Growth advisor', 'Email support'],
      hasMonthlyPrice: true, hasYearlyPrice: true,
    },
    {
      id: 'pro', name: 'Pro', credits: 100, monthlyPriceCents: 7900, yearlyPriceCents: 66360,
      features: ['100 credits/month', 'Competitive reports', 'Growth advisor', 'Lead Discovery', 'Priority support'],
      hasMonthlyPrice: true, hasYearlyPrice: true,
    },
    {
      id: 'agency', name: 'Agency', credits: -1, monthlyPriceCents: 19900, yearlyPriceCents: 167160,
      features: ['Unlimited credits', 'Competitive reports', 'Growth advisor', 'Lead Discovery', 'Dedicated support', 'White-label exports'],
      hasMonthlyPrice: true, hasYearlyPrice: true,
    },
  ];

  const handleSubscribe = async (planId: string) => {
    if (!isLoggedIn) { onLoginPrompt(); return; }
    if (planId === 'free') return;
    setError('');
    setLoading(planId);
    try {
      const { url } = await api.createCheckout(planId, interval);
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message);
      setLoading(null);
    }
  };

  const handleAddon = async (packId: string) => {
    if (!isLoggedIn) { onLoginPrompt(); return; }
    setError('');
    setLoading(packId);
    try {
      const { url } = await api.createAddonCheckout(packId);
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message);
      setLoading(null);
    }
  };

  const price = (plan: Plan) => {
    if (plan.monthlyPriceCents === 0) return '$0';
    const cents = interval === 'year' ? Math.round(plan.yearlyPriceCents / 12) : plan.monthlyPriceCents;
    return `$${(cents / 100).toFixed(0)}`;
  };

  const yearlySavings = (plan: Plan) => {
    if (plan.monthlyPriceCents === 0) return null;
    const monthly12 = plan.monthlyPriceCents * 12;
    const saved = monthly12 - plan.yearlyPriceCents;
    return Math.round(saved / 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1 transition-colors">
            ← Back
          </button>
          <h1 className="font-bold text-gray-900 text-lg">Pricing</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h2>
          <p className="text-gray-500 text-lg mb-6">Each credit = one AI-powered analysis report. Reports are yours forever.</p>

          {/* Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setInterval('month')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${interval === 'month' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${interval === 'year' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Yearly
              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Save 2 months</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-lg mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm text-center">
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {plans.map((plan) => {
            const display = PLAN_DISPLAY[plan.id] || {};
            const isCurrent = currentPlan === plan.id;
            const hasPriceId = interval === 'year' ? plan.hasYearlyPrice : plan.hasMonthlyPrice;
            const savingsAmount = interval === 'year' ? yearlySavings(plan) : null;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border flex flex-col ${
                  display.highlight
                    ? 'border-blue-500 shadow-lg ring-2 ring-blue-100'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {display.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">{display.badge}</span>
                  </div>
                )}

                <div className="p-6 flex-1">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mt-0.5">{display.tagline}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">{price(plan)}</span>
                      {plan.monthlyPriceCents > 0 && <span className="text-gray-400 text-sm">/mo</span>}
                    </div>
                    {interval === 'year' && savingsAmount && savingsAmount > 0 && (
                      <div className="text-xs text-emerald-600 font-medium mt-1">Save ${savingsAmount}/year · billed annually</div>
                    )}
                    {interval === 'month' && plan.monthlyPriceCents > 0 && (
                      <div className="text-xs text-gray-400 mt-1">billed monthly</div>
                    )}
                  </div>

                  <div className="mb-5">
                    <div className="text-sm font-semibold text-gray-700 mb-0.5">
                      {plan.credits === -1 ? 'Unlimited credits' : `${plan.credits} credits${plan.monthlyPriceCents > 0 ? '/month' : ' total'}`}
                    </div>
                    <div className="text-xs text-gray-400">1 credit = 1 analysis report</div>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-0">
                  {isCurrent ? (
                    <div className="w-full text-center py-3 bg-gray-100 rounded-xl text-sm font-medium text-gray-500">
                      Current plan
                    </div>
                  ) : plan.id === 'free' ? (
                    <div className="w-full text-center py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-400">
                      No credit card needed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading === plan.id || !hasPriceId}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                        display.highlight
                          ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'
                          : 'bg-gray-900 hover:bg-gray-700 text-white disabled:bg-gray-400'
                      }`}
                    >
                      {loading === plan.id ? 'Redirecting…' : !hasPriceId ? 'Coming Soon' : `Get ${plan.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add-on packs */}
        <div className="mb-14">
          <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Need more credits?</h3>
          <p className="text-gray-500 text-sm text-center mb-6">One-time credit packs — never expire, stack on any plan.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {ADDON_PACKS.map((pack) => (
              <div key={pack.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col items-center text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{pack.credits}</div>
                <div className="text-sm text-gray-500 mb-3">credits · one-time</div>
                <div className="text-lg font-semibold text-gray-900 mb-4">${(pack.priceCents / 100).toFixed(0)}</div>
                <button
                  onClick={() => handleAddon(pack.id)}
                  disabled={loading === pack.id}
                  className="w-full py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {loading === pack.id ? 'Redirecting…' : 'Buy now'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Feature comparison */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-14">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-lg">Compare plans</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium w-1/3">Feature</th>
                  {['Free', 'Starter', 'Pro', 'Agency'].map(n => (
                    <th key={n} className="text-center px-4 py-3 text-gray-700 font-semibold">{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Credits per month', '3 total', '30', '100', 'Unlimited'],
                  ['Competitive reports', '✓', '✓', '✓', '✓'],
                  ['Growth advisor', '✓', '✓', '✓', '✓'],
                  ['Lead Discovery', '—', '—', '✓', '✓'],
                  ['Support', 'Community', 'Email', 'Priority', 'Dedicated'],
                  ['White-label exports', '—', '—', '—', '✓'],
                  ['Add-on credit packs', '✓', '✓', '✓', '✓'],
                ].map(([feat, ...vals]) => (
                  <tr key={feat} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-3 text-gray-600">{feat}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="text-center px-4 py-3 text-gray-700">
                        {v === '✓' ? (
                          <svg className="h-4 w-4 text-emerald-500 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : v === '—' ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <span className="text-gray-700">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Frequently asked questions</h3>
          <div className="space-y-4">
            {[
              ['What is a credit?', 'One credit = one AI-generated analysis report (either Competitive Analysis or Sales Growth Advisor). Credits are consumed when you generate a new report.'],
              ['Do unused credits roll over?', 'No — subscription credits reset each billing cycle. Add-on pack credits never expire.'],
              ['Can I cancel anytime?', 'Yes. Cancel from the billing portal. You keep access until the end of your billing period.'],
              ['Do you offer refunds?', 'We offer a pro-rated refund within 7 days of the billing date. Contact support.'],
              ['What happens if I run out of credits?', 'You can upgrade your plan, buy an add-on pack, or wait for your credits to renew next billing cycle.'],
              ['Is viewing an existing report free?', 'Yes — retrieving a previously generated report is always free and never uses a credit.'],
            ].map(([q, a]) => (
              <div key={q} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="font-semibold text-gray-900 mb-1">{q}</div>
                <div className="text-gray-500 text-sm">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
