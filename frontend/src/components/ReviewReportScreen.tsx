import React from 'react';
import { ReviewIntelligenceData, ReviewAspect, ReviewPainPoint, ReviewRecommendation } from '../types';
import { generateReviewHtmlReport } from '../utils/htmlExportReview';

interface Props {
  data: ReviewIntelligenceData;
  url: string;
  generatedAt: string;
  onBack: () => void;
}

function sentimentBar(pos: number, neu: number, neg: number, mix: number) {
  const total = pos + neu + neg + mix;
  if (total === 0) return null;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  return (
    <div className="flex h-2.5 rounded-full overflow-hidden w-full">
      {pos > 0 && <div style={{ width: pct(pos) }} className="bg-emerald-500" title={`${pos} positive`} />}
      {mix > 0 && <div style={{ width: pct(mix) }} className="bg-amber-400" title={`${mix} mixed`} />}
      {neu > 0 && <div style={{ width: pct(neu) }} className="bg-gray-300" title={`${neu} neutral`} />}
      {neg > 0 && <div style={{ width: pct(neg) }} className="bg-red-400" title={`${neg} negative`} />}
    </div>
  );
}

function confidenceColor(c: string) {
  if (c === 'high') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (c === 'moderate') return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-500 bg-red-50 border-red-200';
}

function severityColor(s: string) {
  if (s === 'high') return 'text-red-600 bg-red-50 border-red-200';
  if (s === 'medium') return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-gray-500 bg-gray-50 border-gray-200';
}

function trendIcon(t: string) {
  if (t === 'improving') return { icon: '↑', color: 'text-emerald-600', label: 'Improving' };
  if (t === 'declining') return { icon: '↓', color: 'text-red-500', label: 'Declining' };
  if (t === 'stable') return { icon: '→', color: 'text-blue-500', label: 'Stable' };
  return { icon: '?', color: 'text-gray-400', label: 'Not assessable' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ReviewReportScreen({ data, url, generatedAt, onBack }: Props) {
  const handleDownload = () => {
    const html = generateReviewHtmlReport(data, url, generatedAt);
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(data.business?.name || 'review-intelligence').replace(/[^a-zA-Z0-9]/g, '-')}-reviews.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const { meta, overall_sentiment: os, aspects, loves, pain_points, signals, recommendations, limitations } = data;
  const total = (os?.positive || 0) + (os?.neutral || 0) + (os?.negative || 0) + (os?.mixed || 0);
  const trend = trendIcon(signals?.trend || 'not_assessable');

  const quickWins = (recommendations || []).filter(r => r.type === 'quick_win');
  const structural = (recommendations || []).filter(r => r.type === 'structural');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900 to-violet-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="text-violet-300 text-xs font-syne uppercase tracking-widest mb-1">Review Intelligence</div>
              <h1 className="font-syne font-bold text-2xl sm:text-3xl leading-tight mb-1 truncate">
                {data.business?.name || 'Unknown Business'}
              </h1>
              <div className="text-violet-200 text-sm mb-3 truncate" dir="ltr">{url}</div>
              <div className="flex flex-wrap gap-2 text-xs text-violet-300">
                <span>{formatDate(generatedAt)}</span>
                {meta?.sources?.length > 0 && <span>· {meta.sources.join(', ')}</span>}
                {data.business?.vertical && <span>· {data.business.vertical}</span>}
              </div>
            </div>

            {/* Snapshot stats */}
            <div className="flex gap-4 flex-shrink-0">
              <div className="text-center bg-white/10 rounded-xl px-5 py-3 border border-white/20">
                <div className="font-syne font-bold text-3xl">{meta?.reviews_analyzed || 0}</div>
                <div className="text-violet-200 text-xs mt-0.5">Reviews</div>
              </div>
              {meta?.avg_rating != null && (
                <div className="text-center bg-white/10 rounded-xl px-5 py-3 border border-white/20">
                  <div className="font-syne font-bold text-3xl">{meta.avg_rating.toFixed(1)}</div>
                  <div className="text-violet-200 text-xs mt-0.5">Avg Rating</div>
                </div>
              )}
              <div className={`text-center rounded-xl px-5 py-3 border ${
                meta?.confidence === 'high' ? 'bg-emerald-500/20 border-emerald-400/30' :
                meta?.confidence === 'moderate' ? 'bg-amber-500/20 border-amber-400/30' :
                'bg-red-500/20 border-red-400/30'
              }`}>
                <div className="font-syne font-bold text-lg uppercase">{meta?.confidence || 'low'}</div>
                <div className="text-violet-200 text-xs mt-0.5">Confidence</div>
              </div>
            </div>
          </div>

          {/* Overall sentiment bar */}
          {total > 0 && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-violet-300 mb-1.5">
                <span>Overall Sentiment ({total} reviews)</span>
                <span className="flex gap-3">
                  {os.positive > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>Positive {os.positive}</span>}
                  {os.mixed > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Mixed {os.mixed}</span>}
                  {os.neutral > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block"/>Neutral {os.neutral}</span>}
                  {os.negative > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Negative {os.negative}</span>}
                </span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden w-full gap-0.5">
                {os.positive > 0 && <div style={{ width: `${Math.round((os.positive / total) * 100)}%` }} className="bg-emerald-400 rounded-l-full" />}
                {os.mixed > 0 && <div style={{ width: `${Math.round((os.mixed / total) * 100)}%` }} className="bg-amber-400" />}
                {os.neutral > 0 && <div style={{ width: `${Math.round((os.neutral / total) * 100)}%` }} className="bg-gray-300" />}
                {os.negative > 0 && <div style={{ width: `${Math.round((os.negative / total) * 100)}%` }} className="bg-red-400 rounded-r-full" />}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button onClick={onBack} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              ← Back
            </button>
            <button onClick={handleDownload} className="bg-white text-violet-900 hover:bg-violet-50 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              Download HTML
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* No reviews found */}
        {meta?.reviews_analyzed === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800">
            <div className="font-semibold mb-1">No reviews found</div>
            <p className="text-sm">{limitations || 'No public reviews could be located for this URL. Verify the business has reviews on Google, Yelp, or similar platforms.'}</p>
          </div>
        )}

        {/* Aspect Sentiment */}
        {aspects?.length > 0 && (
          <section>
            <h2 className="font-syne font-bold text-xl text-gray-900 mb-4">Aspect Sentiment</h2>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aspect</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">Sentiment</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Mentions</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {aspects.map((a: ReviewAspect, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5 font-medium text-gray-900 capitalize">{a.aspect}</td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          {sentimentBar(a.positive, a.neutral, a.negative, 0)}
                          <div className="flex gap-2 text-xs text-gray-400">
                            {a.positive > 0 && <span className="text-emerald-600">+{a.positive}</span>}
                            {a.neutral > 0 && <span>{a.neutral}~</span>}
                            {a.negative > 0 && <span className="text-red-500">−{a.negative}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-600 font-medium">{a.frequency}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs italic max-w-xs truncate">
                        {a.example && `"${a.example}"`}
                        {a.note && <span className="ml-1 not-italic text-amber-500">⚠ {a.note}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* What Customers Love */}
        {loves?.length > 0 && (
          <section>
            <h2 className="font-syne font-bold text-xl text-gray-900 mb-4">What Customers Love</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loves.map((love, i) => (
                <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="font-semibold text-emerald-900 text-sm">{love.theme}</div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      {love.frequency} mention{love.frequency !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {love.example && (
                    <p className="text-emerald-700 text-xs italic leading-relaxed">"{love.example}"</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* What's Hurting Them */}
        {pain_points?.length > 0 && (
          <section>
            <h2 className="font-syne font-bold text-xl text-gray-900 mb-4">What's Hurting Them</h2>
            <div className="space-y-3">
              {pain_points.map((p: ReviewPainPoint, i: number) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{p.theme}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${severityColor(p.severity)}`}>
                          {p.severity} severity
                        </span>
                        {p.safety_flag && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            ⚠ Safety/Legal — verify
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">{p.frequency} mention{p.frequency !== 1 ? 's' : ''}</span>
                      </div>
                      {p.example && (
                        <p className="text-gray-500 text-xs italic leading-relaxed">"{p.example}"</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notable Signals */}
        {signals && (
          <section>
            <h2 className="font-syne font-bold text-xl text-gray-900 mb-4">Notable Signals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <div className={`text-2xl font-syne font-bold ${trend.color}`}>{trend.icon}</div>
                <div className="text-gray-700 text-sm font-medium mt-1">Trend</div>
                <div className="text-gray-400 text-xs">{trend.label}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <div className="text-2xl font-syne font-bold text-amber-500">{signals.rating_text_mismatches}</div>
                <div className="text-gray-700 text-sm font-medium mt-1">Rating/Text Mismatches</div>
                <div className="text-gray-400 text-xs">Stars ≠ review tone</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <div className="text-2xl font-syne font-bold text-red-400">{meta?.suspected_fake_count || 0}</div>
                <div className="text-gray-700 text-sm font-medium mt-1">Suspected Fake</div>
                <div className="text-gray-400 text-xs">Down-weighted</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <div className="text-2xl font-syne font-bold text-blue-500">{signals.emerging?.length || 0}</div>
                <div className="text-gray-700 text-sm font-medium mt-1">Emerging Issues</div>
                <div className="text-gray-400 text-xs">Recent & rising</div>
              </div>
            </div>

            {signals.emerging?.length > 0 && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <strong>Emerging:</strong> {signals.emerging.join(' · ')}
              </div>
            )}
            {signals.resolved?.length > 0 && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
                <strong>Resolved:</strong> {signals.resolved.join(' · ')}
              </div>
            )}
            {signals.suspected_fake?.length > 0 && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <strong>Suspected fake/spam signals:</strong> {signals.suspected_fake.join(' · ')}
              </div>
            )}
          </section>
        )}

        {/* Recommendations */}
        {recommendations?.length > 0 && (
          <section>
            <h2 className="font-syne font-bold text-xl text-gray-900 mb-4">Recommendations</h2>

            {quickWins.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-sm text-emerald-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-xs">⚡</span>
                  Quick Wins
                </h3>
                <div className="space-y-3">
                  {quickWins.map((r: ReviewRecommendation, i: number) => (
                    <RecommendationCard key={i} rec={r} />
                  ))}
                </div>
              </div>
            )}

            {structural.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs">🏗</span>
                  Structural Changes
                </h3>
                <div className="space-y-3">
                  {structural.map((r: ReviewRecommendation, i: number) => (
                    <RecommendationCard key={i} rec={r} color="blue" />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Confidence & Limitations */}
        <section>
          <div className={`rounded-2xl border px-5 py-4 text-sm ${confidenceColor(meta?.confidence || 'low')}`}>
            <div className="font-semibold mb-1">
              Confidence: {(meta?.confidence || 'low').charAt(0).toUpperCase() + (meta?.confidence || 'low').slice(1)}
            </div>
            <p className="mb-1">{meta?.confidence_reason}</p>
            {limitations && <p className="opacity-80">{limitations}</p>}
            <p className="mt-2 opacity-70 text-xs">
              Analysis covers {meta?.reviews_analyzed || 0} reviews from {meta?.date_range || 'unknown period'}.
              Reviewer pools skew toward extreme opinions — the silent majority is not represented.
              All recommendations are hypotheses; validate with your own operational data.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}

function RecommendationCard({ rec, color = 'emerald' }: { rec: ReviewRecommendation; color?: string }) {
  const accent = color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200';
  const tag = color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700';

  return (
    <div className={`border rounded-2xl p-5 shadow-sm ${accent}`}>
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tag}`}>
              Re: {rec.theme}
            </span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{rec.action}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs text-gray-600">
        <div>
          <span className="font-semibold text-gray-700">Expected impact</span>{' '}
          <span className="text-gray-400">(hypothesis)</span>
          <p className="mt-0.5 text-gray-500">{rec.expected_impact}</p>
        </div>
        <div>
          <span className="font-semibold text-gray-700">How to measure</span>
          <p className="mt-0.5 text-gray-500">{rec.how_to_measure}</p>
        </div>
      </div>
    </div>
  );
}
