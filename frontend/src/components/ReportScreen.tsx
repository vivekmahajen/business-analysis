import React from 'react';
import { AnalysisData, CompetitorOpportunity } from '../types';
import { generateHtmlReport } from '../utils/htmlExport';

interface Props {
  data: AnalysisData;
  url: string;
  generatedAt: string;
  onBack: () => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
};

const FIT_COLOR: Record<string, string> = {
  'Strong Fit': 'bg-green-100 text-green-700 border-green-200',
  'Good Fit': 'bg-blue-100 text-blue-700 border-blue-200',
  'Moderate Fit': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Poor Fit': 'bg-red-100 text-red-700 border-red-200',
};

const OPPORTUNITY_TYPE_LABEL: Record<string, string> = {
  product: 'Product',
  service: 'Service',
  marketing: 'Marketing Tactic',
};

const PRIORITY_BORDER: Record<string, string> = {
  Critical: 'border-l-red-500',
  High: 'border-l-orange-500',
  Medium: 'border-l-yellow-500',
  Low: 'border-l-green-500',
};

const EFFORT_COLOR: Record<string, string> = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-red-100 text-red-700',
};

const TIMEFRAME_COLOR: Record<string, string> = {
  Immediate: 'bg-blue-100 text-blue-700',
  'Short-term': 'bg-purple-100 text-purple-700',
  'Long-term': 'bg-gray-100 text-gray-700',
};

function scoreColor(s: number): string {
  if (s >= 80) return 'text-green-600';
  if (s >= 60) return 'text-yellow-600';
  return 'text-red-500';
}

function scoreBg(s: number): string {
  if (s >= 80) return 'bg-green-500';
  if (s >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${scoreBg(value)}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
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

export default function ReportScreen({ data, url, generatedAt, onBack }: Props) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const handleDownload = () => {
    const html = generateHtmlReport(data, url, generatedAt);
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${data.businessName.replace(/[^a-zA-Z0-9]/g, '-')}-analysis.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <button
                onClick={onBack}
                className="text-blue-300 hover:text-white text-sm mb-3 flex items-center gap-1 transition-colors"
              >
                ← Dashboard
              </button>
              <div className="text-blue-300 text-xs font-syne uppercase tracking-widest mb-1">
                SiteAnalyzer Pro
              </div>
              <h1 className="font-syne font-extrabold text-3xl sm:text-4xl mb-2">{data.businessName}</h1>
              <p className="text-blue-200 text-sm">{data.businessType} · {data.location}</p>
              <p className="text-blue-300 text-xs mt-2">Generated {formatDate(generatedAt)}</p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center">
                <div className={`font-syne font-black text-5xl ${scoreColor(data.overallScore)}`}>
                  {data.overallScore}
                </div>
                <div className="text-blue-300 text-xs mt-1">Overall Score</div>
                <div className="mt-2 px-3 py-1 bg-white/10 rounded-full text-xs">
                  {data.marketPosition}
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="bg-white text-blue-900 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                ⬇ Download HTML
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* Executive Summary */}
        <section>
          <SectionHeader title="Executive Summary" />
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-600 leading-relaxed text-[15px]">
            {data.executiveSummary}
          </div>
        </section>

        {/* Score Cards */}
        <section>
          <SectionHeader title="Performance Scores" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'SEO', score: data.seoScore, findings: data.seoFindings },
              { label: 'Digital Presence', score: data.digitalScore, findings: data.digitalFindings },
              { label: 'Content', score: data.contentScore, findings: data.contentFindings },
              { label: 'UX / Design', score: data.uxScore, findings: data.uxFindings },
            ].map(({ label, score, findings }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</div>
                <div className={`font-syne font-black text-4xl mb-3 ${scoreColor(score)}`}>{score}</div>
                <ScoreBar value={score} />
                <ul className="mt-4 space-y-2">
                  {findings.map((f, i) => (
                    <li key={i} className="text-xs text-gray-500 flex gap-1.5 items-start">
                      <span className="text-gray-300 mt-0.5 flex-shrink-0">→</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Competitors */}
        <section>
          <SectionHeader title="Competitor Analysis" />
          <div className="space-y-4">
            {data.competitors.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-syne font-bold text-lg text-gray-900">{c.name}</h3>
                    </div>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 text-sm hover:underline"
                    >
                      {c.url}
                    </a>
                    <p className="text-gray-600 text-sm mt-3 leading-relaxed">{c.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {c.tags.map((t, j) => (
                        <span key={j} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>

                    {c.products && c.products.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Products & Services</div>
                        <ul className="space-y-1">
                          {c.products.map((p, j) => (
                            <li key={j} className="text-xs text-gray-600 flex gap-1.5 items-start">
                              <span className="text-blue-400 mt-0.5 flex-shrink-0">▸</span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {c.marketingTactics && c.marketingTactics.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Marketing Tactics</div>
                        <ul className="space-y-1">
                          {c.marketingTactics.map((m, j) => (
                            <li key={j} className="text-xs text-gray-600 flex gap-1.5 items-start">
                              <span className="text-purple-400 mt-0.5 flex-shrink-0">▸</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-syne font-bold text-xl flex-shrink-0 ${scoreBg(c.score)}`}>
                    {c.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <SectionHeader title="Strengths" />
            <div className="space-y-4">
              {data.strengths.map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{s.title}</h4>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
                      {s.category}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-3">{s.description}</p>
                  <ScoreBar value={s.score} />
                  <div className="text-xs text-gray-400 mt-1">{s.score}/100</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Weaknesses" />
            <div className="space-y-4">
              {data.weaknesses.map((w, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{w.title}</h4>
                    <Badge label={w.impact} className={PRIORITY_COLOR[w.impact]} />
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-2">{w.description}</p>
                  <span className="text-xs text-gray-400">{w.category}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Gap Analysis */}
        <section>
          <SectionHeader title="Gap Analysis" />
          <div className="space-y-4">
            {data.gaps.map((g, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border border-gray-200 border-l-4 ${PRIORITY_BORDER[g.priority]} p-6`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="font-semibold text-gray-900">{g.title}</h4>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge label={g.priority} className={PRIORITY_COLOR[g.priority]} />
                    <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full border border-gray-200">
                      {g.category}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">{g.description}</p>
                <p className="text-xs text-gray-400">
                  Competitor doing this better: <strong className="text-gray-600">{g.competitor}</strong>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Competitor-Inspired Opportunities */}
        {data.competitorOpportunities && data.competitorOpportunities.length > 0 && (
          <section>
            <SectionHeader title="Competitor-Inspired Opportunities" />
            <p className="text-sm text-gray-500 mb-5 -mt-2">
              Products, services, and marketing tactics used by your competitors — evaluated for fit with your specific business.
            </p>
            <div className="space-y-4">
              {data.competitorOpportunities.map((opp: CompetitorOpportunity, i: number) => (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border border-gray-200 border-l-4 ${PRIORITY_BORDER[opp.priority]} p-6`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{opp.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Seen at: <strong className="text-gray-600">{opp.sourceCompetitor}</strong>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      <Badge label={opp.fitScore} className={FIT_COLOR[opp.fitScore]} />
                      <Badge label={OPPORTUNITY_TYPE_LABEL[opp.type]} className="bg-gray-100 text-gray-600 border-gray-200" />
                      <Badge label={opp.priority} className={PRIORITY_COLOR[opp.priority]} />
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{opp.description}</p>

                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Fit Assessment</div>
                    <p className="text-sm text-blue-900 leading-relaxed">{opp.fitAssessment}</p>
                  </div>

                  {opp.implementationSteps && opp.implementationSteps.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">How to Adopt This</div>
                      <ol className="space-y-2">
                        {opp.implementationSteps.map((step, j) => (
                          <li key={j} className="flex gap-3 text-sm text-gray-600">
                            <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {j + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Solutions */}
        <section>
          <SectionHeader title="Strategic Recommendations" />
          <div className="space-y-6">
            {data.solutions.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="font-syne font-bold text-lg text-gray-900">{s.title}</h4>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <Badge label={s.timeframe} className={TIMEFRAME_COLOR[s.timeframe] + ' border-transparent'} />
                    <Badge label={`Impact: ${s.impact}`} className="bg-purple-100 text-purple-700 border-transparent" />
                    <Badge label={`Effort: ${s.effort}`} className={EFFORT_COLOR[s.effort] + ' border-transparent'} />
                  </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-4">{s.description}</p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-500">Estimated cost:</span>
                  <span className="font-semibold text-gray-900 text-sm">{s.estimatedCost}</span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Implementation Steps
                  </div>
                  <ol className="space-y-2">
                    {s.steps.map((step, j) => (
                      <li key={j} className="flex gap-3 text-sm text-gray-600">
                        <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {j + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200 text-gray-400 text-sm">
          Generated by <strong className="text-gray-600">SiteAnalyzer Pro</strong> · {formatDate(generatedAt)}
        </div>
      </div>
    </div>
  );
}
