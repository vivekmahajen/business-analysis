import React from 'react';
import { AnalysisEntry } from '../types';

interface Props {
  entry: AnalysisEntry;
  onViewFree: () => void;
  onGenerateNew: () => void;
  onBack: () => void;
}

export default function FoundScreen({ entry, onViewFree, onGenerateNew, onBack }: Props) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-900 text-sm mb-6 flex items-center gap-1 transition-colors"
        >
          ← Dashboard
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl">
              ✓
            </div>
            <div>
              <h1 className="font-syne font-bold text-xl text-gray-900">Report Found</h1>
              <p className="text-sm text-gray-500">We already have an analysis for this URL</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="font-semibold text-gray-900">{entry.data.businessName}</div>
            <div className="text-sm text-gray-500 mt-1 break-all">{entry.url}</div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl font-syne font-bold text-blue-600">{entry.data.overallScore}</span>
              <div>
                <div className="text-xs text-gray-500">Overall score</div>
                <div className="text-xs text-gray-400">{entry.data.marketPosition}</div>
              </div>
              <div className="ml-auto text-xs text-gray-400">
                Generated {formatDate(entry.at)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onViewFree}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              View Existing Report — Free
            </button>

            <button
              onClick={onGenerateNew}
              className="w-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors"
            >
              Generate Fresh Report — $99
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            A fresh report re-runs the analysis with current data
          </p>
        </div>
      </div>
    </div>
  );
}
