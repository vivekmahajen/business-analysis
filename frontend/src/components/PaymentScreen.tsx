import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../utils/api';

interface Props {
  url: string;
  radius: number;
  reportType?: 'competitive' | 'growth' | 'review';
  city?: string;
  state?: string;
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
  error: string;
  setError: (e: string) => void;
}

const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#2563eb',
    colorText: '#111827',
    colorTextSecondary: '#6b7280',
    colorBackground: '#ffffff',
    colorDanger: '#ef4444',
    borderRadius: '12px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e5e7eb',
      boxShadow: 'none',
      padding: '12px 16px',
    },
    '.Input:focus': {
      border: '1px solid #2563eb',
      boxShadow: '0 0 0 3px rgba(37,99,235,0.15)',
    },
    '.Label': {
      fontWeight: '500',
      fontSize: '14px',
      marginBottom: '6px',
    },
  },
};

interface CheckoutFormProps {
  reportType: 'competitive' | 'growth' | 'review';
  onSuccess: (id: string) => void;
  onBack: () => void;
  headerClass: string;
  reportLabel: string;
  url: string;
  radius: number;
  city?: string;
  state?: string;
}

function CheckoutForm({ reportType, onSuccess, onBack, headerClass, reportLabel, url, radius, city, state }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError('');
    setLoading(true);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please try again.');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else {
        setError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      setError((err as Error).message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="font-bold text-2xl">$99.00/mo</div>
            <div className="text-sm text-white/70 mt-1">Monthly subscription · 50 reports included · Cancel anytime</div>
            <div className="text-sm text-white/70 mt-1 break-all">
              {url} · {radius} mile radius
              {reportType === 'growth' && city && ` · ${city}${state ? `, ${state}` : ''}`}
            </div>
          </div>

          <div className="p-8">
            <h2 className="font-bold text-xl text-gray-900 mb-2">Payment Details</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your payment is secured and encrypted by Stripe.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  fields: {
                    billingDetails: {
                      name: 'auto',
                      email: 'auto',
                    },
                  },
                }}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !stripe || !elements}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 rounded-xl transition-colors text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing…
                  </span>
                ) : 'Subscribe — $99/mo'}
              </button>
            </form>

            <div className="flex items-center justify-center gap-3 mt-6">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                256-bit SSL encryption
              </span>
              <span className="text-gray-300">·</span>
              <svg className="h-6" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10 10 0 01-4.56 1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.58zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-3.84.82V6.27h3.41l.14 1.02a4.4 4.4 0 013.2-1.3c2.87 0 5.62 2.6 5.62 7.17 0 5.13-2.71 7.14-5.61 7.14zM40 9.92c-.95 0-1.54.34-1.97.81l.03 6.27c.42.46 1 .8 1.94.8 1.54 0 2.59-1.72 2.59-3.95 0-2.18-1.07-3.93-2.59-3.93zM28.24 5.07c1.22 0 2.2 1 2.2 2.2a2.2 2.2 0 01-4.4 0c0-1.2.98-2.2 2.2-2.2zm-1.92 15.19V6.27h3.84v13.99h-3.84zM23.69 19.26v.73h-3.84V.5l3.84-.82v6.6a4.82 4.82 0 013.16-1.09c2.83 0 5.59 2.45 5.59 7.2 0 5.13-2.89 7.12-5.73 7.12a4.61 4.61 0 01-3.02-1.25zm2.11-9.11c-.97 0-1.54.36-1.95.8l.04 6.17c.4.42.96.75 1.9.75 1.5 0 2.54-1.67 2.54-3.88 0-2.15-1.07-3.84-2.53-3.84zM10.24 19.26a11.33 11.33 0 01-4.73-1v-3.5c1.4.81 3.21 1.43 4.73 1.43 1.13 0 1.94-.47 1.94-1.34C12.18 13 5.5 13.36 5.5 8.5c0-2.87 2.3-5.06 5.9-5.06 1.56 0 3.12.37 4.49.95v3.44c-1.26-.68-2.88-1.1-4.49-1.1-1.07 0-1.77.47-1.77 1.24 0 1.79 6.68 1.26 6.68 6.33 0 3.1-2.43 5.06-6.07 5.06z" fill="#6772e5"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentScreen({ url, radius, reportType = 'competitive', city, state, onSuccess, onBack, error: _error, setError: _setError }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [initError, setInitError] = useState('');
  const [initLoading, setInitLoading] = useState(true);

  const reportLabel = reportType === 'growth' ? 'Sales Growth Advisor' : 'Competitive Analysis Report';
  const headerClass = reportType === 'growth' ? 'bg-emerald-700' : 'bg-blue-600';

  useEffect(() => {
    async function init() {
      try {
        const result = reportType === 'growth'
          ? await api.createGrowthPaymentIntent(url, radius, city || '', state || '')
          : await api.createPaymentIntent(url, radius);

        setClientSecret(result.clientSecret);
        setStripePromise(loadStripe(result.publishableKey));
      } catch (err) {
        setInitError((err as Error).message || 'Failed to initialize payment. Please try again.');
      } finally {
        setInitLoading(false);
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (initLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900 text-sm mb-6 flex items-center gap-1">
            ← Dashboard
          </button>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className={`${headerClass} p-6 text-white`}>
              <div className="text-sm text-white/70 mb-1">{reportLabel}</div>
              <div className="font-bold text-2xl">$99.00/mo</div>
            </div>
            <div className="p-8 flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-gray-500 text-sm">Setting up secure payment…</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (initError || !clientSecret || !stripePromise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900 text-sm mb-6 flex items-center gap-1">
            ← Dashboard
          </button>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="text-red-500 text-3xl mb-3">⚠</div>
            <p className="text-gray-700 font-medium mb-1">Payment setup failed</p>
            <p className="text-gray-500 text-sm mb-6">{initError || 'Unable to initialize payment. Please try again.'}</p>
            <button onClick={onBack} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: stripeAppearance,
      }}
    >
      <CheckoutForm
        reportType={reportType}
        onSuccess={onSuccess}
        onBack={onBack}
        headerClass={headerClass}
        reportLabel={reportLabel}
        url={url}
        radius={radius}
        city={city}
        state={state}
      />
    </Elements>
  );
}
