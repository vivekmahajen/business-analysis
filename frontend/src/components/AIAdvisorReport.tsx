import React from 'react';
import { AdvisorReport } from '../types';

const IMPACT_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-500',
};

const EFFORT_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-green-600',
  moderate: 'text-yellow-600',
  low: 'text-red-500',
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${colorClass}`}>
      {label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function DollarBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-20 text-right">
        ${value.toLocaleString()}
      </span>
    </div>
  );
}

export default function AIAdvisorReport({ report }: { report: AdvisorReport }) {
  const dm = report.dollar_model;
  const maxRevenue = dm.trackable_annual_revenue.optimistic || 1;
  const quickWins = report.fixes.filter(f => f.tier === 'quick_win');
  const structural = report.fixes.filter(f => f.tier === 'structural');
  const diagnosisApplied = report.diagnosis.filter(d => d.applies);

  return (
    <div className="space-y-6 text-gray-700 text-sm">
      {/* Visibility Snapshot */}
      <Section title="Visibility Snapshot">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-400">Confidence:</span>
          <span className={`text-xs font-semibold capitalize ${CONFIDENCE_COLORS[report.snapshot.confidence] || 'text-gray-500'}`}>
            {report.snapshot.confidence}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-medium">Engine</th>
                <th className="text-center py-2 px-3 font-medium">Cited?</th>
                <th className="text-center py-2 px-3 font-medium">Share</th>
                <th className="text-left py-2 px-3 font-medium">Top competitors cited</th>
              </tr>
            </thead>
            <tbody>
              {report.snapshot.engines.map((e, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-medium text-gray-700 capitalize">{e.engine}</td>
                  <td className="py-2 px-3 text-center">
                    {e.brand_cited
                      ? <span className="text-green-600 font-bold">✓</span>
                      : <span className="text-red-400">✗</span>}
                  </td>
                  <td className="py-2 px-3 text-center text-gray-600">
                    {e.share_of_voice_pct !== null ? `${e.share_of_voice_pct}%` : '—'}
                  </td>
                  <td className="py-2 px-3 text-gray-500 max-w-xs">
                    {e.top_competitors_cited.length > 0
                      ? e.top_competitors_cited.slice(0, 3).join(', ')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Diagnosis */}
      <Section title="Diagnosis — Why You're Under-Cited">
        <div className="space-y-2">
          {diagnosisApplied
            .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.impact] - { high: 0, medium: 1, low: 2 }[b.impact]))
            .map((d, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="mt-0.5">
                  <Badge label={d.impact + ' impact'} colorClass={IMPACT_COLORS[d.impact]} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 mb-0.5">{d.cause}</div>
                  <div className="text-gray-500 text-xs leading-relaxed">{d.evidence}</div>
                </div>
              </div>
            ))}
        </div>
      </Section>

      {/* Fix Plan */}
      <Section title="Fix Plan">
        {quickWins.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">⚡ Quick Wins</span>
              <span className="text-xs text-gray-400">Low effort, brand-controllable</span>
            </div>
            <div className="space-y-2">
              {quickWins.map((f, i) => (
                <div key={i} className="p-3 border border-gray-200 rounded-xl bg-white">
                  <div className="flex items-start gap-2 mb-1">
                    <Badge label={f.effort + ' effort'} colorClass={EFFORT_COLORS[f.effort]} />
                    <span className="font-semibold text-gray-800 leading-tight">{f.action}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1"><span className="font-medium text-gray-600">Why:</span> {f.lever}</div>
                  <div className="text-xs text-purple-700 bg-purple-50 rounded-lg px-2 py-1 mb-1">
                    Expected effect: {f.expected_visibility_effect}
                  </div>
                  <div className="text-xs text-gray-400">Measure: {f.measure}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {structural.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">🏗 Structural</span>
              <span className="text-xs text-gray-400">Authority-building, longer horizon</span>
            </div>
            <div className="space-y-2">
              {structural.map((f, i) => (
                <div key={i} className="p-3 border border-gray-200 rounded-xl bg-white">
                  <div className="flex items-start gap-2 mb-1">
                    <Badge label={f.effort + ' effort'} colorClass={EFFORT_COLORS[f.effort]} />
                    <span className="font-semibold text-gray-800 leading-tight">{f.action}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1"><span className="font-medium text-gray-600">Why:</span> {f.lever}</div>
                  <div className="text-xs text-purple-700 bg-purple-50 rounded-lg px-2 py-1 mb-1">
                    Expected effect: {f.expected_visibility_effect}
                  </div>
                  <div className="text-xs text-gray-400">Measure: {f.measure}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Dollar Model */}
      <Section title="Revenue Opportunity Model">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="text-xs font-semibold text-amber-800 mb-1">Projection, not a guarantee</div>
          <div className="text-xs text-amber-700 leading-relaxed">
            This is a transparent, assumption-driven range. Results depend on execution and market factors outside our control.
            {dm.is_projection_not_guarantee && ' All inputs are labeled — user-provided or clearly marked as benchmarks.'}
          </div>
        </div>

        {/* Scenario bars */}
        <div className="space-y-2 mb-4 p-4 bg-white border border-gray-100 rounded-xl">
          <div className="text-xs font-semibold text-gray-600 mb-3">Annual trackable incremental revenue</div>
          <DollarBar label="Conservative" value={dm.trackable_annual_revenue.conservative} max={maxRevenue} color="bg-gray-400" />
          <DollarBar label="Expected" value={dm.trackable_annual_revenue.expected} max={maxRevenue} color="bg-purple-500" />
          <DollarBar label="Optimistic" value={dm.trackable_annual_revenue.optimistic} max={maxRevenue} color="bg-green-500" />
        </div>

        {/* Formula */}
        <div className="text-xs text-gray-400 mb-4 font-mono bg-gray-50 rounded-lg px-3 py-2 overflow-x-auto">
          {dm.formula}
        </div>

        {/* Inputs table */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-600 mb-2">Model inputs</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left py-1.5 pr-3 font-medium">Input</th>
                  <th className="text-left py-1.5 px-3 font-medium">Value</th>
                  <th className="text-left py-1.5 px-3 font-medium">Source</th>
                  <th className="text-left py-1.5 pl-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {dm.inputs.map((inp, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1.5 pr-3 text-gray-700 font-medium">{inp.name}</td>
                    <td className="py-1.5 px-3 text-gray-600">
                      {inp.value !== null ? String(inp.value) : '—'}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${inp.source === 'user_data' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {inp.source === 'user_data' ? 'Actual' : 'Benchmark'}
                      </span>
                    </td>
                    <td className="py-1.5 pl-3 text-gray-400 max-w-xs leading-tight">{inp.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zero-click + dominant sensitivity */}
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <span className="font-semibold text-blue-800">Zero-click brand influence: </span>
            <span className="text-blue-700">{dm.zero_click_brand_influence}</span>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <span className="font-semibold text-gray-700">Dominant sensitivity: </span>
            <span className="text-gray-600">{dm.dominant_sensitivity}</span>
          </div>
        </div>
      </Section>

      {/* Limitations */}
      <Section title="Confidence & Limitations">
        <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
          {report.limitations}
        </div>
      </Section>
    </div>
  );
}
