import React, { useState } from 'react';
import { User, AnalysisEntry } from '../types';
import { useI18n } from '../i18n';
import LanguagePicker from './LanguagePicker';

interface Props {
  user: User;
  isAdmin: boolean;
  saved: AnalysisEntry[];
  urlInput: string;
  setUrlInput: (v: string) => void;
  radius: number;
  setRadius: (v: number) => void;
  onSubmit: (url: string, radius: number, reportType: 'competitive' | 'growth', city?: string, state?: string) => void;
  onViewReport: (entry: AnalysisEntry) => void;
  onDeleteReport: (id: string) => void;
  onLogout: () => void;
  onAdminLeads?: () => void;
  error: string;
  setError: (e: string) => void;
}

const RADII = [1, 5, 10, 25, 50, 100];

export default function DashboardScreen({
  user, isAdmin, saved, urlInput, setUrlInput, radius, setRadius,
  onSubmit, onViewReport, onDeleteReport, onLogout, onAdminLeads, error, setError,
}: Props) {
  const [checking, setChecking] = useState(false);
  const [reportType, setReportType] = useState<'competitive' | 'growth'>('competitive');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    setError('');
    setChecking(true);
    try {
      await onSubmit(url, radius, reportType, city || undefined, state || undefined);
    } finally {
      setChecking(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const scoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-500';

  const getEntryScore = (entry: AnalysisEntry): number | null => {
    if (entry.reportType === 'growth') return null;
    const d = entry.data as { overallScore?: unknown };
    const raw = d.overallScore;
    if (raw === undefined || raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.round(n) : null;
  };

  const getEntryName = (entry: AnalysisEntry): string => {
    const d = entry.data as { businessName?: string };
    return d.businessName || entry.url;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-syne font-bold text-lg text-gray-900">
            SiteAnalyzer <span className="text-blue-600">Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{user.name}</span>
            {isAdmin && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                {t.adminBadge}
              </span>
            )}
            <LanguagePicker variant="minimal" className="!bg-gray-100 !border-gray-200 !text-gray-600 hover:!bg-gray-200 hover:!text-gray-900" />
            {isAdmin && onAdminLeads && (
              <button
                onClick={onAdminLeads}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                Lead Discovery
              </button>
            )}
            <button
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {t.signOut}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* URL Input Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
          <h1 className="font-syne font-bold text-2xl text-gray-900 mb-2">
            {t.analyzeTitle}
          </h1>
          <p className="text-gray-500 mb-6">
            {t.analyzeSub}
          </p>

          {/* Report Type Toggle */}
          <div className="mb-5">
            <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setReportType('competitive')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  reportType === 'competitive'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.competitiveAnalysis}
              </button>
              <button
                type="button"
                onClick={() => setReportType('growth')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  reportType === 'growth'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.salesGrowthAdvisor}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="url-input"
                name="url"
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://yourbusiness.com"
                autoComplete="url"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {RADII.map(r => (
                  <option key={r} value={r}>{r} {r !== 1 ? t.milesLabel : t.mileLabel}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={checking}
                className={`font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap text-white disabled:opacity-60 ${
                  reportType === 'growth'
                    ? isAdmin
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                    : isAdmin
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {checking
                  ? t.checking
                  : reportType === 'growth'
                    ? isAdmin ? `${t.salesGrowthAdvisor} — Free` : `${t.salesGrowthAdvisor} — $99`
                    : isAdmin ? `${t.competitiveAnalysis} — Free` : `${t.competitiveAnalysis} — $99`
                }
              </button>
            </div>

            {/* City & State inputs for Growth Advisor */}
            {reportType === 'growth' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder={t.cityPlaceholder}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder={t.statePlaceholder}
                  className="sm:w-36 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}
          </form>

          <p className="text-xs text-gray-400 mt-4">
            {isAdmin
              ? 'Admin account · Reports generated free · No payment required'
              : '$99 per report · Free retrieval of existing reports · Reports expire never'}
          </p>
        </div>

        {/* Saved Reports */}
        <div>
          <h2 className="font-syne font-semibold text-lg text-gray-900 mb-4">
            {t.savedReportsTitle} ({saved.length})
          </h2>

          {saved.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-gray-500">{t.noSavedReports}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {saved.map(entry => {
                const score = getEntryScore(entry);
                const isGrowth = entry.reportType === 'growth';
                return (
                  <div
                    key={entry.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-900 truncate">{getEntryName(entry)}</div>
                        {isGrowth && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            Growth
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 truncate">{entry.url}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(entry.at)} · {entry.radius} {t.mileRadius}
                        {isGrowth && entry.city && ` · ${entry.city}${entry.state ? `, ${entry.state}` : ''}`}
                      </div>
                    </div>

                    {score !== null ? (
                      <div className="text-right flex-shrink-0">
                        <div className={`font-syne font-bold text-2xl ${scoreColor(score)}`}>
                          {score}
                        </div>
                        <div className="text-xs text-gray-400">{t.score.toLowerCase()}</div>
                      </div>
                    ) : (
                      <div className="text-right flex-shrink-0">
                        <div className="font-syne font-bold text-sm text-emerald-600">Growth</div>
                        <div className="text-xs text-gray-400">Advisor</div>
                      </div>
                    )}

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => onViewReport(entry)}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        {t.viewReport}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t.deleteConfirm)) onDeleteReport(entry.id);
                        }}
                        className="text-gray-400 hover:text-red-500 px-2 py-2 rounded-lg transition-colors"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
