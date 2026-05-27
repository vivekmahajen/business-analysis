import React, { useState, useEffect, useCallback } from 'react';
import { AdminLead, LeadDiscoveryResult, TeaserFinding } from '../types';
import { api } from '../utils/api';

interface Props {
  onBack: () => void;
}

const CATEGORIES = [
  'Food & Restaurant', 'Retail', 'Health & Wellness', 'Beauty & Personal Care',
  'Auto & Transportation', 'Professional Services', 'Home Services',
  'Fitness & Recreation', 'Entertainment & Nightlife', 'Hospitality & Hotels',
  'Education & Childcare', 'Pet Services',
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  discovered: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  emailed:    { label: 'Emailed', color: 'bg-purple-100 text-purple-700' },
  clicked:    { label: 'Clicked', color: 'bg-amber-100 text-amber-700' },
  signed_up:  { label: 'Signed Up', color: 'bg-emerald-100 text-emerald-700' },
  converted:  { label: 'Converted', color: 'bg-green-100 text-green-700' },
};

const TREND_ICONS: Record<string, string> = {
  declining: '↘',
  flat: '→',
  improving: '↗',
};

const TREND_COLORS: Record<string, string> = {
  declining: 'text-red-500',
  flat: 'text-gray-400',
  improving: 'text-green-500',
};

function scoreColor(s: number) {
  if (s >= 8) return 'bg-green-500';
  if (s >= 5) return 'bg-amber-500';
  return 'bg-red-500';
}

function starColor(r: number) {
  if (r <= 2) return 'text-red-500';
  if (r <= 3) return 'text-amber-500';
  return 'text-yellow-500';
}

// ─── Teaser Report Modal ─────────────────────────────────────────────────────

function TeaserModal({ lead, onClose, onStatusChange }: {
  lead: AdminLead;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const r = lead.teaserReport;
  const findings: TeaserFinding[] = lead.teaserFindings || [];

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 rounded-t-2xl px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="font-syne font-bold text-lg text-gray-900">{lead.businessName}</div>
            <div className="text-sm text-gray-400">{lead.subCategory || lead.category} · {lead.city}, {lead.state}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none flex-shrink-0">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key metrics row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className={`font-syne font-black text-2xl ${starColor(lead.rating)}`}>{lead.rating}★</div>
              <div className="text-xs text-gray-400 mt-0.5">{lead.reviewCount} reviews</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className={`font-syne font-black text-2xl ${TREND_COLORS[lead.ratingTrend]}`}>
                {TREND_ICONS[lead.ratingTrend]} {lead.ratingTrend}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">rating trend</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="font-syne font-black text-2xl text-gray-800">{lead.conversionScore}/10</div>
              <div className="text-xs text-gray-400 mt-0.5">conversion score</div>
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-1.5">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Contact Info</div>
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-400">✉</span>
                <a href={`mailto:${lead.email}`} className="text-blue-700 hover:underline font-medium">{lead.email}</a>
                {lead.ownerName && <span className="text-blue-400">— {lead.ownerName}</span>}
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-blue-400">☎</span> {lead.phone}
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-400">🌐</span>
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{lead.website}</a>
              </div>
            )}
            {!lead.email && !lead.phone && (
              <div className="text-sm text-gray-400 italic">No contact info found</div>
            )}
          </div>

          {/* Email subject lines */}
          {r?.emailSubject && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Subject Lines</div>
              <div className="bg-gray-900 text-green-400 text-sm px-4 py-2.5 rounded-lg font-mono">{r.emailSubject}</div>
              {r.emailSubjectVariant && (
                <div className="bg-gray-900 text-green-400 text-sm px-4 py-2.5 rounded-lg font-mono">{r.emailSubjectVariant}</div>
              )}
            </div>
          )}

          {/* Opening hook */}
          {r?.openingHook && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Opening Hook</div>
              <div className="bg-gray-50 rounded-xl p-4 text-gray-700 text-sm leading-relaxed italic">"{r.openingHook}"</div>
            </div>
          )}

          {/* Teaser findings */}
          {findings.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Teaser Findings (shown to business owner)
              </div>
              <div className="space-y-3">
                {findings.map((f, i) => (
                  <div key={i} className="border border-orange-200 bg-orange-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-orange-700 bg-orange-200 px-2 py-0.5 rounded-full">{f.code}</span>
                      <span className="font-semibold text-gray-800 text-sm">{f.title}</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{f.finding}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked section hint */}
          <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center space-y-1">
            <div className="text-gray-400 text-sm">🔒 {(lead.fullFindings?.length || 9)} more findings locked</div>
            <div className="text-xs text-gray-400">Revenue gap · Top complaint script · Best upsell · Pricing gaps · 90-day roadmap</div>
          </div>

          {/* CTA preview */}
          {r?.ctaHeadline && (
            <div className="bg-blue-600 text-white rounded-xl p-5 text-center space-y-2">
              <div className="font-syne font-bold text-lg">{r.ctaHeadline}</div>
              <div className="text-blue-200 text-sm">{r.ctaBody}</div>
              <div className="inline-block bg-white text-blue-600 font-semibold px-6 py-2.5 rounded-lg text-sm mt-1">
                {r.ctaButtonText}
              </div>
            </div>
          )}

          {/* Competitors */}
          {(lead.competitors || []).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top Competitors</div>
              <div className="space-y-2">
                {(lead.competitors || []).map((c, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                      {c.rating}★
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.reviewCount} reviews</div>
                      <div className="text-xs text-gray-500 mt-1 italic">{c.keyAdvantage}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status update */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([s, { label, color }]) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(lead.id, s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    lead.status === s
                      ? color + ' ring-2 ring-offset-1 ring-gray-400'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Card ───────────────────────────────────────────────────────────────

function LeadCard({ lead, onView, onStatusChange }: {
  lead: AdminLead;
  onView: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const status = STATUS_LABELS[lead.status] || STATUS_LABELS.discovered;
  const topFinding = lead.teaserFindings?.[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        {/* Conversion score badge */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-syne font-black text-lg flex-shrink-0 ${scoreColor(lead.conversionScore)}`}>
          {lead.conversionScore}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-syne font-bold text-gray-900 truncate">{lead.businessName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${status.color}`}>{status.label}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{lead.subCategory || lead.category} · {lead.city}, {lead.state}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`font-syne font-bold text-xl ${starColor(lead.rating)}`}>{lead.rating}★</div>
              <div className="text-xs text-gray-400">{lead.reviewCount} reviews</div>
            </div>
          </div>

          {/* Rating trend + contact badge */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-xs font-medium ${TREND_COLORS[lead.ratingTrend]}`}>
              {TREND_ICONS[lead.ratingTrend]} {lead.ratingTrend}
            </span>
            {lead.contactFound ? (
              <span className="text-xs text-emerald-600 font-medium">✓ Contact found</span>
            ) : (
              <span className="text-xs text-gray-400">No contact</span>
            )}
            {lead.website && <span className="text-xs text-blue-500">Has website</span>}
            {lead.hasSocialMedia && <span className="text-xs text-purple-500">Social media</span>}
          </div>

          {/* Top teaser finding preview */}
          {topFinding && (
            <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              <span className="text-xs font-bold text-orange-600">{topFinding.code}: </span>
              <span className="text-xs text-gray-600">{topFinding.finding.slice(0, 100)}{topFinding.finding.length > 100 ? '…' : ''}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onView}
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              View Teaser Report
            </button>
            {lead.email && (
              <a
                href={`mailto:${lead.email}?subject=${encodeURIComponent(lead.teaserReport?.emailSubject || '')}`}
                onClick={() => onStatusChange(lead.id, 'emailed')}
                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                ✉ Email Owner
              </a>
            )}
            {lead.website && (
              <a href={lead.website} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1.5">
                Visit site ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discover Tab ────────────────────────────────────────────────────────────

function DiscoverTab() {
  const [category, setCategory] = useState('Food & Restaurant');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [ratingCeiling, setRatingCeiling] = useState(3.5);
  const [minReviews, setMinReviews] = useState(3);
  const [maxResults, setMaxResults] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LeadDiscoveryResult | null>(null);
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null);

  const handleStatusChange = useCallback(async (id: string, status: string) => {
    try {
      const updated = await api.adminUpdateLeadStatus(id, status);
      if (result) {
        setResult({ ...result, leads: result.leads.map(l => l.id === id ? { ...l, ...updated } : l) });
      }
      if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, ...updated } : null);
    } catch { /* non-fatal */ }
  }, [result, selectedLead]);

  const handleRun = async () => {
    if (!city.trim() || !state.trim()) { setError('City and state are required'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.adminDiscover({ category, state: state.trim(), city: city.trim(), ratingCeiling, minReviews, maxResults });
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Discovery form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-syne font-bold text-lg text-gray-900 mb-1">Run Lead Discovery</h2>
        <p className="text-gray-500 text-sm mb-5">Find low-rated businesses with online presence. Claude searches Yelp, Google, BBB, and TripAdvisor.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">City</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Sacramento"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">State</label>
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value)}
              placeholder="e.g. California"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Advanced options */}
        <details className="mb-4">
          <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 uppercase tracking-wide">Advanced options</summary>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Max rating ceiling</label>
              <input type="number" min={1} max={4} step={0.5} value={ratingCeiling}
                onChange={e => setRatingCeiling(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Min reviews</label>
              <input type="number" min={1} max={100} value={minReviews}
                onChange={e => setMinReviews(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Max results</label>
              <input type="number" min={5} max={200} step={5} value={maxResults}
                onChange={e => setMaxResults(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </details>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <button
          onClick={handleRun}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching… (60–150 sec)
            </>
          ) : 'Run Discovery'}
        </button>
        {loading && (
          <p className="text-xs text-gray-400 mt-2">Claude is searching Yelp, Google, BBB, and TripAdvisor with real-time web search. This takes 1–2 minutes.</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary banner */}
          <div className={`rounded-2xl p-5 flex items-center gap-4 ${result.cached ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${result.cached ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {result.cached ? '💾' : '✓'}
            </div>
            <div className="flex-1">
              <div className={`font-semibold ${result.cached ? 'text-amber-800' : 'text-emerald-800'}`}>
                {result.cached ? 'Cached results (last 24h)' : `Discovery complete — ${result.totalFound} leads found`}
              </div>
              {result.queryMeta && (
                <div className={`text-sm mt-0.5 ${result.cached ? 'text-amber-600' : 'text-emerald-600'}`}>
                  Avg rating: {result.queryMeta.avgRating?.toFixed(1) || '—'} ·
                  Contacts found: {result.queryMeta.contactFoundCount || 0} ·
                  {result.cached ? ' Use the Lead Database tab to view all' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Lead list */}
          {result.leads.length > 0 ? (
            <div className="space-y-3">
              {result.leads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onView={() => setSelectedLead(lead)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-gray-500">No qualifying businesses found for this search. Try a different city or category.</p>
            </div>
          )}
        </div>
      )}

      {selectedLead && (
        <TeaserModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

// ─── Database Tab ────────────────────────────────────────────────────────────

function DatabaseTab() {
  const [filterCategory, setFilterCategory] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState('conversionScore');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminGetLeads({
        category: filterCategory || undefined,
        state: filterState || undefined,
        city: filterCity || undefined,
        status: filterStatus || undefined,
        sort,
        page,
        limit: 50,
      });
      setLeads(res.leads || []);
      setTotal(res.total || 0);
    } catch { /* non-fatal */ } finally {
      setLoading(false);
    }
  }, [filterCategory, filterState, filterCity, filterStatus, sort, page]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  useEffect(() => {
    if (!filterCategory) { setStates([]); setFilterState(''); setCities([]); setFilterCity(''); return; }
    api.adminGetStates(filterCategory).then(setStates).catch(() => {});
    setFilterState('');
    setCities([]);
    setFilterCity('');
  }, [filterCategory]);

  useEffect(() => {
    if (!filterCategory || !filterState) { setCities([]); setFilterCity(''); return; }
    api.adminGetCities(filterCategory, filterState).then(setCities).catch(() => {});
    setFilterCity('');
  }, [filterCategory, filterState]);

  const handleStatusChange = useCallback(async (id: string, status: string) => {
    try {
      const updated = await api.adminUpdateLeadStatus(id, status);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
      if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, ...updated } : null);
    } catch { /* non-fatal */ }
  }, [selectedLead]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await api.adminDeleteLead(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      setTotal(prev => prev - 1);
    } catch { /* non-fatal */ }
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterState} onChange={e => setFilterState(e.target.value)} disabled={!filterCategory || states.length === 0}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50">
            <option value="">All states</option>
            {states.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} disabled={!filterState || cities.length === 0}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50">
            <option value="">All cities</option>
            {cities.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([s, { label }]) => <option key={s} value={s}>{label}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">{loading ? 'Loading…' : `${total} leads`}</div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none bg-white">
            <option value="conversionScore">Sort: Conversion score</option>
            <option value="rating">Sort: Lowest rating</option>
            <option value="reviewCount">Sort: Most reviews</option>
          </select>
        </div>
      </div>

      {/* Lead list */}
      {leads.length === 0 && !loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500">No leads found. Run a discovery to populate the database.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <div key={lead.id} className="relative group">
              <LeadCard lead={lead} onView={() => setSelectedLead(lead)} onStatusChange={handleStatusChange} />
              <button
                onClick={() => handleDelete(lead.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 text-sm transition-all px-2 py-1"
                title="Delete lead"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 50 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {Math.ceil(total / 50)}</span>
          <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
        </div>
      )}

      {selectedLead && (
        <TeaserModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AdminLeadDiscoveryScreen({ onBack }: Props) {
  const [tab, setTab] = useState<'discover' | 'database'>('discover');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <button onClick={onBack} className="text-gray-400 hover:text-white text-sm mb-3 flex items-center gap-1 transition-colors">
            ← Dashboard
          </button>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">ADMIN</span>
                <span className="text-gray-400 text-xs uppercase tracking-widest">SiteAnalyzer Pro</span>
              </div>
              <h1 className="font-syne font-bold text-2xl">Lead Discovery Engine</h1>
              <p className="text-gray-400 text-sm mt-0.5">Find underperforming businesses and generate personalised teaser reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-0">
            {([['discover', 'Run Discovery'], ['database', 'Lead Database']] as const).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {tab === 'discover' ? <DiscoverTab /> : <DatabaseTab />}
      </div>
    </div>
  );
}
