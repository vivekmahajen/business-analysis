import React from 'react';

interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingScreen({ onGetStarted, onLogin }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white">
      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-5 max-w-7xl mx-auto">
        <div className="font-syne font-bold text-xl tracking-tight">
          SiteAnalyzer <span className="text-blue-300">Pro</span>
        </div>
        <button
          onClick={onLogin}
          className="text-sm text-blue-200 hover:text-white transition-colors"
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-800/50 border border-blue-600/30 rounded-full px-4 py-2 text-sm text-blue-200 mb-8">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          AI-Powered Competitive Intelligence
        </div>

        <h1 className="font-syne font-extrabold text-5xl md:text-6xl leading-tight mb-6">
          Know exactly where your<br />
          <span className="text-blue-300">competitors have the edge</span>
        </h1>

        <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-12 leading-relaxed">
          Enter any website URL and get a comprehensive competitive analysis report —
          gap analysis, strengths, weaknesses, and a prioritized action roadmap.
          Powered by Claude AI with real-time web search.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-900 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Get Your Report — $99
          </button>
          <button
            onClick={onLogin}
            className="border border-blue-400/40 text-blue-200 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-blue-800/50 transition-colors"
          >
            View Saved Reports
          </button>
        </div>

        <p className="text-blue-400 text-sm mt-6">
          One-time payment · No subscription · Reports saved free forever
        </p>
      </div>

      {/* Features */}
      <div className="bg-white/5 border-t border-white/10 py-20">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="font-syne font-bold text-2xl text-center mb-12 text-white">
            What's in every report
          </h2>
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

      {/* CTA */}
      <div className="text-center py-20">
        <h2 className="font-syne font-bold text-3xl mb-4">Ready to outpace your competition?</h2>
        <p className="text-blue-200 mb-8">Get your full competitive intelligence report in minutes.</p>
        <button
          onClick={onGetStarted}
          className="bg-white text-blue-900 font-semibold px-10 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
        >
          Analyze a Website — $99
        </button>
      </div>
    </div>
  );
}
