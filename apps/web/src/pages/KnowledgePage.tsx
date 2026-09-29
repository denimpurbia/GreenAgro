import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Heart,
  Eye,
  MapPin,
  X,
  BookOpen,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sprout,
  Globe,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KnowledgePractice } from '../types';

const FALLBACK_IMAGE = '/images/farmer-hero.jpg';

export const KnowledgePage: React.FC = () => {
  const {
    language,
    t,
    practices,
    practicesLoading,
    practicesError,
    refreshPractices,
    likePractice,
  } = useApp();

  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedPractice, setSelectedPractice] = useState<KnowledgePractice | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const location = useLocation();

  const isPublicPage = location.pathname === '/brics-network';
  const countries = ['All', 'India', 'Brazil', 'Russia', 'China', 'South Africa'];

  useEffect(() => {
    refreshPractices(selectedCountry);
  }, [selectedCountry, refreshPractices]);

  // Keep selected practice synchronized with practices array (e.g. after likes)
  const activePractice = selectedPractice
    ? practices.find((p) => p.id === selectedPractice.id) || selectedPractice
    : null;

  // Handle ESC key to close modal & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPractice(null);
        setIsShareModalOpen(false);
      }
    };
    if (selectedPractice || isShareModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPractice, isShareModalOpen]);

  const handleCountrySelect = (c: string) => {
    setSelectedCountry(c);
  };

  const handleImgError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.src.includes('farmer-hero')) {
      img.src = FALLBACK_IMAGE;
    }
  }, []);

  return (
    <div
      className={
        isPublicPage
          ? 'w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-8 sm:py-12 space-y-8'
          : 'w-full space-y-6'
      }
    >
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f291e] tracking-tight">
            {t('knowledge.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {t('knowledge.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white font-semibold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('knowledge.sharePractice')}</span>
        </button>
      </div>

      {/* ── Country Filter Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {countries.map((c) => (
          <button
            key={c}
            onClick={() => handleCountrySelect(c)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCountry === c
                ? 'bg-[#156637] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:text-[#156637] hover:bg-[#f2f6f2] border border-gray-200'
            }`}
          >
            {c === 'All' ? t('knowledge.all') || 'All' : c}
          </button>
        ))}
      </div>

      {/* ── Loading State ──────────────────────────────────────────────────── */}
      {practicesLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse space-y-4"
            >
              <div className="w-full h-48 bg-gray-100 rounded-xl" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* ── Error State ────────────────────────────────────────────────────── */}
      {!practicesLoading && practicesError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="font-bold text-sm text-gray-900">Unable to load BRICS practices</h3>
          <p className="text-xs text-gray-600">{practicesError}</p>
          <button
            onClick={() => refreshPractices(selectedCountry)}
            className="px-4 py-2 rounded-xl bg-[#156637] text-white text-xs font-semibold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────────────────────── */}
      {!practicesLoading && !practicesError && practices.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-base text-gray-900">No practices found</h3>
          <p className="text-xs text-gray-500">
            No agricultural practices currently documented for {selectedCountry}.
          </p>
        </div>
      )}

      {/* ── Card Grid ───────────────────────────────────────────────────────── */}
      {!practicesLoading && !practicesError && practices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {practices.map((practice) => (
            <article
              key={practice.id}
              onClick={() => setSelectedPractice(practice)}
              className="group bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-300 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
            >
              {/* 1. Image Header */}
              <div className="relative w-full h-48 sm:h-52 shrink-0 overflow-hidden bg-gray-100">
                <img
                  src={practice.imageUrl}
                  alt={practice.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={handleImgError}
                  loading="lazy"
                />
                {/* Country badge */}
                <span className="absolute top-3.5 left-3.5 z-10 bg-white/95 backdrop-blur-xs text-xs font-bold text-gray-900 px-3 py-1 rounded-lg border border-gray-200 shadow-xs">
                  {practice.country}
                </span>

                {practice.crop && (
                  <span className="absolute top-3.5 right-3.5 z-10 bg-gray-900/80 backdrop-blur-xs text-xs font-medium text-white px-2.5 py-1 rounded-lg">
                    {practice.crop}
                  </span>
                )}

                {/* Verified Source Badge */}
                <span className="absolute bottom-3 left-3 z-10 bg-[#156637]/95 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Verified · {practice.sourceOrganization || practice.evidenceType}</span>
                </span>
              </div>

              {/* 2. Content Body */}
              <div className="flex flex-col flex-1 p-4 sm:p-6">
                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#156637] shrink-0" />
                  <span className="truncate">{practice.region}</span>
                </div>

                {/* Title */}
                <div className="min-h-0 sm:min-h-[3.25rem] mb-2 flex items-start">
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-snug line-clamp-2 group-hover:text-[#156637] transition-colors">
                    {practice.title}
                  </h3>
                </div>

                {/* Description */}
                <div className="min-h-0 sm:min-h-[4.25rem] mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {practice.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-gray-100 min-h-0 sm:min-h-[2.5rem] items-center">
                  {practice.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-[#f0fdf4] text-[#166534] text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-green-200/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3. Footer */}
              <div className="px-4 sm:px-6 py-3 bg-[#fbfdfb] border-t border-gray-100 flex items-center justify-between shrink-0">
                <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span>
                    {practice.views} {language === 'hi' ? 'देखा गया' : 'views'}
                  </span>
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-[#156637] group-hover:underline flex items-center gap-1">
                    Details ↗
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      likePractice(practice.id);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-rose-600 transition-colors group/btn py-1 px-2 rounded-lg hover:bg-rose-50/60 cursor-pointer"
                    title="Endorse this agricultural practice"
                  >
                    <Heart className="w-4 h-4 text-rose-500 group-hover/btn:scale-110 transition-transform fill-rose-50" />
                    <span>{practice.likes}</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Knowledge Detail Modal ────────────────────────────────────────── */}
      {activePractice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs"
          onClick={() => setSelectedPractice(null)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Header */}
            <div className="relative w-full h-56 sm:h-72 md:h-80 shrink-0 overflow-hidden bg-gray-900">
              <img
                src={activePractice.imageUrl}
                alt={activePractice.title}
                className="w-full h-full object-cover"
                onError={handleImgError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

              {/* Top Badges */}
              <div className="absolute top-3.5 left-3.5 right-12 z-10 flex flex-wrap items-center gap-2">
                <span className="bg-white/95 backdrop-blur-xs text-xs font-bold text-gray-900 px-3 py-1 rounded-lg border border-gray-200 shadow-xs">
                  {activePractice.country}
                </span>

                <span className="bg-gray-900/80 backdrop-blur-xs text-xs font-medium text-white px-3 py-1 rounded-lg">
                  {activePractice.practiceType}
                </span>

                <span className="bg-[#156637] backdrop-blur-xs text-xs font-semibold text-white px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Verified Source</span>
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedPractice(null)}
                className="absolute top-3.5 right-3.5 z-20 p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image Attribution Strip */}
              {(activePractice.imageAttribution || activePractice.imageSource) && (
                <div className="absolute bottom-2.5 right-3 z-10 text-[10px] sm:text-xs text-white/85 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md max-w-[85%] truncate">
                  Photo: {activePractice.imageAttribution || activePractice.imageSource}
                  {activePractice.imageLicense ? ` (${activePractice.imageLicense})` : ''}
                </div>
              )}
            </div>

            {/* Modal Scrollable Content */}
            <div className="overflow-y-auto p-5 sm:p-7 md:p-8 space-y-6 text-gray-800">
              {/* Title & Key Attributes */}
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0f291e] tracking-tight leading-tight">
                  {activePractice.title}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-[#f8faf7] p-2.5 rounded-xl border border-gray-100">
                    <MapPin className="w-4 h-4 text-[#156637] shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Location</span>
                      <span className="font-semibold text-gray-800 truncate">{activePractice.region}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-[#f8faf7] p-2.5 rounded-xl border border-gray-100">
                    <Sprout className="w-4 h-4 text-[#156637] shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Target Crop</span>
                      <span className="font-semibold text-gray-800 truncate">{activePractice.crop}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-[#f8faf7] p-2.5 rounded-xl border border-gray-100">
                    <Globe className="w-4 h-4 text-[#156637] shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Climate Zone</span>
                      <span className="font-semibold text-gray-800 truncate">{activePractice.climateZone || 'Semi-Arid'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-[#f8faf7] p-2.5 rounded-xl border border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-[#156637] shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Evidence Type</span>
                      <span className="font-semibold text-gray-800 truncate">{activePractice.evidenceType}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Overview */}
              <section className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#156637]" />
                  Overview
                </h4>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed bg-[#f9faf8] p-4 rounded-xl border border-gray-100">
                  {activePractice.description}
                </p>
              </section>

              {/* 2. How the practice works */}
              <section className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  How The Practice Works
                </h4>
                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs space-y-2">
                  {activePractice.practiceDetails.split('\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </section>

              {/* 3. Research / Evidence */}
              <section className="space-y-3 bg-[#f2f8f3] p-5 rounded-2xl border border-emerald-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#156637] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Verified Research &amp; Evidence
                  </h4>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#156637] self-start sm:self-auto">
                    {activePractice.evidenceType}
                  </span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-emerald-200/60 text-xs">
                    <div>
                      <span className="text-gray-500 font-medium">Source Organization:</span>
                      <p className="font-bold text-gray-900">{activePractice.sourceOrganization}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Publication / Source:</span>
                      <p className="font-bold text-gray-900">{activePractice.sourceTitle}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Year Documented:</span>
                      <p className="font-bold text-gray-900">{activePractice.sourceYear || 'Verified'}</p>
                    </div>
                  </div>

                  {activePractice.researchEvidence && activePractice.researchEvidence.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-bold text-gray-800">Documented Evidence:</span>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-xs text-gray-600">
                        {activePractice.researchEvidence.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activePractice.sourceUrl && (
                    <div className="pt-3">
                      <a
                        href={activePractice.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white font-semibold text-xs transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xs cursor-pointer"
                      >
                        <span>View Original Source</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* 4. Why it matters (Evidence-Supported Benefits) */}
              {activePractice.expectedBenefit && (
                <section className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Why It Matters (Evidence-Supported Benefits)
                  </h4>
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                    {activePractice.expectedBenefit}
                  </div>
                </section>
              )}

              {/* 5. BRICS Knowledge Relevance */}
              {activePractice.bricsRelevance && (
                <section className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    BRICS Knowledge Relevance
                  </h4>
                  <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 text-xs sm:text-sm text-sky-950 leading-relaxed">
                    <p>{activePractice.bricsRelevance}</p>
                    <p className="mt-1 text-[11px] text-sky-700 italic">
                      Presented as knowledge-sharing relevance; actual agronomic suitability must be evaluated based on local conditions.
                    </p>
                  </div>
                </section>
              )}

              {/* 6. Adaptation for Farmers */}
              <section className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Adaptation For Farmers
                </h4>
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs sm:text-sm text-amber-900 leading-relaxed space-y-1.5">
                  <p className="font-semibold text-amber-950">
                    Potentially adaptable where local soil, climate, water availability and farming systems are suitable.
                  </p>
                  {activePractice.adaptationNotes && (
                    <p className="text-amber-800 text-xs">{activePractice.adaptationNotes}</p>
                  )}
                </div>
              </section>

              {/* 7. Provenance & Attribution */}
              <section className="pt-4 border-t border-gray-100 text-[11px] text-gray-500 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Data Provenance &amp; Attribution
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-700">Repository Citation:</span> {activePractice.sourceTitle}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Source Link:</span>{' '}
                    <a
                      href={activePractice.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#156637] hover:underline break-all"
                    >
                      {activePractice.sourceUrl}
                    </a>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Image License:</span> {activePractice.imageLicense || 'Open/Verified'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Photo Credit:</span> {activePractice.imageAttribution || 'Documented research site'}
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => likePractice(activePractice.id)}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-rose-600 transition-colors py-2 px-3 rounded-xl bg-white border border-gray-200 hover:bg-rose-50/60 cursor-pointer shadow-2xs"
              >
                <Heart className="w-4 h-4 text-rose-500 fill-rose-50" />
                <span>Endorse ({activePractice.likes})</span>
              </button>

              <button
                onClick={() => setSelectedPractice(null)}
                className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share Practice Modal ─────────────────────────────────────────── */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Share Agricultural Practice</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-4 text-xs text-gray-700">
              <div>
                <label className="block font-bold mb-1">Practice Title</label>
                <input
                  type="text"
                  placeholder="e.g. Traditional Contour Bunding"
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-[#156637]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Target Country / Region</label>
                <select className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-[#156637]">
                  <option>India</option>
                  <option>Brazil</option>
                  <option>Russia</option>
                  <option>China</option>
                  <option>South Africa</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Description &amp; Expected Benefit</label>
                <textarea
                  rows={3}
                  placeholder="Describe agro-ecological benefits..."
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-[#156637]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#156637] text-white font-semibold hover:bg-[#104e2a] cursor-pointer"
                >
                  Submit Practice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
