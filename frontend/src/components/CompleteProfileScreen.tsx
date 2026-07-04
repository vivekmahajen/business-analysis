import React, { useState } from 'react';
import { AuthResponse } from '../types';
import { api } from '../utils/api';

interface Props {
  pendingToken: string;
  needsPhone: boolean;
  userRole?: string;
  onSuccess: (response: AuthResponse) => void;
  onOtpRequired: (response: AuthResponse) => void;
}

export default function CompleteProfileScreen({ pendingToken, needsPhone, userRole, onSuccess, onOtpRequired }: Props) {
  const [phone, setPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isBusinessOwner = userRole === 'business_owner';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (needsPhone) {
        const result = await api.updatePhone(pendingToken, phone);
        // updatePhone → issues pending_2fa token for OTP verification
        onOtpRequired(result);
      } else {
        // Phone already verified, just need websiteUrl (business_owner)
        const result = await api.completeProfile(pendingToken, isBusinessOwner ? websiteUrl : undefined);
        onSuccess(result);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="font-syne font-bold text-2xl text-gray-900 mb-2">Complete your profile</h1>
            <p className="text-gray-500 text-sm">
              {needsPhone
                ? 'We need your phone number to keep your account secure.'
                : 'One more step — add your business website to finish setup.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {needsPhone && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  placeholder="(555) 123-4567"
                  autoComplete="tel"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <p className="text-xs text-gray-400 mt-1">US phone numbers only. We'll send a verification code.</p>
              </div>
            )}

            {!needsPhone && (
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Business website
                </label>
                <input
                  id="website"
                  type="text"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  required
                  placeholder="https://yourbusiness.com"
                  autoComplete="url"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <p className="text-xs text-gray-400 mt-1">Each website can only be registered to one account.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Please wait…' : needsPhone ? 'Send verification code' : 'Complete setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
