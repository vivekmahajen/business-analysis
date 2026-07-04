import React, { useState } from 'react';

interface Props {
  codes: string[];
  onDone: () => void;
}

export default function RecoveryCodesScreen({ codes, onDone }: Props) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codes.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <div className="font-semibold text-amber-800 text-sm">Save your recovery codes</div>
                <div className="text-amber-700 text-xs mt-0.5">
                  These codes will not be shown again. Store them somewhere safe — you'll need one if you lose access to your phone.
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm mb-4">
              <div className="grid grid-cols-2 gap-2">
                {codes.map((code, i) => (
                  <div key={i} className="text-gray-700 select-all">
                    {code.match(/.{1,8}/g)?.join('-') ?? code}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied!' : 'Copy all codes'}
            </button>

            <label className="flex items-start gap-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
              />
              <span className="text-sm text-gray-700">
                I have saved my recovery codes in a secure location
              </span>
            </label>

            <button
              onClick={onDone}
              disabled={!confirmed}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Continue to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
