import React, { useState } from 'react';
import { api } from '../utils/api';

interface Props {
  url: string;
  radius: number;
  reportType?: 'competitive' | 'growth';
  city?: string;
  state?: string;
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
  error: string;
  setError: (e: string) => void;
}

export default function PaymentScreen({ url, radius, reportType = 'competitive', city, state, onSuccess, onBack, error, setError }: Props) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let intentResult: { clientSecret: string; publishableKey: string };
      if (reportType === 'growth') {
        intentResult = await api.createGrowthPaymentIntent(url, radius, city || '', state || '');
      } else {
        intentResult = await api.createPaymentIntent(url, radius);
      }

      const paymentIntentId = intentResult.clientSecret.split('_secret_')[0];
      onSuccess(paymentIntentId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const reportLabel = reportType === 'growth' ? 'Sales Growth Advisor' : 'Competitive Analysis Report';
  const headerClass = reportType === 'growth' ? 'bg-emerald-700' : 'bg-blue-600';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-900 text-sm mb-6 flex items-center gap-1 transition-colors"
        >
          ← Dashboard
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className={`${headerClass} p-6 text-white`}>
            <div className="text-sm text-white/70 mb-1">{reportLabel}</div>
            <div className="font-syne font-bold text-2xl">$99.00/mo</div>
            <div className="text-sm text-white/70 mt-1">Monthly subscription · 50 reports included · Cancel anytime</div>
            <div className="text-sm text-white/70 mt-1 break-all">
              {url} · {radius} mile radius
              {reportType === 'growth' && city && ` · ${city}${state ? `, ${state}` : ''}`}
            </div>
          </div>

          <div className="p-8">
            <h2 className="font-syne font-bold text-xl text-gray-900 mb-6">Payment Details</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="card-name" className="block text-sm font-medium text-gray-700 mb-1">Name on card</label>
                <input
                  id="card-name"
                  name="card-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                  autoComplete="cc-name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">Card number</label>
                <input
                  id="card-number"
                  name="card-number"
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCard(e.target.value))}
                  required
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  autoComplete="cc-number"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                  <input
                    id="expiry"
                    name="expiry"
                    type="text"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    required
                    placeholder="MM/YY"
                    maxLength={5}
                    autoComplete="cc-exp"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                  <input
                    id="cvc"
                    name="cvc"
                    type="text"
                    value={cvc}
                    onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    placeholder="123"
                    maxLength={4}
                    autoComplete="cc-csc"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 rounded-xl transition-colors text-lg"
              >
                {loading ? 'Processing…' : 'Subscribe — $99/mo'}
              </button>
            </form>

            <div className="flex items-center justify-center gap-4 mt-6 text-gray-400">
              <span className="text-xs flex items-center gap-1">🔒 Secure payment</span>
              <span className="text-xs">·</span>
              <span className="text-xs">Powered by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
