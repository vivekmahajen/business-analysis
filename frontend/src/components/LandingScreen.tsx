import React, { useState } from 'react';
import { useI18n } from '../i18n';
import LanguagePicker from './LanguagePicker';

interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

const SAMPLE_COMPETITIVE = {
  businessName: "Mario's Pizzeria",
  businessType: 'Italian Restaurant / Pizza',
  location: 'Austin, TX',
  overallScore: 62,
  marketPosition: 'Challenger',
  executiveSummary: "Mario's Pizzeria has a solid local reputation but lags behind three key competitors in digital presence and online ordering capabilities. The business scores well on content quality but misses significant revenue opportunities by lacking delivery app integrations, a loyalty program, and mobile ordering. Immediate action on these gaps could increase monthly revenue by an estimated $4,000–$8,000.",
  seoScore: 54,
  digitalScore: 61,
  contentScore: 72,
  uxScore: 58,
  competitors: [
    { label: 'Competitor 1', score: 88, tags: ['Online Ordering', 'Loyalty App', 'DoorDash'], strength: 'Dominant SEO and mobile-first experience with 4.8★ Google rating' },
    { label: 'Competitor 2', score: 79, tags: ['Uber Eats', 'Email Marketing', 'Catering'], strength: 'Strong catering program and weekly email newsletter driving repeat orders' },
    { label: 'Competitor 3', score: 71, tags: ['Slice by the Slice', 'Instagram', 'Late Hours'], strength: 'Pizza-by-the-slice and late-night hours capture foot traffic competitors miss' },
  ],
  opportunities: [
    { title: 'Add Pizza by the Slice', competitor: 'Competitor 3', fit: 'Strong Fit', revenue: '+$2,000–3,500/mo' },
    { title: 'Launch DoorDash & Uber Eats', competitor: 'Competitor 1', fit: 'Strong Fit', revenue: '+$3,000–5,000/mo' },
    { title: 'Vegan & Gluten-Free Menu Options', competitor: 'Competitor 2', fit: 'Good Fit', revenue: '+$1,500–2,500/mo' },
  ],
  weaknessCount: 6,
  gapCount: 5,
  solutionCount: 7,
};

const SAMPLE_GROWTH = {
  businessName: "Serenity Day Spa",
  businessType: 'Wellness / Day Spa',
  location: 'Denver, CO',
  revenueRange: '$6,000 – $12,000/mo',
  topQuickWin: 'Launch a "First Visit" intro package at $79 — competitors offering this see 40% higher new-client conversion',
  opportunities: [
    { title: 'Intro Package Pricing', revenue: '+$2,500–4,000/mo', effort: 'Low' },
    { title: 'Membership / Monthly Subscription', revenue: '+$3,000–5,000/mo', effort: 'Medium' },
    { title: 'Corporate Wellness Partnerships', revenue: '+$2,000–4,500/mo', effort: 'Medium' },
    { title: 'Gift Card Program + Holiday Bundles', revenue: '+$1,500–3,000/mo', effort: 'Low' },
  ],
  competitorCount: 5,
  trendCount: 4,
};

function SampleScoreCard({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  const barColor = score >= 80 ? 'bg-green-400' : score >= 60 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="bg-white/10 rounded-xl p-4 text-center">
      <div className="text-xs text-blue-300 mb-1">{label}</div>
      <div className={`font-syne font-black text-3xl ${color}`}>{score}</div>
      <ScoreBar value={score} color={barColor} />
    </div>
  );
}

function Locked({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-blue-300/60 bg-white/5 border border-white/10 border-dashed rounded-lg px-3 py-2.5">
      <span>🔒</span>
      <span>{label}</span>
    </div>
  );
}

function CompetitivePreviewPanel() {
  const d = SAMPLE_COMPETITIVE;
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-blue-900/80 to-blue-700/80 border border-blue-500/30 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-blue-300 text-xs uppercase tracking-widest mb-1">Competitive Analysis</div>
            <div className="font-syne font-bold text-xl text-white">{d.businessName}</div>
            <div className="text-blue-200 text-sm">{d.businessType} · {d.location}</div>
            <p className="text-blue-200/80 text-xs mt-2 leading-relaxed max-w-sm">
              {d.executiveSummary.slice(0, 160)}…
            </p>
          </div>
          <div className="text-center flex-shrink-0">
            <div className="font-syne font-black text-5xl text-yellow-400">{d.overallScore}</div>
            <div className="text-blue-300 text-xs mt-0.5">Score</div>
            <div className="text-xs bg-white/10 rounded-full px-2 py-0.5 mt-1 text-blue-200">{d.marketPosition}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <SampleScoreCard label="SEO" score={d.seoScore} />
        <SampleScoreCard label="Digital" score={d.digitalScore} />
        <SampleScoreCard label="Content" score={d.contentScore} />
        <SampleScoreCard label="UX" score={d.uxScore} />
      </div>

      <div>
        <div className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-2">Competitors Found</div>
        <div className="space-y-2">
          {d.competitors.map((c, i) => (
            <div key={i} className="bg-white/8 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${c.score >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                {c.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold">{c.label}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.tags.map((t, j) => (
                    <span key={j} className="text-xs bg-white/10 text-blue-200 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-2">Competitor-Inspired Opportunities</div>
        <div className="space-y-2">
          {d.opportunities.map((o, i) => (
            <div key={i} className="bg-white/8 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-white text-sm font-medium">{o.title}</div>
                <div className="text-xs text-blue-300 mt-0.5">From {o.competitor} · <span className="text-green-400">{o.fit}</span></div>
              </div>
              <div className="text-green-400 font-semibold text-sm flex-shrink-0">{o.revenue}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Locked label={`${d.weaknessCount} weaknesses identified with impact ratings`} />
        <Locked label={`${d.gapCount} competitive gaps with priority rankings`} />
        <Locked label={`${d.solutionCount} strategic recommendations with implementation steps & cost estimates`} />
      </div>
    </div>
  );
}

function GrowthPreviewPanel() {
  const d = SAMPLE_GROWTH;
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-emerald-900/80 to-teal-700/80 border border-emerald-500/30 rounded-2xl p-5">
        <div className="text-emerald-300 text-xs uppercase tracking-widest mb-1">Sales Growth Advisor</div>
        <div className="font-syne font-bold text-xl text-white">{d.businessName}</div>
        <div className="text-emerald-200 text-sm mb-3">{d.businessType} · {d.location}</div>
        <div>
          <div className="text-emerald-300 text-xs uppercase tracking-wide mb-0.5">Total Revenue Opportunity</div>
          <div className="font-syne font-black text-3xl text-white">{d.revenueRange}</div>
          <div className="text-emerald-300 text-xs">estimated monthly range</div>
        </div>
        <div className="mt-3 bg-white/10 rounded-xl px-4 py-2.5 text-xs text-white">
          <span className="text-emerald-300 font-semibold uppercase text-xs">Top Quick Win: </span>
          {d.topQuickWin.slice(0, 90)}…
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-2">
          Growth Opportunities ({d.opportunities.length} identified)
        </div>
        <div className="space-y-2">
          {d.opportunities.map((o, i) => (
            <div key={i} className="bg-white/8 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium">{o.title}</div>
                <div className="text-xs text-blue-300 mt-0.5">Effort: {o.effort}</div>
              </div>
              <div className="text-green-400 font-semibold text-sm flex-shrink-0">{o.revenue}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Locked label={`${d.competitorCount} competitors analyzed — products, tactics & channels`} />
        <Locked label="90-Day action roadmap across 3 phases" />
        <Locked label={`${d.trendCount} local market trend signals identified`} />
        <Locked label="Local provider recommendations for each opportunity" />
      </div>
    </div>
  );
}

export default function LandingScreen({ onGetStarted, onLogin }: Props) {
  const [activeTab, setActiveTab] = useState<'competitive' | 'growth'>('competitive');
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white">
      <nav className="flex justify-between items-center px-8 py-5 max-w-7xl mx-auto">
        <div className="font-syne font-bold text-xl tracking-tight">
          SiteAnalyzer <span className="text-blue-300">Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguagePicker variant="minimal" />
          <button onClick={onLogin} className="text-sm text-blue-200 hover:text-white transition-colors">
            {t.signIn}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-800/50 border border-blue-600/30 rounded-full px-4 py-2 text-sm text-blue-200 mb-8">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          {t.aiPowered}
        </div>

        <h1 className="font-syne font-extrabold text-5xl md:text-6xl leading-tight mb-6">
          {t.heroHeadline1}<br />
          <span className="text-blue-300">{t.heroHeadline2}</span>
        </h1>

        <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.heroSub}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-900 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            {t.getReport}
          </button>
          <button
            onClick={onLogin}
            className="border border-blue-400/40 text-blue-200 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-blue-800/50 transition-colors"
          >
            {t.viewSavedReports}
          </button>
        </div>

        <p className="text-blue-400 text-lg font-semibold mt-6">
          {t.oneTimePayment}
        </p>
      </div>

      {/* Sample Report Preview */}
      <div className="max-w-5xl mx-auto px-8 pb-24">
        <div className="text-center mb-8">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">{t.sampleReport}</div>
          <h2 className="font-syne font-bold text-3xl text-white mb-2">{t.seeExactlyWhatYouGet}</h2>
          <p className="text-blue-300 text-sm">Real report structure — sample data shown below</p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-xl border border-white/20 overflow-hidden">
            <button
              onClick={() => setActiveTab('competitive')}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'competitive' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-white/10'
              }`}
            >
              {t.competitiveAnalysis}
            </button>
            <button
              onClick={() => setActiveTab('growth')}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'growth' ? 'bg-emerald-600 text-white' : 'text-blue-300 hover:bg-white/10'
              }`}
            >
              {t.salesGrowthAdvisor}
            </button>
          </div>
        </div>

        <div className="bg-blue-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          {activeTab === 'competitive' ? <CompetitivePreviewPanel /> : <GrowthPreviewPanel />}

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-blue-300 text-sm mb-4">
              Get your own full report with real competitor data, complete analysis, and all recommendations unlocked.
            </p>
            <button
              onClick={onGetStarted}
              className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              {t.analyzeWebsite}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border-t border-white/10 py-20">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="font-syne font-bold text-2xl text-center mb-12 text-white">What's in every report</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔍', title: 'Deep Competitor Research', desc: '4–5 real local competitors found and analyzed with live web search.' },
              { icon: '📊', title: 'Performance Scoring', desc: 'SEO, digital presence, content, and UX scores with specific findings.' },
              { icon: '🎯', title: 'Gap Analysis', desc: 'Exact capabilities your competitors have that you\'re missing.' },
              { icon: '💡', title: 'Action Roadmap', desc: 'Prioritized recommendations with effort estimates and cost ranges.' },
              { icon: '📍', title: 'Local Focus', desc: 'Set a 1–100 mile radius to analyze only nearby competitors.' },
              { icon: '⬇️', title: 'HTML Export', desc: 'Download a beautiful branded report to share with your team.' },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-syne font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-blue-200 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-5xl mx-auto px-8 py-20">
        <div className="text-center mb-12">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Pricing</div>
          <h2 className="font-syne font-bold text-3xl text-white mb-2">Simple, transparent pricing</h2>
          <p className="text-blue-300 text-sm">Start with our promotional offer — upgrade as you grow</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Promotional — highlighted */}
          <div className="relative bg-white rounded-2xl p-6 text-gray-900 shadow-2xl ring-4 ring-blue-400 order-first sm:order-none sm:-mt-4 sm:-mb-4">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              LIMITED OFFER
            </div>
            <div className="text-center mb-5 pt-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Promotional</div>
              <div className="font-syne font-black text-5xl text-blue-600">$99<span className="text-xl text-gray-400 font-normal">/mo</span></div>
              <div className="text-sm text-gray-400 mt-0.5 line-through">$299/mo regular</div>
            </div>
            <ul className="space-y-2.5 text-sm text-gray-700 mb-6">
              {['50 reports per month', 'Competitive Analysis reports', 'Sales Growth Advisor reports', 'Reports saved forever', 'HTML export & download', 'Cancel anytime'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> {f}</li>
              ))}
            </ul>
            <button onClick={onGetStarted} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
              Get Started — $99/mo
            </button>
          </div>

          {/* Standard */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-white">
            <div className="text-center mb-5">
              <div className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1">Standard</div>
              <div className="font-syne font-black text-5xl">$299<span className="text-xl text-blue-300 font-normal">/mo</span></div>
              <div className="text-xs text-blue-400 mt-0.5">Regular price</div>
            </div>
            <ul className="space-y-2.5 text-sm text-blue-200 mb-6">
              {['50 reports per month', 'Competitive Analysis reports', 'Sales Growth Advisor reports', 'Reports saved forever', 'HTML export & download', 'Cancel anytime'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-blue-400">✓</span> {f}</li>
              ))}
            </ul>
          </div>

          {/* High Volume */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-white">
            <div className="text-center mb-5">
              <div className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1">High Volume</div>
              <div className="font-syne font-black text-5xl">$399<span className="text-xl text-blue-300 font-normal">/mo</span></div>
              <div className="text-xs text-blue-400 mt-0.5">Over 50 reports/month</div>
            </div>
            <ul className="space-y-2.5 text-sm text-blue-200 mb-6">
              {['Unlimited reports', 'Everything in Standard', 'Auto-upgrades at 50+ reports', 'Reports saved forever', 'HTML export & download', 'Cancel anytime'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-blue-400">✓</span> {f}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-blue-400 text-xs mt-6">
          Billed monthly · No long-term contract · All plans include free retrieval of existing reports
        </p>
      </div>

      {/* Final CTA */}
      <div className="text-center py-20">
        <h2 className="font-syne font-bold text-3xl mb-4">{t.readyToOutpace}</h2>
        <p className="text-blue-200 mb-8">Get your full competitive intelligence report in minutes.</p>
        <button
          onClick={onGetStarted}
          className="bg-white text-blue-900 font-semibold px-10 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
        >
          {t.analyzeWebsite}
        </button>
      </div>
    </div>
  );
}
