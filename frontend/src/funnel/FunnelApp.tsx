import React, { useState, useEffect, useRef } from 'react';
import { funnelApi } from './funnelApi';
import { initAnalytics, track, identify, extractDomain } from './analytics';

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 'landing' | 'loading' | 'preview' | 'gate' | 'full-report';

interface Competitor {
  name: string;
  url?: string;
  score?: number;
  tags?: string[];
  description?: string;
  products?: string[];
  marketingTactics?: string[];
}

interface Gap {
  title: string;
  severity?: string;
  priority?: string;
  description?: string;
  impact?: string;
  effort?: string;
}

interface Recommendation {
  title: string;
  description?: string;
  impact?: string;
  timeframe?: string;
  priority?: string;
}

interface ScoreBreakdown {
  seo?: number;
  digital?: number;
  content?: number;
  ux?: number;
  [key: string]: number | undefined;
}

interface ReportData {
  businessName?: string;
  businessType?: string;
  location?: string;
  executiveSummary?: string;
  overallScore?: number;
  marketPosition?: string;
  scoreBreakdown?: ScoreBreakdown;
  competitors?: Competitor[];
  gaps?: Gap[];
  strengths?: Array<{ title: string; description?: string }>;
  strategicRecommendations?: Recommendation[];
  roadmap?: Array<{ phase?: string; timeframe?: string; actions?: string[]; title?: string; description?: string }>;
  [key: string]: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  if (!/^https?:\/\/.+\..+/.test(withProtocol)) return null;
  const privatePatterns = [/localhost/i, /127\./, /10\./, /192\.168\./, /172\.(1[6-9]|2\d|3[01])\./];
  try {
    const h = new URL(withProtocol).hostname;
    if (privatePatterns.some(p => p.test(h))) return null;
  } catch { return null; }
  return withProtocol;
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-[#00CC88]';
  if (score >= 50) return 'text-[#4F9EF5]';
  if (score >= 30) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 75) return 'bg-[#00CC88]';
  if (score >= 50) return 'bg-[#4F9EF5]';
  if (score >= 30) return 'bg-yellow-400';
  return 'bg-red-400';
}

function severityColor(severity?: string): string {
  const s = (severity || '').toLowerCase();
  if (s === 'critical') return 'bg-red-500/20 text-red-400 border border-red-500/30';
  if (s === 'high') return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
  if (s === 'medium') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
  return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
}

function severityOrder(g: Gap): number {
  const s = (g.severity || g.priority || '').toLowerCase();
  if (s === 'critical') return 0;
  if (s === 'high') return 1;
  if (s === 'medium') return 2;
  return 3;
}

function downloadReport(reportData: ReportData, analyzedUrl: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Competitive Analysis — ${reportData.businessName || analyzedUrl}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e; line-height: 1.6; }
    h1 { color: #0f3460; border-bottom: 3px solid #4F9EF5; padding-bottom: 12px; }
    h2 { color: #0f3460; margin-top: 36px; }
    h3 { color: #16213e; }
    .score-badge { display: inline-block; background: #4F9EF5; color: white; border-radius: 999px; padding: 4px 16px; font-weight: 700; font-size: 1.1em; }
    .gap-critical { border-left: 4px solid #ef4444; background: #fef2f2; padding: 12px 16px; margin: 8px 0; border-radius: 4px; }
    .gap-high { border-left: 4px solid #f97316; background: #fff7ed; padding: 12px 16px; margin: 8px 0; border-radius: 4px; }
    .gap-medium { border-left: 4px solid #eab308; background: #fefce8; padding: 12px 16px; margin: 8px 0; border-radius: 4px; }
    .gap-low { border-left: 4px solid #3b82f6; background: #eff6ff; padding: 12px 16px; margin: 8px 0; border-radius: 4px; }
    .competitor-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 12px 0; }
    .rec-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0f3460; color: white; padding: 10px; text-align: left; }
    td { border: 1px solid #e2e8f0; padding: 10px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Competitive Analysis Report</h1>
  <p><strong>Business:</strong> ${reportData.businessName || 'Unknown'}</p>
  <p><strong>URL:</strong> ${analyzedUrl}</p>
  <p><strong>Location:</strong> ${reportData.location || 'N/A'}</p>
  <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
  <p><strong>Overall Score:</strong> <span class="score-badge">${reportData.overallScore ?? 'N/A'}/100</span> &nbsp; Market Position: ${reportData.marketPosition || 'N/A'}</p>

  <h2>Executive Summary</h2>
  <p>${reportData.executiveSummary || 'No summary available.'}</p>

  ${reportData.gaps && reportData.gaps.length > 0 ? `
  <h2>Gap Analysis</h2>
  ${[...reportData.gaps].sort((a, b) => severityOrder(a) - severityOrder(b)).map(g => `
    <div class="gap-${(g.severity || g.priority || 'low').toLowerCase()}">
      <strong>${g.title}</strong>
      ${g.severity || g.priority ? `<span style="font-size:0.85em; margin-left:8px;">[${g.severity || g.priority}]</span>` : ''}
      ${g.description ? `<p style="margin:4px 0 0;">${g.description}</p>` : ''}
      ${g.impact ? `<p style="margin:4px 0 0;font-size:0.9em;color:#666;">Impact: ${g.impact}</p>` : ''}
    </div>`).join('')}
  ` : ''}

  ${reportData.competitors && reportData.competitors.length > 0 ? `
  <h2>Competitors</h2>
  ${reportData.competitors.map(c => `
    <div class="competitor-card">
      <h3>${c.name} ${c.score ? `<span class="score-badge" style="font-size:0.8em;">${c.score}/100</span>` : ''}</h3>
      ${c.url ? `<p style="color:#4F9EF5;">${c.url}</p>` : ''}
      ${c.description ? `<p>${c.description}</p>` : ''}
      ${c.tags && c.tags.length > 0 ? `<p><strong>Tags:</strong> ${c.tags.join(', ')}</p>` : ''}
      ${c.products && c.products.length > 0 ? `<p><strong>Products/Services:</strong> ${c.products.join(', ')}</p>` : ''}
      ${c.marketingTactics && c.marketingTactics.length > 0 ? `<p><strong>Marketing:</strong> ${c.marketingTactics.join(', ')}</p>` : ''}
    </div>`).join('')}
  ` : ''}

  ${reportData.strategicRecommendations && reportData.strategicRecommendations.length > 0 ? `
  <h2>Strategic Recommendations</h2>
  ${reportData.strategicRecommendations.map((r, i) => `
    <div class="rec-card">
      <h3>${i + 1}. ${r.title}</h3>
      ${r.description ? `<p>${r.description}</p>` : ''}
      ${r.impact ? `<p><strong>Impact:</strong> ${r.impact}</p>` : ''}
      ${r.timeframe ? `<p><strong>Timeframe:</strong> ${r.timeframe}</p>` : ''}
    </div>`).join('')}
  ` : ''}

  ${reportData.roadmap && reportData.roadmap.length > 0 ? `
  <h2>90-Day Action Roadmap</h2>
  ${reportData.roadmap.map(phase => `
    <div style="margin:16px 0;padding:16px;border:1px solid #e2e8f0;border-radius:8px;">
      <h3>${phase.phase || phase.title || 'Phase'} ${phase.timeframe ? `— ${phase.timeframe}` : ''}</h3>
      ${phase.description ? `<p>${phase.description}</p>` : ''}
      ${phase.actions && phase.actions.length > 0 ? `<ul>${phase.actions.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
    </div>`).join('')}
  ` : ''}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `competitive-analysis-${extractDomain(analyzedUrl)}-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function UrlInput({
  value,
  onChange,
  onSubmit,
  error,
  placeholder = 'https://yourbusiness.com',
  buttonText = 'Analyze My Business Free →',
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  error: string;
  placeholder?: string;
  buttonText?: string;
}) {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-base font-medium outline-none focus:ring-2 focus:ring-[#4F9EF5] border border-gray-200"
        />
        <button
          onClick={onSubmit}
          className="px-6 py-3 bg-[#4F9EF5] hover:bg-[#3b8de0] text-white font-semibold rounded-lg transition-colors whitespace-nowrap text-base"
        >
          {buttonText}
        </button>
      </div>
      {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
    </div>
  );
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#00CC88' : score >= 50 ? '#4F9EF5' : score >= 30 ? '#FBBF24' : '#F87171';

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={color}
        fontSize={size * 0.22} fontWeight="700" className="rotate-90"
        style={{ transform: `rotate(90deg)`, transformOrigin: 'center', transformBox: 'fill-box' }}>
        {score}
      </text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FunnelApp() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [urlValue, setUrlValue] = useState('');
  const [urlError, setUrlError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [previewData, setPreviewData] = useState<ReportData | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const [gateEmail, setGateEmail] = useState('');
  const [gateFirstName, setGateFirstName] = useState('');
  const [gateBizName, setGateBizName] = useState('');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState('');
  const [fullReportData, setFullReportData] = useState<ReportData | null>(null);

  const bottomCtaRef = useRef<HTMLDivElement>(null);
  const [bottomUrl, setBottomUrl] = useState('');
  const [bottomError, setBottomError] = useState('');

  const loadingSteps = [
    'Scanning website...',
    'Finding competitors...',
    'Running AI analysis...',
    'Building your report...',
  ];

  // Init analytics on mount
  useEffect(() => {
    initAnalytics();
    track('page_viewed', { page: 'funnel_landing' });
  }, []);

  // Loading step interval
  useEffect(() => {
    if (phase !== 'loading') return;
    setLoadingStep(0);
    setLoadingProgress(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, 3));
    }, 4000);

    // Progress bar: 0→95% over ~20 seconds
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(95, (elapsed / 20000) * 95);
      setLoadingProgress(pct);
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [phase]);

  function handleAnalyze(rawUrl: string, setError: (e: string) => void) {
    const url = normalizeUrl(rawUrl);
    if (!url) {
      setError('Please enter a valid website URL (e.g. yourbusiness.com)');
      return;
    }
    setError('');
    setAnalyzedUrl(url);
    setPhase('loading');

    const urlDomain = extractDomain(url);
    track('url_entered', { url_domain: urlDomain });
    track('analysis_started', { url_domain: urlDomain });

    funnelApi.analyze(url, 25)
      .then(result => {
        const data = result.data as ReportData;
        setPreviewData(data);
        setLoadingProgress(100);

        const overallScore = data.overallScore ?? 0;
        const competitorsFound = data.competitors?.length ?? 0;
        track('analysis_completed', { url_domain: urlDomain, overall_score: overallScore, competitors_found: competitorsFound });
        track('preview_rendered', { url_domain: urlDomain, overall_score: overallScore });

        // Pre-fill gate fields
        if (data.businessName) setGateBizName(data.businessName);

        setTimeout(() => setPhase('preview'), 400);
      })
      .catch(err => {
        console.error('Analysis failed:', err);
        setError('Analysis failed. Please check the URL and try again.');
        setPhase('landing');
      });
  }

  async function handleGateSubmit() {
    if (!gateEmail) { setGateError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gateEmail)) { setGateError('Please enter a valid email address'); return; }
    setGateError('');
    setGateLoading(true);

    const urlDomain = extractDomain(analyzedUrl);
    track('gate_submitted', { url_domain: urlDomain, email_domain: gateEmail.split('@')[1] });

    // Identify user with hashed email
    const emailHash = btoa(gateEmail.toLowerCase());
    identify(emailHash, { business_name: gateBizName, first_name: gateFirstName });

    try {
      const params = new URLSearchParams(window.location.search);
      const result = await funnelApi.captureEmail({
        email: gateEmail,
        firstName: gateFirstName || undefined,
        businessName: gateBizName || undefined,
        analyzedUrl,
        reportData: previewData ?? undefined,
        utmSource: params.get('utm_source') || undefined,
        utmMedium: params.get('utm_medium') || undefined,
        utmCampaign: params.get('utm_campaign') || undefined,
        referrer: document.referrer || undefined,
      });

      setFullReportData((result.reportData as ReportData) || previewData);
      track('full_report_viewed', { url_domain: urlDomain });
      setPhase('full-report');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setGateError(message);
    } finally {
      setGateLoading(false);
    }
  }

  // ── LOADING PHASE ──────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#07090F] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#4F9EF5] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-white font-semibold text-lg">SiteAnalyzer Pro</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Analyzing {extractDomain(analyzedUrl)}</h2>
            <p className="text-white/60 text-sm">This takes about 30–60 seconds. We're searching the web in real time.</p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-2 mb-8 overflow-hidden">
            <div
              className="h-2 rounded-full bg-[#4F9EF5] transition-all duration-500"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {loadingSteps.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${i === loadingStep ? 'bg-white/8 border border-white/10' : i < loadingStep ? 'opacity-50' : 'opacity-20'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${i < loadingStep ? 'bg-[#00CC88]' : i === loadingStep ? 'bg-[#4F9EF5]' : 'bg-white/10'}`}>
                  {i < loadingStep ? (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i === loadingStep ? (
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                  )}
                </div>
                <span className={`text-sm font-medium ${i <= loadingStep ? 'text-white' : 'text-white/40'}`}>{step}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-white/40 text-xs">Powered by AI · Real competitor data · No credit card needed</p>
        </div>
      </div>
    );
  }

  // ── PREVIEW PHASE ──────────────────────────────────────────────────────────
  if (phase === 'preview' && previewData) {
    const overallScore = previewData.overallScore ?? 0;
    const competitorsFound = previewData.competitors?.length ?? 0;
    const topGap = previewData.gaps?.[0] || (previewData.strategicRecommendations?.[0] ? { title: previewData.strategicRecommendations[0].title, severity: 'high' } : null);
    const bizName = previewData.businessName || extractDomain(analyzedUrl);

    return (
      <div className="min-h-screen bg-[#07090F] px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#4F9EF5] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-white font-semibold">SiteAnalyzer Pro</span>
            </div>
            <button
              onClick={() => downloadReport(previewData, analyzedUrl)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white text-xs font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Preview
            </button>
          </div>

          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-[#00CC88]/20 text-[#00CC88] text-xs font-semibold rounded-full border border-[#00CC88]/30 mb-3">
              ANALYSIS COMPLETE
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Here's your preview for <span className="text-[#4F9EF5]">{bizName}</span>
            </h1>
            <p className="text-white/60">Unlock the full report to see all gaps, competitors, and your 90-day action plan.</p>
          </div>

          {/* Score card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <ScoreRing score={overallScore} size={90} />
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Overall Score</p>
                  <p className={`text-3xl font-bold ${scoreColor(overallScore)}`}>{overallScore}<span className="text-white/40 text-lg">/100</span></p>
                  <p className="text-white/60 text-sm mt-1">{previewData.marketPosition || 'Challenger'}</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{competitorsFound}</p>
                  <p className="text-white/60 text-xs">Competitors<br/>Found</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{previewData.gaps?.filter(g => (g.severity || g.priority || '').toLowerCase() === 'critical').length ?? '—'}</p>
                  <p className="text-white/60 text-xs">Critical<br/>Gaps</p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary preview */}
          {previewData.executiveSummary && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
              <h3 className="text-white font-semibold mb-2">Executive Summary</h3>
              <p className="text-white/70 text-sm leading-relaxed">{previewData.executiveSummary}</p>
            </div>
          )}

          {/* Top Gap teaser */}
          {topGap && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
              <h3 className="text-white font-semibold mb-3">Top Gap Identified</h3>
              <div className="flex items-start gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 mt-0.5 ${severityColor((topGap as Gap).severity)}`}>
                  {(topGap as Gap).severity?.toUpperCase() || 'HIGH'}
                </span>
                <div>
                  <p className="text-white font-medium">{(topGap as Gap).title}</p>
                  {(topGap as Gap).description && <p className="text-white/60 text-sm mt-1">{(topGap as Gap).description}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Locked section */}
          <div className="relative">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4 filter blur-sm pointer-events-none select-none">
              <h3 className="text-white font-semibold mb-3">All Competitors</h3>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-white/5 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-[#07090F]/90 border border-white/20 rounded-xl px-6 py-4 text-center">
                <svg className="w-6 h-6 text-white/60 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-white text-sm font-semibold">Full competitor data locked</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#4F9EF5]/20 to-[#00CC88]/10 border border-[#4F9EF5]/30 rounded-2xl p-6 mt-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Unlock Your Full Report</h2>
            <p className="text-white/60 text-sm mb-4">Get all {previewData.gaps?.length ?? '10+'} gaps, all competitor profiles, and your personalized 90-day roadmap — free.</p>
            <button
              onClick={() => {
                track('gate_shown', { url_domain: extractDomain(analyzedUrl), trigger: 'unlock_click' });
                setPhase('gate');
              }}
              className="px-8 py-3 bg-[#4F9EF5] hover:bg-[#3b8de0] text-white font-semibold rounded-lg transition-colors text-base"
            >
              Unlock My Full Report — Free →
            </button>
            <p className="text-white/40 text-xs mt-3">No credit card. Unsubscribe anytime.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── GATE PHASE ─────────────────────────────────────────────────────────────
  if (phase === 'gate') {
    const bizName = previewData?.businessName || extractDomain(analyzedUrl);
    return (
      <div className="min-h-screen bg-[#07090F] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-[#4F9EF5] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-white font-semibold">SiteAnalyzer Pro</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#00CC88]/20 rounded-full mb-4">
                <svg className="w-6 h-6 text-[#00CC88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Your full competitive analysis is ready</h1>
              <p className="text-white/60 text-sm">
                We've completed the analysis for <span className="text-[#4F9EF5] font-medium">{bizName}</span>. Enter your email to access it instantly.
              </p>
            </div>

            {/* What's included */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-3">What's included in your report</p>
              <ul className="space-y-2">
                {[
                  `${previewData?.competitors?.length ?? '4–5'} real competitor profiles with detailed breakdowns`,
                  `${previewData?.gaps?.length ?? '10+'} identified gaps — sorted by priority`,
                  'Score breakdown: SEO, Digital, Content & UX',
                  'Strategic recommendations with effort + impact ratings',
                  '90-day action roadmap with specific steps',
                  'Downloadable HTML report for your records',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <svg className="w-4 h-4 text-[#00CC88] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Email address <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={gateEmail}
                  onChange={e => setGateEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGateSubmit()}
                  placeholder="you@yourbusiness.com"
                  className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-[#4F9EF5] border border-gray-200"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-white/70 text-sm mb-1.5">First name <span className="text-white/40 text-xs">(optional)</span></label>
                  <input
                    type="text"
                    value={gateFirstName}
                    onChange={e => setGateFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-[#4F9EF5] border border-gray-200"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-white/70 text-sm mb-1.5">Business name <span className="text-white/40 text-xs">(optional)</span></label>
                  <input
                    type="text"
                    value={gateBizName}
                    onChange={e => setGateBizName(e.target.value)}
                    placeholder="My Business"
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-[#4F9EF5] border border-gray-200"
                  />
                </div>
              </div>

              {gateError && <p className="text-red-400 text-sm">{gateError}</p>}

              <button
                onClick={handleGateSubmit}
                disabled={gateLoading}
                className="w-full py-3.5 bg-[#4F9EF5] hover:bg-[#3b8de0] disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-base mt-1"
              >
                {gateLoading ? 'Unlocking...' : 'Unlock my full report →'}
              </button>
            </div>

            <p className="text-center text-white/40 text-xs mt-4">
              No spam. No credit card. Unsubscribe anytime. We take privacy seriously.
            </p>
          </div>

          <button
            onClick={() => setPhase('preview')}
            className="w-full text-center text-white/40 text-sm mt-4 hover:text-white/60 transition-colors"
          >
            ← Back to preview
          </button>
        </div>
      </div>
    );
  }

  // ── FULL REPORT PHASE ─────────────────────────────────────────────────────
  if (phase === 'full-report' && fullReportData) {
    const report = fullReportData;
    const overallScore = report.overallScore ?? 0;
    const sb = report.scoreBreakdown || {};
    const scoreFields = [
      { label: 'SEO', value: sb.seo },
      { label: 'Digital', value: sb.digital },
      { label: 'Content', value: sb.content },
      { label: 'UX', value: sb.ux },
    ].filter(f => f.value !== undefined) as Array<{ label: string; value: number }>;
    const sortedGaps = [...(report.gaps || [])].sort((a, b) => severityOrder(a) - severityOrder(b));

    return (
      <div className="min-h-screen bg-[#07090F] px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header bar */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#4F9EF5] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-white font-semibold">SiteAnalyzer Pro</span>
            </div>
            <button
              onClick={() => downloadReport(report, analyzedUrl)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-colors border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Report
            </button>
          </div>

          {/* Title */}
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-[#00CC88]/20 text-[#00CC88] text-xs font-semibold rounded-full border border-[#00CC88]/30 mb-3">
              FULL REPORT UNLOCKED
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {report.businessName || extractDomain(analyzedUrl)}
            </h1>
            {report.location && <p className="text-white/60 mt-1">{report.location} · {report.businessType}</p>}
          </div>

          {/* Executive Summary */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-bold text-lg mb-3">Executive Summary</h2>
            <div className="flex items-start gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <ScoreRing score={overallScore} size={80} />
                <div>
                  <p className="text-white/60 text-sm">Overall Score</p>
                  <p className={`text-2xl font-bold ${scoreColor(overallScore)}`}>{overallScore}/100</p>
                  <p className="text-white/50 text-sm">{report.marketPosition || 'N/A'}</p>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-sm leading-relaxed">{report.executiveSummary}</p>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          {scoreFields.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-white font-bold text-lg mb-4">Score Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {scoreFields.map(f => (
                  <div key={f.label} className="text-center">
                    <p className="text-white/60 text-xs mb-2">{f.label}</p>
                    <div className="relative mx-auto w-16 h-16">
                      <ScoreRing score={f.value} size={64} />
                    </div>
                    <p className={`text-sm font-semibold mt-1 ${scoreColor(f.value)}`}>{f.value}/100</p>
                  </div>
                ))}
              </div>
              {scoreFields.length === 0 && (
                <p className="text-white/50 text-sm">Score breakdown not available for this analysis.</p>
              )}
            </div>
          )}

          {/* Competitors */}
          {report.competitors && report.competitors.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-white font-bold text-lg mb-4">
                Competitors Found <span className="text-white/40 font-normal text-base ml-1">({report.competitors.length})</span>
              </h2>
              <div className="space-y-4">
                {report.competitors.map((c, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{c.name}</h3>
                        {c.url && (
                          <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[#4F9EF5] text-xs hover:underline">{c.url}</a>
                        )}
                      </div>
                      {c.score !== undefined && (
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${scoreBg(c.score)} text-white flex-shrink-0`}>
                          {c.score}/100
                        </span>
                      )}
                    </div>
                    {c.description && <p className="text-white/70 text-sm mb-3">{c.description}</p>}
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {c.tags.map((tag, j) => (
                          <span key={j} className="px-2 py-0.5 bg-[#4F9EF5]/20 text-[#4F9EF5] text-xs rounded border border-[#4F9EF5]/30">{tag}</span>
                        ))}
                      </div>
                    )}
                    {c.products && c.products.length > 0 && (
                      <div className="mt-2">
                        <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Products/Services</p>
                        <ul className="space-y-0.5">
                          {c.products.slice(0, 4).map((p, j) => (
                            <li key={j} className="text-white/60 text-xs flex items-start gap-1.5">
                              <span className="text-[#00CC88] mt-0.5">•</span>{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.marketingTactics && c.marketingTactics.length > 0 && (
                      <div className="mt-2">
                        <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Marketing Tactics</p>
                        <ul className="space-y-0.5">
                          {c.marketingTactics.slice(0, 4).map((t, j) => (
                            <li key={j} className="text-white/60 text-xs flex items-start gap-1.5">
                              <span className="text-[#4F9EF5] mt-0.5">•</span>{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gaps */}
          {sortedGaps.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-white font-bold text-lg mb-4">
                Gap Analysis <span className="text-white/40 font-normal text-base ml-1">({sortedGaps.length} gaps identified)</span>
              </h2>
              <div className="space-y-3">
                {sortedGaps.map((gap, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 mt-0.5 ${severityColor(gap.severity || gap.priority)}`}>
                        {(gap.severity || gap.priority || 'Low').toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{gap.title}</p>
                        {gap.description && <p className="text-white/60 text-sm mt-1">{gap.description}</p>}
                        {(gap.impact || gap.effort) && (
                          <div className="flex gap-4 mt-2">
                            {gap.impact && <span className="text-white/50 text-xs">Impact: <span className="text-white/70">{gap.impact}</span></span>}
                            {gap.effort && <span className="text-white/50 text-xs">Effort: <span className="text-white/70">{gap.effort}</span></span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Recommendations */}
          {report.strategicRecommendations && report.strategicRecommendations.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-white font-bold text-lg mb-4">Strategic Recommendations</h2>
              <div className="space-y-3">
                {report.strategicRecommendations.map((rec, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#4F9EF5]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#4F9EF5] text-xs font-bold">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{rec.title}</p>
                        {rec.description && <p className="text-white/60 text-sm mt-1">{rec.description}</p>}
                        <div className="flex flex-wrap gap-4 mt-2">
                          {rec.impact && <span className="text-white/50 text-xs">Impact: <span className="text-[#00CC88]">{rec.impact}</span></span>}
                          {rec.timeframe && <span className="text-white/50 text-xs">Timeframe: <span className="text-white/70">{rec.timeframe}</span></span>}
                          {rec.priority && <span className="text-white/50 text-xs">Priority: <span className="text-[#4F9EF5]">{rec.priority}</span></span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 90-Day Roadmap */}
          {report.roadmap && report.roadmap.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-white font-bold text-lg mb-4">90-Day Action Roadmap</h2>
              <div className="space-y-4">
                {report.roadmap.map((phase, i) => (
                  <div key={i} className="relative pl-8">
                    <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-[#4F9EF5]/20 border border-[#4F9EF5]/40 flex items-center justify-center">
                      <span className="text-[#4F9EF5] text-xs font-bold">{i + 1}</span>
                    </div>
                    {i < (report.roadmap?.length ?? 0) - 1 && (
                      <div className="absolute left-3 top-6 w-px h-full bg-[#4F9EF5]/20" />
                    )}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-white font-semibold text-sm">{phase.phase || phase.title || `Phase ${i + 1}`}</h3>
                        {phase.timeframe && (
                          <span className="text-white/50 text-xs px-2 py-0.5 bg-white/5 rounded border border-white/10">{phase.timeframe}</span>
                        )}
                      </div>
                      {phase.description && <p className="text-white/60 text-sm mb-2">{phase.description}</p>}
                      {phase.actions && phase.actions.length > 0 && (
                        <ul className="space-y-1">
                          {phase.actions.map((action, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-white/70">
                              <svg className="w-3.5 h-3.5 text-[#00CC88] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              {action}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="bg-gradient-to-br from-[#4F9EF5]/20 to-[#00CC88]/10 border border-[#4F9EF5]/30 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Know another business that needs this?</h2>
            <p className="text-white/60 text-sm mb-5">Run a free analysis for any website — restaurants, retailers, service businesses, and more.</p>
            <button
              onClick={() => setPhase('landing')}
              className="inline-block px-8 py-3 bg-[#4F9EF5] hover:bg-[#3b8de0] text-white font-semibold rounded-lg transition-colors text-base"
            >
              Analyze Another Business →
            </button>
            <p className="text-white/30 text-xs mt-3">Free · No credit card · Takes 60 seconds</p>
          </div>

          <div className="h-12" />
        </div>
      </div>
    );
  }

  // ── LANDING PHASE (default) ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07090F] font-['DM_Sans',sans-serif]">

      {/* Nav */}
      <nav className="border-b border-white/5 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#4F9EF5] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-white font-semibold">SiteAnalyzer Pro</span>
          </div>
          <a href="/index.html" className="text-white/60 hover:text-white text-sm transition-colors">Sign in</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-4 pt-16 pb-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#4F9EF5]/15 border border-[#4F9EF5]/30 rounded-full text-[#4F9EF5] text-sm font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00CC88] animate-pulse" />
            Free AI-powered analysis in 60 seconds
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
            See exactly how your business<br />
            <span className="text-[#4F9EF5]">stacks up against competitors</span>
          </h1>

          <p className="text-white/60 text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
            Enter your website URL and get a full competitive analysis — including gaps, competitor profiles, and a 90-day action plan. Free, instant, no credit card.
          </p>

          <div className="max-w-2xl mx-auto mb-6">
            <UrlInput
              value={urlValue}
              onChange={setUrlValue}
              onSubmit={() => handleAnalyze(urlValue, setUrlError)}
              error={urlError}
            />
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#00CC88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#00CC88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Real competitor data
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#00CC88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Results in ~60 seconds
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#00CC88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              2,000+ businesses analyzed
            </span>
          </div>

          {/* Preview mockup */}
          <div className="mt-14 max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-white/3">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <div className="flex-1 mx-4 h-5 bg-white/5 rounded" />
              </div>
              <div className="p-6">
                <div className="flex gap-4 mb-4 flex-wrap">
                  <div className="bg-white/5 rounded-xl p-4 flex-1 min-w-[120px]">
                    <p className="text-white/50 text-xs mb-1">Overall Score</p>
                    <p className="text-2xl font-bold text-[#4F9EF5]">73<span className="text-sm text-white/40">/100</span></p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 flex-1 min-w-[120px]">
                    <p className="text-white/50 text-xs mb-1">Competitors</p>
                    <p className="text-2xl font-bold text-white">5 <span className="text-xs text-white/40">found</span></p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 flex-1 min-w-[120px]">
                    <p className="text-white/50 text-xs mb-1">Critical Gaps</p>
                    <p className="text-2xl font-bold text-red-400">3</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Missing online ordering (competitors have it)', 'No email marketing vs competitors', 'Social media presence gap'].map((gap, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-red-400' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'}`} />
                      <span className="text-white/70 text-sm">{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How it works</h2>
            <p className="text-white/60 text-lg">Get a full competitive analysis in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Enter your URL',
                description: 'Paste your business website URL. We support any public website — no login needed.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                ),
              },
              {
                step: '2',
                title: 'AI finds your competitors',
                description: 'Our AI scans your industry, location, and offerings to identify your top 4–5 real competitors.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                ),
              },
              {
                step: '3',
                title: 'Get your action plan',
                description: 'See every gap, every competitor weakness, and your personalized 90-day roadmap to catch up and overtake.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                ),
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#4F9EF5]/10 border border-[#4F9EF5]/20 mb-4">
                  <svg className="w-7 h-7 text-[#4F9EF5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {item.icon}
                  </svg>
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#4F9EF5] text-white text-xs font-bold mb-3">{item.step}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="px-4 py-20 border-t border-white/5 bg-white/2">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Real results from real businesses</h2>
            <p className="text-white/60">Join 2,000+ local businesses who've used SiteAnalyzer Pro</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                quote: "Went from 2.8★ to 4.4★ in 90 days after following the roadmap. The gap analysis showed me exactly what my competitors were doing that I wasn't.",
                name: 'Marco T.',
                business: 'Mama Mia Pizza',
                location: 'Sacramento, CA',
                result: '2.8★ → 4.4★ in 90 days',
              },
              {
                quote: "Found 3 competitors I didn't even know existed. One of them was ranking above me for my own neighborhood. Fixed it in two weeks.",
                name: 'Sarah K.',
                business: 'Green Thumb Nursery',
                location: 'Austin, TX',
                result: '3 unknown competitors discovered',
              },
              {
                quote: "Identified $3k/mo in missed revenue from delivery apps my competitors were on. Was up and running on DoorDash within a week.",
                name: 'James R.',
                business: 'Riverside Auto',
                location: 'Denver, CO',
                result: '$3k/mo in recovered revenue',
              },
            ].map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[0,1,2,3,4].map(s => <span key={s} className="text-yellow-400 text-sm">★</span>)}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-5">"{t.quote}"</p>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/60 text-xs">{t.business} · {t.location}</p>
                  <p className="text-[#00CC88] text-xs font-medium mt-1">{t.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Everything you need to outcompete</h2>
            <p className="text-white/60 text-lg">No fluff — just the insights that actually move the needle</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Gap Analysis',
                description: 'See every gap between you and competitors, sorted by critical → high → medium priority. Know exactly where to focus first.',
                color: 'text-red-400',
                bgColor: 'bg-red-500/10 border-red-500/20',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                ),
              },
              {
                title: 'Competitor Discovery',
                description: 'Automatically find 4–5 real competitors in your area. See their scores, tactics, products, and what\'s working for them.',
                color: 'text-[#4F9EF5]',
                bgColor: 'bg-[#4F9EF5]/10 border-[#4F9EF5]/20',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                ),
              },
              {
                title: 'Action Roadmap',
                description: 'Get a personalized 90-day roadmap with specific, prioritized actions. Not generic tips — steps tailored to your exact gaps.',
                color: 'text-[#00CC88]',
                bgColor: 'bg-[#00CC88]/10 border-[#00CC88]/20',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                ),
              },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${f.bgColor} border mb-4`}>
                  <svg className={`w-6 h-6 ${f.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {f.icon}
                  </svg>
                </div>
                <h3 className={`font-bold text-lg mb-2 ${f.color}`}>{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET FREE */}
      <section className="px-4 py-20 border-t border-white/5 bg-white/2">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#00CC88]/10 border border-[#00CC88]/30 text-[#00CC88] text-sm font-medium mb-6">
            100% Free — No credit card ever
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Everything in your free report</h2>
          <p className="text-white/60 mb-10">Enter your URL, give us your email, and we send you the full analysis — no strings attached.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {[
              { icon: '📊', title: 'Overall competitive score', desc: 'See how you rank 0–100 vs local competitors' },
              { icon: '🔍', title: 'Competitor deep-dive', desc: '4–5 real local competitors analysed in detail' },
              { icon: '⚠️', title: 'Full gap analysis', desc: 'Every gap sorted Critical → High → Medium' },
              { icon: '💡', title: 'Strategic recommendations', desc: '8–12 specific actions with cost and timeline' },
              { icon: '🗓️', title: '90-day action roadmap', desc: 'Month-by-month plan you can start today' },
              { icon: '📥', title: 'Downloadable HTML report', desc: 'Save or share your report anytime' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-white/50 text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-sm mt-8">Just your email — that's all we need. No payment, no account, no commitment.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'How accurate is the competitor data?',
                a: 'Our AI crawls actual competitor websites in real time and searches public data sources. Results reflect the current state of competitor websites and are far more accurate than stale database lookups.',
              },
              {
                q: 'How long does the analysis take?',
                a: 'Most analyses complete in 30–90 seconds. Complex businesses with many competitors may take up to 2 minutes. We show you real-time progress so you always know where we are.',
              },
              {
                q: 'Do I need to create an account?',
                a: 'No account needed to run a free analysis. We just ask for your email to deliver the full report — no password, no credit card, no commitment.',
              },
              {
                q: 'What types of businesses does this work for?',
                a: 'SiteAnalyzer Pro works best for local businesses with a web presence — restaurants, retail shops, service businesses, healthcare practices, and more. Any business competing locally can benefit.',
              },
              {
                q: 'Is my data private?',
                a: 'Yes. We never share your email or business data with third parties. We only use it to send your report and relevant updates. You can unsubscribe anytime.',
              },
            ].map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section ref={bottomCtaRef} className="px-4 py-20 border-t border-white/5 bg-gradient-to-b from-white/2 to-[#07090F]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to see where you stand?
          </h2>
          <p className="text-white/60 text-lg mb-8">
            Enter your website and get your free competitive analysis in 60 seconds.
          </p>
          <div className="max-w-2xl mx-auto">
            <UrlInput
              value={bottomUrl}
              onChange={setBottomUrl}
              onSubmit={() => handleAnalyze(bottomUrl, setBottomError)}
              error={bottomError}
              buttonText="Get My Free Analysis →"
            />
          </div>
          <p className="text-white/40 text-sm mt-4">Free · No credit card · Real competitor data · Takes 60 seconds</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#4F9EF5] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-white/60 text-sm">SiteAnalyzer Pro · © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-white/40 text-sm">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
            <a href="mailto:support@siteanalyzerpro.com" className="hover:text-white/60 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-white font-medium text-sm pr-4">{question}</span>
        <svg
          className={`w-4 h-4 text-white/60 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-white/5">
          <p className="text-white/60 text-sm leading-relaxed pt-3">{answer}</p>
        </div>
      )}
    </div>
  );
}
