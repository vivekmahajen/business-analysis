import React from 'react';

interface Props {
  url: string;
  radius: number;
  step: number;
  done: number[];
}

const STEPS = [
  { label: 'Crawling website',       detail: (url: string) => `Scanning ${url}` },
  { label: 'Identifying business',   detail: () => 'Type, location, offerings' },
  { label: 'Finding competitors',    detail: (_: string, radius: number) => `Within ${radius} mile radius` },
  { label: 'Analyzing competitors',  detail: () => 'Features, content, positioning' },
  { label: 'Running gap analysis',   detail: () => 'Comparing capabilities' },
  { label: 'Building recommendations', detail: () => 'Strategies & action plans' },
  { label: 'Compiling report',       detail: () => 'Finalizing your report' },
];

function pctColor(pct: number) {
  if (pct >= 100) return { bar: 'bg-green-500',  text: 'text-green-400',  ring: 'text-green-400' };
  if (pct >= 60)  return { bar: 'bg-blue-500',   text: 'text-blue-300',   ring: 'text-blue-400' };
  if (pct >= 30)  return { bar: 'bg-yellow-400', text: 'text-yellow-300', ring: 'text-yellow-400' };
  return           { bar: 'bg-orange-400', text: 'text-orange-300', ring: 'text-orange-400' };
}

export default function GeneratingScreen({ url, radius, step, done }: Props) {
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const pct = Math.round((done.length / STEPS.length) * 100);
  const colors = pctColor(pct);
  const isComplete = pct >= 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-white">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-800/50 border border-blue-600/30 rounded-full px-4 py-2 text-sm text-blue-200 mb-5">
            <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-green-400' : 'bg-blue-400 animate-pulse'}`} />
            {isComplete ? 'Analysis Complete' : 'AI Analysis in Progress'}
          </div>
          <h1 className="font-syne font-bold text-3xl mb-1">Analyzing {displayUrl}</h1>
          <p className="text-blue-300 text-sm">This typically takes 60–90 seconds</p>
        </div>

        {/* Progress bar + percentage */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-300 font-medium">Overall Progress</span>
            <span className={`text-2xl font-syne font-black tabular-nums ${colors.text}`}>
              {pct}%
            </span>
          </div>

          {/* Track */}
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Step counter */}
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-white/30">
              {done.length} of {STEPS.length} steps complete
            </span>
            {!isComplete && (
              <span className="text-xs text-white/30">
                {STEPS.length - done.length} remaining
              </span>
            )}
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-2">
          {STEPS.map((s, i) => {
            const isDone   = done.includes(i);
            const isActive = i === step && !isDone;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                  isDone
                    ? 'bg-green-500/10 border-green-500/25'
                    : isActive
                    ? 'bg-blue-500/20 border-blue-400/40'
                    : 'bg-white/5 border-white/8 opacity-45'
                }`}
              >
                {/* Icon */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                  isDone   ? 'bg-green-500' :
                  isActive ? 'bg-blue-500'  : 'bg-white/10'
                }`}>
                  {isDone ? (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-white/40 text-xs font-medium">{i + 1}</span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${isDone || isActive ? 'text-white' : 'text-white/45'}`}>
                    {s.label}
                  </div>
                  <div className={`text-xs truncate ${isDone ? 'text-green-400/70' : isActive ? 'text-blue-200' : 'text-white/25'}`}>
                    {s.detail(url, radius)}
                  </div>
                </div>

                {/* Right badge */}
                {isDone && (
                  <span className="text-green-400 text-xs font-semibold flex-shrink-0">✓</span>
                )}
                {isActive && (
                  <span className="text-blue-300 text-xs flex-shrink-0 animate-pulse">Running…</span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-blue-400/60 text-xs mt-7">
          Powered by Claude AI with real-time web search
        </p>
      </div>
    </div>
  );
}
