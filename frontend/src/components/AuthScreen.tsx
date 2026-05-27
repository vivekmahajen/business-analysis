import React, { useState } from 'react';
import { User, AuthMode } from '../types';
import { api } from '../utils/api';

interface Props {
  mode: AuthMode;
  onToggleMode: () => void;
  onSuccess: (user: User, token: string) => void;
  onBack: () => void;
  error: string;
  setError: (e: string) => void;
}

const TERMS_TEXT = `SiteAnalyzer Pro — Terms of Service (v1.0)

1. INFORMATIONAL PURPOSES ONLY
All reports, analyses, and content provided by SiteAnalyzer Pro are for informational purposes only. Nothing contained in any report constitutes legal, financial, investment, accounting, or professional business advice of any kind.

2. NO LIABILITY FOR BUSINESS DECISIONS
You expressly acknowledge and agree that SiteAnalyzer Pro, its owners, officers, employees, and affiliates shall not be responsible or liable, directly or indirectly, for any losses, damages, or adverse outcomes resulting from business decisions made in reliance on the information provided through our service. You agree not to bring any legal claim, lawsuit, or action against SiteAnalyzer Pro arising from your use of, or reliance on, our reports or any information derived from them.

3. NO WARRANTIES
Reports and analyses are provided "as is" and "as available" without warranty of any kind, express or implied. SiteAnalyzer Pro does not warrant the accuracy, completeness, timeliness, or fitness for a particular purpose of any report.

4. LIMITATION OF LIABILITY
To the fullest extent permitted by applicable law, SiteAnalyzer Pro's total cumulative liability to you shall not exceed the amount paid for the specific report giving rise to the claim. In no event shall SiteAnalyzer Pro be liable for indirect, incidental, special, punitive, or consequential damages.

5. INDEMNIFICATION
You agree to indemnify, defend, and hold harmless SiteAnalyzer Pro and its affiliates, officers, and employees from and against any claims, liabilities, damages, or expenses (including reasonable legal fees) arising out of your use of the service or violation of these terms.

6. ACCEPTANCE
By creating an account you confirm that you are 18 years of age or older, have read and understood these Terms of Service in full, and agree to be legally bound by them.`;

export default function AuthScreen({ mode, onToggleMode, onSuccess, onBack, error, setError }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && !agreed) {
      setError('You must agree to the Terms of Service to create an account');
      return;
    }
    setError('');
    setLoading(true);
    try {
      let result: { user: User; token: string };
      if (mode === 'register') {
        result = await api.register(name, email, password) as { user: User; token: string };
      } else {
        result = await api.login(email, password) as { user: User; token: string };
      }
      onSuccess(result.user, result.token);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="text-blue-300 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="font-syne font-bold text-2xl text-gray-900 mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-gray-500 text-sm">
              {mode === 'login'
                ? 'Sign in to access your competitive intelligence reports'
                : 'Start with a $99 competitive analysis report'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                  autoComplete="name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms of Service</label>
                <div className="border border-gray-200 rounded-xl p-3 h-36 overflow-y-auto bg-gray-50 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-mono">
                  {TERMS_TEXT}
                </div>
                <label className="flex items-start gap-3 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and agree to the <strong>Terms of Service</strong>. I understand that SiteAnalyzer Pro reports are for informational purposes only and I will not hold SiteAnalyzer Pro liable for any business decisions I make.
                  </span>
                </label>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'register' && !agreed)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={onToggleMode} className="text-blue-600 hover:underline font-medium">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
