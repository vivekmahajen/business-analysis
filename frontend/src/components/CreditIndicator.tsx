import React from 'react';
import { BillingStatus } from '../utils/api';

interface Props {
  status: BillingStatus | null;
  onUpgrade: () => void;
}

export default function CreditIndicator({ status, onUpgrade }: Props) {
  if (!status) return null;

  const { creditsRemaining, creditsTotal, unlimited, planName } = status;
  const pct = unlimited ? 100 : creditsTotal > 0 ? Math.round((creditsRemaining / creditsTotal) * 100) : 0;
  const low = !unlimited && creditsRemaining <= Math.max(1, Math.floor(creditsTotal * 0.15));

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex flex-col items-end">
        <div className="text-xs text-gray-500 leading-none mb-1">
          {planName} plan
        </div>
        <div className="text-xs font-semibold text-gray-700 leading-none">
          {unlimited ? 'Unlimited credits' : `${creditsRemaining} credit${creditsRemaining !== 1 ? 's' : ''} left`}
        </div>
      </div>

      {!unlimited && (
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
          <div
            className={`h-full rounded-full transition-all ${low ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {(low || creditsRemaining === 0) && !unlimited && (
        <button
          onClick={onUpgrade}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg font-medium transition-colors flex-shrink-0"
        >
          Upgrade
        </button>
      )}
    </div>
  );
}
