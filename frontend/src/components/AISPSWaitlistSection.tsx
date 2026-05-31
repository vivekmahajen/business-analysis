import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const SAMPLE_SCORES = [
  { provider: 'ChatGPT', score: 32, mentioned: 4, total: 10 },
  { provider: 'Perplexity', score: 18, mentioned: 2, total: 10 },
];

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Moderate' : score >= 25 ? 'Weak' : 'Not Visible';
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{score}</span>
          <span className="text-xs text-white/60">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

function ProviderBar({ provider, score, mentioned, total }: { provider: string; score: number; mentioned: number; total: number }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : score >= 25 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/70 font-medium">{provider}</span>
        <span className="text-white/50">{mentioned}/{total} queries mentioned</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="text-right text-xs font-bold" style={{ color: score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444' }}>
        {score}/100
      </div>
    </div>
  );
}

export default function AISPSWaitlistSection() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [businessUrl, setBusinessUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    api.getLlmWaitlistCount()
      .then(d => setWaitlistCount(d.count))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.joinLlmWaitlist({
        email: email.trim(),
        name: name.trim() || undefined,
        businessUrl: businessUrl.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError((err as Error).message || 'Failed to join. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const overallScore = Math.round(
    SAMPLE_SCORES.reduce((sum, s) => sum + s.score, 0) / SAMPLE_SCORES.length,
  );

  return (
    <div className="bg-gradient-to-br from-purple-950/60 via-indigo-900/60 to-blue-900/60 border-t border-b border-purple-500/20 py-20">
      <div className="max-w-5xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-800/40 border border-purple-500/30 rounded-full px-4 py-2 text-sm text-purple-200 mb-6">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            Coming Soon — Beta Waitlist Open
          </div>
          <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-white mb-4">
            AI Search Presence Score
            <span className="text-purple-300"> (AISPS)</span>
          </h2>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto leading-relaxed">
            When customers ask ChatGPT, Perplexity, or Claude <em>"What's the best [business type] near me?"</em> — does your business show up? Find out.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Sample score card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-purple-300 text-xs uppercase tracking-widest mb-1">Sample Report Preview</div>
                <div className="text-white font-syne font-bold text-lg">Mario's Pizzeria</div>
                <div className="text-blue-300 text-sm">Austin, TX · Food & Restaurant</div>
              </div>
              <ScoreGauge score={overallScore} />
            </div>

            <div className="space-y-3">
              {SAMPLE_SCORES.map(s => (
                <ProviderBar key={s.provider} {...s} />
              ))}
            </div>

            <div className="bg-purple-900/40 border border-purple-500/20 rounded-xl p-4">
              <div className="text-xs font-semibold text-purple-300 uppercase tracking-wide mb-2">AI Insight</div>
              <p className="text-sm text-white/80 leading-relaxed">
                Mario's Pizzeria is mentioned in only <strong className="text-white">25% of AI queries</strong> for pizza in Austin. Competitors appear 2–3x more often. Optimizing your Google Business Profile and adding structured data could significantly improve your AI visibility.
              </p>
            </div>

            <div className="space-y-1.5">
              {[
                'Which queries mentioned your business (and which didn\'t)',
                'Per-provider breakdown: ChatGPT vs Perplexity',
                'Sample AI responses where competitors appear',
                'Actionable fixes to improve your score',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-blue-200">
                  <svg className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Waitlist form */}
          <div className="space-y-6">
            <div className="space-y-3">
              {[
                { icon: '🤖', title: 'Real AI Queries', desc: 'We run 20 actual local search queries across ChatGPT and Perplexity — not simulated results.' },
                { icon: '📍', title: 'Location-Specific', desc: 'Queries target your exact city and business category, reflecting real customer searches.' },
                { icon: '📈', title: 'Track Over Time', desc: 'Re-run monthly to see if your visibility improves as you make changes.' },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <div className="text-white font-semibold text-sm mb-0.5">{f.title}</div>
                    <div className="text-blue-200/80 text-xs leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {submitted ? (
              <div className="bg-green-900/40 border border-green-500/30 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <div className="text-white font-syne font-bold text-lg mb-2">You're on the list!</div>
                <div className="text-green-300 text-sm">
                  We'll email you when AI Visibility Audits launch. You'll be among the first to know.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <div>
                  <div className="text-white font-syne font-semibold text-lg mb-1">Join the Beta Waitlist</div>
                  <div className="text-blue-300 text-xs">
                    Free for early access members
                    {waitlistCount !== null && waitlistCount > 0 && (
                      <span className="ml-2 text-purple-300 font-semibold">· {waitlistCount}+ already waiting</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-400/60 focus:bg-white/15 transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Your email address *"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-400/60 focus:bg-white/15 transition-colors"
                  />
                  <input
                    type="url"
                    placeholder="Your business website (optional)"
                    value={businessUrl}
                    onChange={e => setBusinessUrl(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-400/60 focus:bg-white/15 transition-colors"
                  />
                </div>

                {submitError && (
                  <div className="text-red-400 text-xs bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
                >
                  {submitting ? 'Joining…' : 'Join Waitlist →'}
                </button>

                <p className="text-center text-white/40 text-xs">
                  No spam. We'll only email you when the feature launches.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
