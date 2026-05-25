import React from 'react';

interface Props {
  url: string;
  radius: number;
  step: number;
  done: number[];
}

const STEPS = [
  { label: 'Crawling website', detail: (url: string) => `Scanning ${url}` },
  { label: 'Identifying business', detail: () => 'Type, location, offerings' },
  { label: 'Finding competitors', detail: (_: string, radius: number) => `Within ${radius} mile radius` },
  { label: 'Analyzing competitors', detail: () => 'Features, content, positioning' },
  { label: 'Running gap analysis', detail: () => 'Comparing capabilities' },
  { label: 'Building recommendations', detail: () => 'Strategies & action plans' },
  { label: 'Compiling report', detail: () => 'Finalizing your report' },
];

export default function GeneratingScreen({ url, radius, step, done }: Props) {
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-white">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-800/50 border border-blue-600/30 rounded-full px-4 py-2 text-sm text-blue-200 mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            AI Analysis in Progress
          </div>
          <h1 className="font-syne font-bold text-3xl mb-2">Analyzing {displayUrl}</h1>
          <p className="text-blue-300 text-sm">This typically takes 60–90 seconds</p>
        </div>

        <div className="space-y-3">
          {STEPS.map((s, i) => {
            const isDone = done.includes(i);
            const isActive = i === step && !isDone;

            return (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                  isDone
                    ? 'bg-white/10 border border-white/20'
                    : isActive
                    ? 'bg-blue-500/20 border border-blue-400/40'
                    : 'bg-white/5 border border-white/10 opacity-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDone ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-white/10'
                }`}>
                  {isDone ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-white/40 text-xs">{i + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${isDone ? 'text-white' : isActive ? 'text-white' : 'text-white/50'}`}>
                    {s.label}
                  </div>
                  <div className={`text-xs truncate ${isDone ? 'text-blue-300' : isActive ? 'text-blue-200' : 'text-white/30'}`}>
                    {s.detail(url, radius)}
                  </div>
                </div>

                {isDone && (
                  <span className="text-green-400 text-xs flex-shrink-0">Done</span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-blue-400 text-xs mt-8">
          Powered by Claude AI with real-time web search
        </p>
      </div>
    </div>
  );
}
