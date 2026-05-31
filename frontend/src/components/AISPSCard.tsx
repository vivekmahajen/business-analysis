import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { LlmAuditSummary, LlmAudit } from '../types';

const CATEGORIES = [
  'Food & Restaurant', 'Retail', 'Health & Wellness', 'Beauty & Personal Care',
  'Auto & Transportation', 'Professional Services', 'Home Services',
  'Fitness & Recreation', 'Entertainment & Nightlife', 'Hospitality & Hotels',
  'Education & Childcare', 'Pet Services',
];

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Moderate' : score >= 25 ? 'Weak' : 'Low';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size * 0.1} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
            strokeWidth={size * 0.1} strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-black text-gray-900" style={{ fontSize: size * 0.28 }}>{score}</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: LlmAuditSummary['status'] }) {
  if (status === 'completed') return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Done</span>;
  if (status === 'running') return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium animate-pulse">Running…</span>;
  if (status === 'pending') return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Queued</span>;
  return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Failed</span>;
}

interface AuditFormProps {
  onDone: () => void;
  onCancel: () => void;
}

function AuditForm({ onDone, onCancel }: AuditFormProps) {
  const [businessName, setBusinessName] = useState('');
  const [businessUrl, setBusinessUrl] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !city || !state || !category) return;
    setError('');
    setSubmitting(true);
    try {
      await api.startLlmAudit({ businessName, businessUrl: businessUrl || undefined, city, state, category });
      onDone();
    } catch (err) {
      setError((err as Error).message || 'Failed to start audit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Business name *"
          value={businessName}
          onChange={e => setBusinessName(e.target.value)}
          required
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="url"
          placeholder="Website (optional)"
          value={businessUrl}
          onChange={e => setBusinessUrl(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="text"
          placeholder="City *"
          value={city}
          onChange={e => setCity(e.target.value)}
          required
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="text"
          placeholder="State (e.g. TX) *"
          value={state}
          onChange={e => setState(e.target.value)}
          required
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        required
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
      >
        <option value="">Select business category *</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {error && (
        <div className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !businessName || !city || !state || !category}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          {submitting ? 'Starting…' : 'Run Audit →'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

interface AuditDetailProps {
  auditId: string;
  onClose: () => void;
}

function AuditDetail({ auditId, onClose }: AuditDetailProps) {
  const [audit, setAudit] = useState<LlmAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAudit = async () => {
    try {
      const data = await api.getLlmAudit(auditId);
      setAudit(data);
      setLoading(false);
      if (data.status === 'completed' || data.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
    pollRef.current = setInterval(loadAudit, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditId]);

  if (loading || !audit) {
    return (
      <div className="py-8 text-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-sm text-gray-500">Loading audit…</div>
      </div>
    );
  }

  const bd = audit.scoreBreakdown;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{audit.businessName}</h3>
            <StatusBadge status={audit.status} />
          </div>
          <div className="text-sm text-gray-500">{audit.city}, {audit.state} · {audit.category}</div>
          {audit.status === 'running' || audit.status === 'pending' ? (
            <div className="text-xs text-purple-600 mt-1">
              {audit.results?.length || 0} of {audit.totalQueries || 20} queries complete — checking every 5s…
            </div>
          ) : null}
        </div>
        {audit.status === 'completed' && audit.overallScore !== null && (
          <ScoreRing score={audit.overallScore} size={72} />
        )}
      </div>

      {audit.status === 'completed' && bd && (
        <>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
            <div className="text-sm font-semibold text-purple-900 mb-1">{bd.label}</div>
            <div className="text-xs text-purple-700 leading-relaxed">{bd.interpretation}</div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Per-Provider Breakdown</div>
            {Object.entries(bd.providers).map(([provider, data]) => (
              <div key={provider}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">{provider}</span>
                  <span className="text-xs text-gray-500">{data.mentioned}/{data.total} queries mentioned · Score: <strong>{data.score}</strong></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${data.score >= 75 ? 'bg-green-500' : data.score >= 50 ? 'bg-yellow-500' : data.score >= 25 ? 'bg-orange-500' : 'bg-red-500'}`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {audit.results && audit.results.filter(r => r.mentioned).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sample Mentions</div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {audit.results.filter(r => r.mentioned).slice(0, 4).map(r => (
                  <div key={r.id} className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <div className="text-xs text-green-700 font-medium mb-1 capitalize">{r.provider} · #{r.mentionRank || '?'}</div>
                    <div className="text-xs text-gray-600 italic">"{r.mentionContext || r.query}"</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {audit.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Audit failed: {audit.errorMessage || 'Unknown error'}
        </div>
      )}

      <button
        onClick={onClose}
        className="text-sm text-gray-500 hover:text-gray-700 underline"
      >
        ← Back to AI Visibility
      </button>
    </div>
  );
}

export default function AISPSCard() {
  const [audits, setAudits] = useState<LlmAuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  const loadAudits = async () => {
    try {
      const data = await api.getLlmAudits();
      setAudits(data.audits);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAudits(); }, []);

  const handleAuditStarted = () => {
    setShowForm(false);
    loadAudits();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-purple-600" viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <div>
            <h2 className="font-syne font-semibold text-gray-900 text-base leading-tight">AI Visibility Score</h2>
            <div className="text-xs text-gray-400">How visible are you in ChatGPT & Perplexity?</div>
          </div>
          <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full ml-1">BETA</span>
        </div>
        {!showForm && !selectedAuditId && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            + New Audit
          </button>
        )}
      </div>

      {selectedAuditId ? (
        <AuditDetail auditId={selectedAuditId} onClose={() => setSelectedAuditId(null)} />
      ) : showForm ? (
        <AuditForm onDone={handleAuditStarted} onCancel={() => setShowForm(false)} />
      ) : loading ? (
        <div className="py-6 text-center">
          <div className="w-6 h-6 border-2 border-purple-300 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : audits.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🤖</div>
          <div className="text-sm font-semibold text-gray-700 mb-1">Check Your AI Search Presence</div>
          <div className="text-xs text-gray-400 max-w-xs mx-auto mb-4 leading-relaxed">
            Run 20 real queries across ChatGPT and Perplexity to see if your business shows up when customers ask for recommendations.
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
          >
            Run Your First AI Audit →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {audits.map(audit => (
            <div
              key={audit.id}
              onClick={() => setSelectedAuditId(audit.id)}
              className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 cursor-pointer transition-colors group"
            >
              {audit.status === 'completed' && audit.overallScore !== null ? (
                <ScoreRing score={audit.overallScore} size={52} />
              ) : (
                <div className="w-14 flex items-center justify-center">
                  {(audit.status === 'pending' || audit.status === 'running') ? (
                    <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-lg">!</div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">{audit.businessName}</span>
                  <StatusBadge status={audit.status} />
                </div>
                <div className="text-xs text-gray-400">{audit.city}, {audit.state} · {audit.category}</div>
                {audit.status === 'completed' && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    Mentioned in {audit.mentionCount} of {audit.totalQueries} AI queries
                  </div>
                )}
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
