import React, { useState, useRef, useEffect } from 'react';
import { AuthResponse } from '../types';
import { api } from '../utils/api';

interface Props {
  pendingToken: string;
  phoneHint: string;
  onSuccess: (response: AuthResponse) => void;
  onBack: () => void;
}

export default function OTPVerifyScreen({ pendingToken, phoneHint, onSuccess, onBack }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newDigits.every(d => d !== '')) {
      submitCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      submitCode(pasted);
    }
  };

  const submitCode = async (code: string) => {
    setError('');
    setLoading(true);
    try {
      const result = await api.verifyOtp(pendingToken, code);
      onSuccess(result);
    } catch (e) {
      setError((e as Error).message);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await api.sendOtp(pendingToken);
      startCooldown(60);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      const match = msg.match(/(\d+)s/);
      if (match) startCooldown(parseInt(match[1]));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="text-blue-300 hover:text-white text-sm flex items-center gap-1 transition-colors mb-6"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="font-syne font-bold text-2xl text-gray-900 mb-2">Verify your phone</h1>
            <p className="text-gray-500 text-sm">
              We sent a 6-digit code to <strong>{phoneHint || 'your phone'}</strong>.
              Enter it below to continue.
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:opacity-50"
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm text-center">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center text-sm text-blue-600 mb-4">Verifying…</div>
          )}

          <div className="text-center text-sm text-gray-500">
            Didn't receive a code?{' '}
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="text-blue-600 hover:underline font-medium disabled:text-gray-400 disabled:no-underline"
            >
              {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
