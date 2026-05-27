import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { LANG_META } from '../i18n';

const REGIONS = ['All', 'European', 'Middle East', 'South Asian', 'East Asian', 'Southeast Asian', 'African'];

interface Props {
  variant?: 'full' | 'minimal';
  className?: string;
}

export default function LanguagePicker({ variant = 'full', className = '' }: Props) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeRegion, setActiveRegion] = useState('All');
  const searchRef = useRef<HTMLInputElement>(null);

  const currentMeta = LANG_META[lang] ?? Object.values(LANG_META)[0];

  // Focus search input when modal opens
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setSearch('');
        setActiveRegion('All');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const filteredLanguages = Object.entries(LANG_META).filter(([code, meta]) => {
    const matchesSearch =
      search.trim() === '' ||
      meta.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      meta.englishName.toLowerCase().includes(search.toLowerCase()) ||
      code.toLowerCase().includes(search.toLowerCase());

    const matchesRegion =
      activeRegion === 'All' || meta.region === activeRegion;

    return matchesSearch && matchesRegion;
  });

  const handleSelectLanguage = (code: string) => {
    setLang(code);
    setOpen(false);
    setSearch('');
    setActiveRegion('All');
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setOpen(false);
      setSearch('');
      setActiveRegion('All');
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 text-sm text-white/80 hover:text-white transition-all cursor-pointer ${className}`}
        aria-label="Select language"
        type="button"
      >
        <span className="text-base leading-none">{currentMeta?.flag ?? '🌐'}</span>
        {variant === 'full' && (
          <span className="font-medium">{currentMeta?.nativeName ?? lang}</span>
        )}
        <svg
          className="w-3 h-3 opacity-60 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Modal Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleOverlayClick}
          aria-modal="true"
          role="dialog"
          aria-label="Language selector"
        >
          {/* Modal Panel */}
          <div className="bg-[#12151E] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between">
                <h2
                  className="text-lg font-semibold text-white"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Select Language
                </h2>
                <button
                  onClick={() => {
                    setOpen(false);
                    setSearch('');
                    setActiveRegion('All');
                  }}
                  className="text-white/40 hover:text-white/80 transition-colors"
                  aria-label="Close language picker"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Input */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 mt-3">
                <svg
                  className="w-4 h-4 text-white/30 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search languages..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="text-white/30 hover:text-white/60 transition-colors"
                    type="button"
                    aria-label="Clear search"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Region Filter Tabs */}
            <div className="px-4 py-3 border-b border-white/5">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    onClick={() => setActiveRegion(region)}
                    type="button"
                    className={`text-xs px-3 py-1 rounded-full border cursor-pointer whitespace-nowrap transition-all flex-shrink-0 ${
                      activeRegion === region
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                        : 'border-white/10 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 overflow-y-auto flex-1">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map(([code, meta]) => {
                  const isSelected = code === lang;
                  return (
                    <button
                      key={code}
                      onClick={() => handleSelectLanguage(code)}
                      type="button"
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-left ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500/30'
                          : 'border-transparent hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="text-xl leading-none flex-shrink-0">{meta.flag}</span>
                      <div className="min-w-0">
                        <div
                          className={`font-medium truncate ${isSelected ? 'text-blue-300' : 'text-white'}`}
                          style={{ fontSize: '13px' }}
                        >
                          {meta.nativeName}
                        </div>
                        <div
                          className="text-white/40 truncate"
                          style={{ fontSize: '10px' }}
                        >
                          {meta.englishName}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-2 sm:col-span-3 text-center text-white/30 text-sm py-8">
                  No languages found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
