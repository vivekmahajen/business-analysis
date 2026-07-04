import React from 'react';
import { AnalysisEntry, AnalysisData, GrowthAdvisorData } from '../types';

interface Props {
  entry: AnalysisEntry;
  isAdmin: boolean;
  onViewFree: () => void;
  onGenerateNew: () => void;
  onBack: () => void;
}

function scoreColor(s: number) {
  if (s >= 80) return 'text-green-600';
  if (s >= 60) return 'text-yellow-600';
  return 'text-red-500';
}

function scoreBg(s: number) {
  if (s >= 80) return 'bg-green-500';
  if (s >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function Locked({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
      <span>🔒</span>
      <span>{label}</span>
    </div>
  );
}

function CompetitivePreview({ data }: { data: AnalysisData }) {
  const summary = data.executiveSummary
    ? data.executiveSummary.split('.').slice(0, 2).join('.') + '.'
    : '';
  const rawScore = (data as unknown as { overallScore?: unknown }).overallScore;
  const overallScore = Number.isFinite(Number(rawScore)) ? Math.round(Number(rawScore)) : null;

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="flex items-center gap-6 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-2xl p-6">
        <div>
          <div className="text-blue-300 text-xs uppercase tracking-widest mb-1">Overall Score</div>
          <div className={`font-syne font-black text-5xl ${overallScore !== null ? scoreColor(overallScore) : 'text-white/50'}`}>
            {overallScore ?? '—'}
          </div>
          <div className="text-blue-200 text-sm mt-1">{data.marketPosition}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-syne font-bold text-xl mb-1">{data.businessName}</div>
          <div className="text-blue-200 text-sm">{data.businessType} · {data.location}</div>
          {summary && (
            <p className="text-blue-100 text-xs mt-3 leading-relaxed opacity-90">{summary}</p>
          )}
        </div>
      </div>

      {/* Score grid */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Performance Scores</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'SEO', score: data.seoScore },
            { label: 'Digital', score: data.digitalScore },
            { label: 'Content', score: data.contentScore },
            { label: 'UX', score: data.uxScore },
          ].map(({ label, score: rawS }) => {
            const s = Number.isFinite(Number(rawS)) ? Math.round(Number(rawS)) : null;
            return (
              <div key={label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">{label}</div>
                <div className={`font-syne font-bold text-2xl ${s !== null ? scoreColor(s) : 'text-gray-400'}`}>{s ?? '—'}</div>
                <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s !== null ? scoreBg(s) : 'bg-gray-300'}`} style={{ width: `${s ?? 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anonymized competitors */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Competitors Identified ({data.competitors?.length || 0})
        </div>
        <div className="space-y-2">
          {(data.competitors || []).slice(0, 2).map((c, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${scoreBg(c.score)}`}>
                {c.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-700 text-sm">Competitor {i + 1}</div>
                <div className="text-xs text-gray-400 mt-0.5 blur-sm select-none">{c.url || 'example.com'}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(c.tags || []).slice(0, 3).map((t, j) => (
                    <span key={j} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <div className="text-gray-200 text-xs blur-sm select-none flex-shrink-0 max-w-[120px] text-right">
                {c.description}
              </div>
            </div>
          ))}
          {(data.competitors?.length || 0) > 2 && (
            <Locked label={`+${(data.competitors?.length || 0) - 2} more competitors — view full report`} />
          )}
        </div>
      </div>

      {/* Locked sections */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Report Sections</div>
        <Locked label={`${data.weaknesses?.length || 0} weaknesses identified — unlock to view details`} />
        <Locked label={`${data.gaps?.length || 0} competitive gaps found — unlock to view analysis`} />
        {(data as AnalysisData & { competitorOpportunities?: unknown[] }).competitorOpportunities?.length ? (
          <Locked label={`${(data as AnalysisData & { competitorOpportunities?: unknown[] }).competitorOpportunities!.length} competitor-inspired opportunities — unlock to view`} />
        ) : null}
        <Locked label={`${data.solutions?.length || 0} strategic recommendations with implementation steps`} />
      </div>
    </div>
  );
}

function GrowthPreview({ data }: { data: GrowthAdvisorData }) {
  return (
    <div className="space-y-6">
      {/* Revenue header */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-700 text-white rounded-2xl p-6">
        <div className="text-emerald-300 text-xs uppercase tracking-widest mb-1">Sales Growth Advisor</div>
        <div className="font-syne font-bold text-xl mb-1">{data.businessName}</div>
        <div className="text-emerald-200 text-sm mb-4">{data.businessType} · {data.location}</div>
        <div>
          <div className="text-emerald-300 text-xs uppercase tracking-wide mb-1">Total Revenue Opportunity</div>
          <div className="font-syne font-black text-2xl break-words">{data.totalEstimatedMonthlyRevenueRange?.replace(/\s*\(.*\).*$/, '') || data.totalEstimatedMonthlyRevenueRange}</div>
          <div className="text-emerald-300 text-xs mt-0.5">estimated monthly range</div>
        </div>
        {data.topQuickWin && (
          <div className="mt-4 bg-white/10 rounded-xl px-4 py-3 text-sm">
            <span className="text-emerald-300 text-xs font-semibold uppercase">Top Quick Win: </span>
            {data.topQuickWin.slice(0, 80)}{data.topQuickWin.length > 80 ? '…' : ''}
          </div>
        )}
      </div>

      {/* First 2 opportunities */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Growth Opportunities ({data.opportunities?.length || 0} identified)
        </div>
        <div className="space-y-2">
          {(data.opportunities || []).slice(0, 2).map((opp, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {opp.priority}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm">{opp.opportunityTitle}</div>
                <div className="text-xs text-gray-400 mt-0.5 blur-sm select-none">{opp.description?.slice(0, 60)}</div>
              </div>
              <div className="text-green-700 font-bold text-sm flex-shrink-0">{opp.estimatedMonthlyRevenueImpact}</div>
            </div>
          ))}
          {(data.opportunities?.length || 0) > 2 && (
            <Locked label={`+${(data.opportunities?.length || 0) - 2} more opportunities — view full report`} />
          )}
        </div>
      </div>

      {/* Locked sections */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Report Sections</div>
        <Locked label={`${data.competitors?.length || 0} competitors analyzed with intelligence breakdown`} />
        <Locked label="90-Day action roadmap across 3 phases — unlock to view" />
        <Locked label={`${data.trendSignals?.length || 0} market trend signals identified`} />
      </div>
    </div>
  );
}

function ReviewPreview({ data }: { data: { meta?: { reviews_analyzed?: number; avg_rating?: number | null; confidence?: string }; loves?: Array<{ theme: string }>; pain_points?: Array<{ theme: string }> } }) {
  const meta = data?.meta;
  return (
    <div className="bg-white border border-violet-100 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="bg-violet-50 rounded-xl px-4 py-3 text-center min-w-[80px]">
          <div className="text-2xl font-bold text-violet-700">{meta?.avg_rating?.toFixed(1) ?? '—'}</div>
          <div className="text-xs text-violet-400 mt-0.5">avg rating</div>
        </div>
        <div>
          <div className="font-semibold text-gray-900">{meta?.reviews_analyzed ?? 0} reviews analyzed</div>
          <div className="text-sm text-gray-500 capitalize">Confidence: {meta?.confidence ?? 'unknown'}</div>
        </div>
      </div>
      {(data?.loves?.length ?? 0) > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">What customers love</div>
          {data.loves!.slice(0, 2).map((l, i) => (
            <div key={i} className="text-sm text-gray-700 py-0.5">• {l.theme}</div>
          ))}
        </div>
      )}
      {(data?.pain_points?.length ?? 0) > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Areas to improve</div>
          {data.pain_points!.slice(0, 2).map((p, i) => (
            <div key={i} className="text-sm text-gray-700 py-0.5">• {p.theme}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FoundScreen({ entry, isAdmin, onViewFree, onGenerateNew, onBack }: Props) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const isGrowth = entry.reportType === 'growth';
  const isReview = entry.reportType === 'review';

  const viewBtnClass = isReview
    ? 'bg-violet-600 hover:bg-violet-700'
    : isGrowth
      ? 'bg-emerald-600 hover:bg-emerald-700'
      : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-900 text-sm mb-6 flex items-center gap-1 transition-colors"
        >
          ← Dashboard
        </button>

        {/* Found banner */}
        <div className="flex items-center gap-3 mb-6 bg-white border border-green-200 rounded-2xl px-5 py-4 shadow-sm">
          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-lg flex-shrink-0">
            ✓
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900">Saved report found for this URL</div>
            <div className="text-xs text-gray-400 truncate mt-0.5">{entry.url} · Generated {formatDate(entry.at)}</div>
          </div>
        </div>

        {/* Report preview */}
        {isReview
          ? <ReviewPreview data={entry.data as unknown as { meta?: { reviews_analyzed?: number; avg_rating?: number | null; confidence?: string }; loves?: Array<{ theme: string }>; pain_points?: Array<{ theme: string }> }} />
          : isGrowth
            ? <GrowthPreview data={entry.data as unknown as GrowthAdvisorData} />
            : <CompetitivePreview data={entry.data as AnalysisData} />
        }

        {/* Action buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={onViewFree}
            className={`w-full font-semibold py-3.5 rounded-xl transition-colors text-white ${viewBtnClass}`}
          >
            View Saved Report — Free
          </button>
          <button
            onClick={onGenerateNew}
            className={`w-full font-medium py-3 rounded-xl transition-colors ${
              isAdmin
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isAdmin
              ? 'Generate Fresh Report — Free'
              : isReview
                ? 'Generate Fresh Report — 15 tokens'
                : 'Generate Fresh Report — 1 token'}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          {isReview
            ? 'Newer reviews may have appeared since this report was generated.'
            : 'A fresh report re-runs the full analysis with current data.'}
        </p>
      </div>
    </div>
  );
}
