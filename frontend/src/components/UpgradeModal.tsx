import React, { useState } from 'react';
import { api } from '../utils/api';

interface Props {
  currentPlan: string;
  onClose: () => void;
  onViewPricing: () => void;
  onSuccess?: () => void;
}

const PLANS = [
  { id: 'starter', name: 'Starter', credits: 30, priceCents: 2900, highlight: false },
  { id: 'pro', name: 'Pro', credits: 100, priceCents: 7900, highlight: true },
  { id: 'agency', name: 'Agency', credits: -1, priceCents: 19900, highlight: false },
];

export default function UpgradeModal({ currentPlan, onClose, onViewPricing, onSuccess }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const upgradePlans = PLANS.filter(p => p.id !== currentPlan);

  const handleUpgrade = async (planId: string) => {
    setError('');
    setLoading(planId);
    try {
      const result = await api.demoUpgrade(planId);
      const plan = PLANS.find(p => p.id === planId);
      setSuccessMsg(`Upgraded to ${plan?.name ?? planId} — ${result.creditsRemaining === 999999 ? 'unlimited' : result.creditsRemaining} credits`);
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
      setLoading(null);
    }
  };

  const handleAddon = async () => {
    setError('');
    setLoading('pack_25');
    try {
      const result = await api.demoAddCredits(25);
      setSuccessMsg(`${result.creditsAdded} credits added — you now have ${result.creditsRemaining}`);
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-blue-200 text-sm font-medium mb-1">Credits exhausted</div>
              <h2 className="text-xl font-bold">You're out of credits</h2>
              <p className="text-blue-100 text-sm mt-1">Upgrade to keep generating reports.</p>
            </div>
            <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors p-1">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {successMsg ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✓</div>
              <div className="font-semibold text-gray-900 mb-1">{successMsg}</div>
              <button
                onClick={onClose}
                className="mt-4 bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {/* Quick upgrade options */}
              <div className="space-y-3 mb-5">
                {upgradePlans.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!loading}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      plan.highlight
                        ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    } disabled:opacity-60`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${plan.highlight ? 'text-blue-900' : 'text-gray-900'}`}>{plan.name}</span>
                        {plan.highlight && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">Recommended</span>}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {plan.credits === -1 ? 'Unlimited credits' : `${plan.credits} credits/month`}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className={`font-bold ${plan.highlight ? 'text-blue-700' : 'text-gray-700'}`}>
                        ${(plan.priceCents / 100).toFixed(0)}/mo
                      </div>
                      {loading === plan.id ? (
                        <div className="text-xs text-gray-400 mt-0.5">Activating…</div>
                      ) : (
                        <div className={`text-xs mt-0.5 ${plan.highlight ? 'text-blue-500' : 'text-gray-400'}`}>Subscribe →</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or buy a one-time pack</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Addon pack quick buy */}
              <button
                onClick={handleAddon}
                disabled={!!loading}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">25 Credits pack</div>
                  <div className="text-sm text-gray-500">One-time purchase · never expire · covers Review Intelligence</div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="font-bold text-gray-700">$30</div>
                  {loading === 'pack_25' ? (
                    <div className="text-xs text-gray-400 mt-0.5">Adding…</div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-0.5">Buy once →</div>
                  )}
                </div>
              </button>

              {/* View all pricing */}
              <button
                onClick={onViewPricing}
                className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                View all plans and add-ons →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
