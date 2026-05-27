import React, { useState } from 'react';
import { GrowthAdvisorData, GrowthOpportunity, GrowthProvider } from '../types';
import { generateGrowthHtmlReport } from '../utils/htmlExportGrowth';

interface Props {
  data: GrowthAdvisorData;
  url: string;
  generatedAt: string;
  onBack: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  A: 'Product Expansion',
  B: 'Pricing & Bundling',
  C: 'New Sales Channels',
  D: 'Marketing & Audience',
  E: 'Operational Levers',
};

const CATEGORY_COLOR: Record<string, string> = {
  A: 'bg-blue-100 text-blue-700 border-blue-200',
  B: 'bg-purple-100 text-purple-700 border-purple-200',
  C: 'bg-green-100 text-green-700 border-green-200',
  D: 'bg-orange-100 text-orange-700 border-orange-200',
  E: 'bg-pink-100 text-pink-700 border-pink-200',
};

const EFFORT_COLOR: Record<string, string> = {
  Low: 'bg-green-100 text-green-700 border-transparent',
  Medium: 'bg-yellow-100 text-yellow-700 border-transparent',
  High: 'bg-red-100 text-red-700 border-transparent',
};

const URGENCY_COLOR: Record<string, string> = {
  Immediate: 'bg-red-100 text-red-700',
  Seasonal: 'bg-orange-100 text-orange-700',
  Ongoing: 'bg-blue-100 text-blue-700',
};

const MONTH_COLOR = [
  { bg: 'bg-green-600', light: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', number: 'bg-green-100 text-green-700' },
  { bg: 'bg-blue-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', number: 'bg-blue-100 text-blue-700' },
  { bg: 'bg-purple-600', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', number: 'bg-purple-100 text-purple-700' },
];

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
      {label}
    </span>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="font-syne font-bold text-xl text-gray-900 mb-5 pb-3 border-b border-gray-200">
      {title}
    </h2>
  );
}

function ProviderCard({ provider }: { provider: GrowthProvider }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-semibold text-gray-900 text-sm">{provider.providerName}</div>
        <span className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
          {provider.providerType}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{provider.serviceDescription}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span><strong className="text-gray-700">Cost:</strong> {provider.estimatedCost}</span>
        {provider.website && (
          <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px]">
            {provider.website}
          </a>
        )}
        {provider.proximityNote && <span className="text-gray-400">{provider.proximityNote}</span>}
      </div>
    </div>
  );
}

function OpportunityCard({ opp, rank }: { opp: GrowthOpportunity; rank: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(v => !v)}
        role="button"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              {rank}
            </div>
            <div className="min-w-0">
              <h4 className="font-syne font-bold text-gray-900 text-base leading-tight mb-2">
                {opp.opportunityTitle}
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge
                  label={`${opp.category} — ${CATEGORY_LABELS[opp.category] || opp.category}`}
                  className={CATEGORY_COLOR[opp.category] || 'bg-gray-100 text-gray-700 border-gray-200'}
                />
                <Badge label={`Effort: ${opp.implementationEffort}`} className={EFFORT_COLOR[opp.implementationEffort] || 'bg-gray-100 text-gray-700 border-transparent'} />
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-green-700 font-bold text-sm whitespace-nowrap">{opp.estimatedMonthlyRevenueImpact}</div>
            <div className="text-xs text-gray-400 mt-0.5">{opp.timeToRevenue}</div>
            <div className="text-gray-400 text-lg mt-1">{expanded ? '▲' : '▼'}</div>
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-4 leading-relaxed">{opp.description}</p>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-6 pb-6 space-y-4 pt-4">
          {opp.competitorEvidence && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Competitor Evidence</div>
              <p className="text-sm text-blue-800">{opp.competitorEvidence}</p>
            </div>
          )}
          {opp.trendSignal && (
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Market Trend Signal</div>
              <p className="text-sm text-purple-800">{opp.trendSignal}</p>
            </div>
          )}
          {opp.implementationSteps && opp.implementationSteps.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Implementation Steps</div>
              <ol className="space-y-2">
                {opp.implementationSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {opp.providers && opp.providers.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Local Implementation Providers</div>
              <div className="space-y-3">
                {opp.providers.map((p, i) => (
                  <ProviderCard key={i} provider={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const DISCLAIMER = 'This report is provided for informational purposes only and does not constitute legal, financial, or professional advice. SiteAnalyzer Pro is not responsible for any business decisions made based on the information contained in this report.';

function Disclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-xs text-amber-800 leading-relaxed">
      <strong className="font-semibold">Disclaimer:</strong> {DISCLAIMER}
    </div>
  );
}

export default function GrowthReportScreen({ data, url, generatedAt, onBack }: Props) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const handleDownload = () => {
    const html = generateGrowthHtmlReport(data, url, generatedAt);
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${data.businessName.replace(/[^a-zA-Z0-9]/g, '-')}-growth-advisor.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const sortedOpportunities = [...(data.opportunities || [])].sort((a, b) => a.priority - b.priority);

  const roadmapMonths = [
    { key: 'month1', label: 'Month 1', data: data.roadmap?.month1 },
    { key: 'month2', label: 'Month 2', data: data.roadmap?.month2 },
    { key: 'month3', label: 'Month 3', data: data.roadmap?.month3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-emerald-900 to-teal-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button onClick={onBack} className="text-emerald-300 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors">
            ← Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="text-emerald-300 text-xs font-syne uppercase tracking-widest mb-1">SiteAnalyzer Pro · Sales Growth Advisor</div>
              <h1 className="font-syne font-extrabold text-3xl sm:text-4xl mb-1 break-words">{data.businessName}</h1>
              <p className="text-emerald-200 text-sm">{data.businessType} · {data.location}</p>
              <p className="text-emerald-300 text-xs mt-1">Generated {formatDate(generatedAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-3 flex-shrink-0 max-w-xs">
              <div className="text-right">
                <div className="text-xs text-emerald-300 uppercase tracking-wide mb-0.5">Total Revenue Opportunity</div>
                <div className="font-syne font-black text-xl sm:text-2xl text-white leading-tight break-words">
                  {/* Strip any parenthetical suffix the AI sometimes adds */}
                  {data.totalEstimatedMonthlyRevenueRange?.replace(/\s*\(.*\).*$/, '') || data.totalEstimatedMonthlyRevenueRange}
                </div>
                <div className="text-emerald-300 text-xs mt-0.5">estimated monthly range</div>
              </div>
              <button onClick={handleDownload} className="bg-white text-emerald-900 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-colors flex items-center gap-2 whitespace-nowrap">
                ⬇ Download HTML
              </button>
            </div>
          </div>
          {data.topQuickWin && (
            <div className="mt-6 bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/20">
              <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wide mb-1">Top Quick Win</div>
              <p className="text-white text-sm font-medium">{data.topQuickWin}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        <Disclaimer />

        <section>
          <SectionHeader title="Business Overview" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Products / Services</div>
              <ul className="space-y-1.5">
                {(data.currentProducts || []).map((p, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2 items-start"><span className="text-gray-300 flex-shrink-0 mt-0.5">•</span>{p}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Sales Channels</div>
              <ul className="space-y-1.5">
                {(data.currentChannels || []).map((c, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2 items-start"><span className="text-gray-300 flex-shrink-0 mt-0.5">•</span>{c}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Pricing</div>
              <p className="text-sm text-gray-700">{data.currentPricing || 'Not available'}</p>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="90-Day Action Roadmap" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {roadmapMonths.map((month, idx) => {
              const colors = MONTH_COLOR[idx];
              if (!month.data) return null;
              return (
                <div key={month.key} className={`rounded-2xl border ${colors.border} ${colors.light} overflow-hidden`}>
                  <div className={`${colors.bg} px-5 py-4`}>
                    <div className="text-white font-syne font-bold text-base">{month.label}</div>
                    <div className="text-white/80 text-sm">{month.data.theme}</div>
                  </div>
                  <div className="p-4 space-y-3">
                    {(month.data.actions || []).map((action, j) => (
                      <div key={j} className="bg-white rounded-xl p-3 border border-gray-100">
                        <div className="font-semibold text-gray-900 text-sm mb-1">{action.opportunityTitle}</div>
                        <p className="text-xs text-gray-500">{action.firstStep}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeader title={`Growth Opportunities (${sortedOpportunities.length})`} />
          <div className="space-y-4">
            {sortedOpportunities.map((opp, i) => (
              <OpportunityCard key={i} opp={opp} rank={opp.priority} />
            ))}
          </div>
        </section>

        {data.competitors && data.competitors.length > 0 && (
          <section>
            <SectionHeader title="Competitor Intelligence" />
            <div className="space-y-4">
              {data.competitors.map((c, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-syne font-bold text-lg text-gray-900">{c.name}</h3>
                      {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline">{c.url}</a>}
                      {c.distance && <span className="ml-3 text-xs text-gray-400">{c.distance}</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {c.uniqueProducts && c.uniqueProducts.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Unique Products</div>
                        <ul className="space-y-1">{c.uniqueProducts.map((p, j) => <li key={j} className="text-sm text-gray-600 flex gap-1.5 items-start"><span className="text-gray-300 flex-shrink-0 mt-0.5">→</span>{p}</li>)}</ul>
                      </div>
                    )}
                    {c.salesChannels && c.salesChannels.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sales Channels</div>
                        <div className="flex flex-wrap gap-1.5">{c.salesChannels.map((ch, j) => <span key={j} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">{ch}</span>)}</div>
                      </div>
                    )}
                    {c.strengthsOverTarget && c.strengthsOverTarget.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Strengths Over You</div>
                        <ul className="space-y-1">{c.strengthsOverTarget.map((s, j) => <li key={j} className="text-sm text-gray-600 flex gap-1.5 items-start"><span className="text-orange-400 flex-shrink-0 mt-0.5">!</span>{s}</li>)}</ul>
                      </div>
                    )}
                  </div>
                  {(c.pricingNotes || c.loyaltyOrPromos) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {c.pricingNotes && <div><span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pricing: </span><span className="text-sm text-gray-600">{c.pricingNotes}</span></div>}
                      {c.loyaltyOrPromos && <div><span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Loyalty/Promos: </span><span className="text-sm text-gray-600">{c.loyaltyOrPromos}</span></div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.trendSignals && data.trendSignals.length > 0 && (
          <section>
            <SectionHeader title="Market Trend Signals" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.trendSignals.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{t.trend}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${URGENCY_COLOR[t.urgency] || 'bg-gray-100 text-gray-600'}`}>{t.urgency}</span>
                  </div>
                  <p className="text-sm text-gray-500">{t.relevance}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Disclaimer />

        <div className="text-center py-8 border-t border-gray-200 text-gray-400 text-sm">
          Sales Growth Advisor by <strong className="text-gray-600">SiteAnalyzer Pro</strong> · {formatDate(generatedAt)}
          <div className="text-xs mt-1"><a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{url}</a></div>
        </div>
      </div>
    </div>
  );
}
